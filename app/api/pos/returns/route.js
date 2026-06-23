import { fail, handleRouteError, ok } from "@/lib/api-response";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { createInventoryMovement } from "@/lib/business-events";
import { prisma } from "@/lib/prisma";

export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (!user || (!hasPermission(user, "pos:sales") && !hasPermission(user, "pos:returns"))) {
      return fail("Unauthorized.", 403);
    }

    const body = await request.json();
    const { saleId, returns, refundMethod } = body;
    const returnItems = Array.isArray(returns) ? returns : [];

    if (!saleId || !returnItems.length || !refundMethod) {
      return fail("Sale ID, returns array, and refund method are required.", 422);
    }

    const result = await prisma.$transaction(async (tx) => {
      const sale = await tx.sale.findUnique({
        where: { id: saleId },
        include: {
          items: true,
          customer: true,
        },
      });

      if (!sale) {
        throw new Error("SALE_NOT_FOUND");
      }

      const branchId = sale.branchId;
      const refundAmount = returnItems.reduce((sum, item) => sum + Number(item.quantity) * Number(item.unitPrice), 0);

      // 1. Create the Return record
      const returnRecord = await tx.return.create({
        data: {
          saleId,
          cashierId: user.id,
          totalSaved: refundAmount,
          items: {
            create: returnItems.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
            })),
          },
        },
      });

      // 2. Create the Refund record
      await tx.refund.create({
        data: {
          returnId: returnRecord.id,
          paymentMethod: refundMethod,
          amount: refundAmount,
        },
      });

      // 3. Sync branch inventory & log movement
      for (const item of returnItems) {
        await tx.inventory.upsert({
          where: {
            productId_branchId: {
              productId: item.productId,
              branchId,
            },
          },
          update: {
            stock: { increment: item.quantity },
          },
          create: {
            productId: item.productId,
            branchId,
            stock: item.quantity,
          },
        });

        // Sync fallback global stock
        const updatedProduct = await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: { increment: item.quantity },
          },
        });

        const updatedInventory = await tx.inventory.findUnique({
          where: {
            productId_branchId: {
              productId: item.productId,
              branchId,
            },
          },
        });

        await createInventoryMovement(tx, {
          productId: item.productId,
          branchId,
          saleId: sale.id,
          type: "RETURN",
          channel: "POS",
          quantity: item.quantity,
          previousStock: Number(updatedInventory.stock) - item.quantity,
          nextStock: Number(updatedInventory.stock),
          note: `Returned from sale: ${sale.id}`,
          userId: user.id,
        });

        // 4. Reverse container deposits if a customer is linked
        if (sale.customerId) {
          const productDeposits = await tx.productDeposit.findMany({
            where: { productId: item.productId },
          });

          for (const dep of productDeposits) {
            const containerReturnQty = item.quantity * dep.quantity;
            
            // Log empty container return transaction
            await tx.containerTransaction.create({
              data: {
                customerId: sale.customerId,
                depositTypeId: dep.depositTypeId,
                branchId,
                saleId: sale.id,
                type: "RETURN",
                quantity: containerReturnQty,
              },
            });
          }
        }
      }

      // 5. If refund is credited back to wholesale balance
      if (refundMethod.toLowerCase() === "customer credit" && sale.customerId) {
        const customer = await tx.customer.findUnique({
          where: { id: sale.customerId },
        });

        if (customer) {
          const nextBalance = Number(customer.creditBalance) - refundAmount;

          await tx.customer.update({
            where: { id: sale.customerId },
            data: {
              creditBalance: nextBalance,
            },
          });

          // Log customer credit refund payoff
          await tx.customerCredit.create({
            data: {
              customerId: sale.customerId,
              branchId,
              saleId,
              type: "PAYMENT",
              amount: refundAmount,
              balance: nextBalance,
              note: `Deduction from POS returned sale refund`,
            },
          });
        }
      }

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "UPDATE",
          module: "sales",
          recordId: saleId,
          newValue: {
            returnedId: returnRecord.id,
            refundAmount,
            refundMethod,
          },
        },
      });

      return returnRecord;
    });

    return ok({ data: result });
  } catch (error) {
    if (error.message === "SALE_NOT_FOUND") {
      return fail("Original sale record not found.", 404);
    }
    return handleRouteError(error, "Unable to process POS return.");
  }
}
