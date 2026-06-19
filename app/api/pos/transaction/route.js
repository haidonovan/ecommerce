import { fail, handleRouteError, ok } from "@/lib/api-response";
import { canAccessPOS, getCurrentUser } from "@/lib/auth";
import { createAuditLog, createInventoryMovement } from "@/lib/business-events";
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

    const productIds = [...new Set(items.map((item) => item.productId).filter(Boolean))];
    const products = await prisma.product.findMany({
      where: {
        id: {
          in: productIds,
        },
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

    const sale = await prisma.$transaction(async (tx) => {
      const created = await tx.sale.create({
        data: {
          ...(body.id ? { id: String(body.id) } : {}),
          channel: "POS",
          cashierUserId: user.id,
          cashierName: body.cashierName || user.name || user.email,
          subtotal: toMoney(body.subtotal),
          discount: toMoney(body.discount),
          tax: toMoney(body.tax),
          total: toMoney(body.total),
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
              method: body.paymentMethod || "cash",
              amount: toMoney(body.total),
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

      for (const item of normalizedItems) {
        const stockUpdate = await tx.product.updateMany({
          where: {
            id: item.product.id,
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

        const updatedProduct = await tx.product.findUnique({
          where: {
            id: item.product.id,
          },
          select: {
            stock: true,
          },
        });

        await createInventoryMovement(tx, {
          productId: item.product.id,
          saleId: created.id,
          type: "SALE",
          channel: "POS",
          quantity: item.quantity,
          previousStock: Number(updatedProduct.stock) + item.quantity,
          nextStock: Number(updatedProduct.stock),
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
          paymentMethod: body.paymentMethod || "cash",
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
