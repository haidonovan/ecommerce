import { fail, handleRouteError, ok } from "@/lib/api-response";
import { canAccessPOS, getCurrentUser } from "@/lib/auth";
import { calculateDeposits, createContainerIssues, createAuditLog, createInventoryMovement } from "@/lib/business-events";
import { prisma } from "@/lib/prisma";

function toMoney(value) {
  return Number(Number(value || 0).toFixed(2));
}

export async function POST(request) {
  try {
    const user = await getCurrentUser();

    if (!user || !canAccessPOS(user.role)) {
      return fail("POS access required.", 403);
    }

    const body = await request.json();
    const items = Array.isArray(body.items) ? body.items : [];

    if (!items.length) {
      return fail("Transaction requires at least one item.", 422);
    }

    // Verify shift check-in for cashiers
    const activeShift = await prisma.shift.findFirst({
      where: { cashierId: user.id, status: "OPEN" },
    });
    if (user.role === "CASHIER" && !activeShift) {
      return fail("A cash drawer shift must be opened before processing sales.", 403);
    }
    const shiftId = activeShift?.id || null;

    // Resolve branchId
    let branchId = body.branchId || user.branchId;
    if (!branchId) {
      const defaultBranch = await prisma.branch.findFirst({
        where: { code: "HQ" },
      });
      branchId = defaultBranch?.id;
    }

    if (!branchId) {
      return fail("Store branch must be configured.", 422);
    }

    const productIds = [...new Set(items.map((item) => item.productId).filter(Boolean))];
    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
        isActive: true,
      },
    });

    if (products.length !== productIds.length) {
      return fail("One or more products are unavailable.", 422);
    }

    const productMap = new Map(products.map((product) => [product.id, product]));
    const normalizedItems = items.map((item) => {
      const product = productMap.get(item.productId);
      const quantity = Number(item.qty || item.quantity || 0);

      return {
        product,
        quantity,
        note: item.note || null,
      };
    });

    if (normalizedItems.some((item) => !Number.isInteger(item.quantity) || item.quantity <= 0)) {
      return fail("Invalid item quantity.", 422);
    }

    const totalMoney = toMoney(body.total);
    const paymentMethodName = body.paymentMethod || "Cash";

    const sale = await prisma.$transaction(async (tx) => {
      // 1. Resolve Customer & Credit Checks if using credit payment
      let customerId = body.customerId || null;
      
      if (paymentMethodName.toLowerCase() === "customer credit") {
        if (!customerId) {
          throw new Error("CUSTOMER_REQUIRED_FOR_CREDIT");
        }

        const customer = await tx.customer.findUnique({
          where: { id: customerId },
        });

        if (!customer) {
          throw new Error("CUSTOMER_NOT_FOUND");
        }

        const limit = Number(customer.creditLimit || 0);
        const currentBalance = Number(customer.creditBalance || 0);

        if (currentBalance + totalMoney > limit) {
          throw new Error("CREDIT_LIMIT_EXCEEDED");
        }

        // Charge customer credit
        await tx.customer.update({
          where: { id: customerId },
          data: {
            creditBalance: { increment: totalMoney },
          },
        });

        // Log customer credit log
        await tx.customerCredit.create({
          data: {
            customerId,
            branchId,
            type: "CHARGE",
            amount: totalMoney,
            balance: currentBalance + totalMoney,
            note: `POS Sale charge`,
          },
        });
      }

      // 2. Resolve Payment Method
      const pm = await tx.paymentMethod.findFirst({
        where: { name: { equals: paymentMethodName, mode: "insensitive" } },
      });

      // 2.5 Calculate deposits
      const { totalDeposit, itemsList: depositItems } = await calculateDeposits(tx, normalizedItems);

      // 3. Create the POS Sale record
      const created = await tx.sale.create({
        data: {
          ...(body.id ? { id: String(body.id) } : {}),
          channel: "POS",
          branchId,
          cashierUserId: user.id,
          cashierName: body.cashierName || user.name || user.email,
          customerId,
          shiftId,
          subtotal: toMoney(body.subtotal),
          discount: toMoney(body.discount),
          tax: toMoney(body.tax),
          total: totalMoney,
          currency: body.currency || "USD",
          synced: true,
          items: {
            create: normalizedItems.map((item) => ({
              productId: item.product.id,
              name: item.product.name,
              sku: item.product.sku || item.product.id,
              quantity: item.quantity,
              unitPrice: Number(item.product.price),
              note: item.note,
            })),
          },
          payments: {
            create: {
              method: paymentMethodName,
              paymentMethodId: pm?.id || null,
              branchId,
              amount: totalMoney,
              currency: body.currency || "USD",
              reference: body.reference || null,
            },
          },
        },
        include: {
          items: true,
          payments: true,
        },
      });

      // 3.5 Log container issues if customer is associated
      if (customerId && depositItems.length > 0) {
        await createContainerIssues(tx, {
          customerId,
          branchId,
          saleId: created.id,
          itemsList: depositItems,
        });
      }

      // 4. Update branch inventory and create logs
      for (const item of normalizedItems) {
        // Ensure inventory record exists for the branch (initialize to 0 if not present)
        await tx.inventory.upsert({
          where: {
            productId_branchId: {
              productId: item.product.id,
              branchId,
            },
          },
          update: {},
          create: {
            productId: item.product.id,
            branchId,
            stock: 0,
          },
        });

        const stockUpdate = await tx.inventory.updateMany({
          where: {
            productId: item.product.id,
            branchId,
            stock: {
              gte: item.quantity,
            },
          },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });

        if (stockUpdate.count !== 1) {
          throw new Error("INSUFFICIENT_STOCK");
        }

        // Keep fallback global product stock synchronized
        await tx.product.update({
          where: { id: item.product.id },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });

        const updatedInventory = await tx.inventory.findUnique({
          where: {
            productId_branchId: {
              productId: item.product.id,
              branchId,
            },
          },
        });

        await createInventoryMovement(tx, {
          productId: item.product.id,
          branchId,
          saleId: created.id,
          type: "SALE",
          channel: "POS",
          quantity: item.quantity,
          previousStock: Number(updatedInventory.stock) + item.quantity,
          nextStock: Number(updatedInventory.stock),
          note: "POS sale",
          userId: user.id,
        });
      }

      await createAuditLog(tx, {
        userId: user.id,
        action: "CREATE",
        module: "sales",
        recordId: created.id,
        newValue: {
          channel: "POS",
          total: Number(created.total),
          itemCount: normalizedItems.reduce((sum, item) => sum + item.quantity, 0),
          paymentMethod: paymentMethodName,
          branchId,
        },
      });

      return created;
    });

    return ok({
      data: {
        id: sale.id,
        synced: true,
      },
    });
  } catch (error) {
    if (error?.message === "INSUFFICIENT_STOCK") {
      return fail("One or more products no longer have enough stock.", 409);
    }
    if (error?.message === "CUSTOMER_REQUIRED_FOR_CREDIT") {
      return fail("A customer profile is required for credit transactions.", 422);
    }
    if (error?.message === "CUSTOMER_NOT_FOUND") {
      return fail("Linked customer account was not found.", 404);
    }
    if (error?.message === "CREDIT_LIMIT_EXCEEDED") {
      return fail("Customer credit limit exceeded.", 409);
    }

    if (error?.code === "P2002") {
      return ok({
        data: {
          synced: true,
        },
      });
    }

    return handleRouteError(error, "Unable to sync POS transaction.");
  }
}
