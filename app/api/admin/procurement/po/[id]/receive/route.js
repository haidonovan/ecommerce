import { fail, handleRouteError, ok } from "@/lib/api-response";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { createInventoryMovement } from "@/lib/business-events";
import { prisma } from "@/lib/prisma";

export async function POST(request, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, "admin:procurement")) {
      return fail("Unauthorized.", 403);
    }

    const { id } = await params;

    const result = await prisma.$transaction(async (tx) => {
      const po = await tx.purchaseOrder.findUnique({
        where: { id },
        include: {
          items: true,
        },
      });

      if (!po) {
        throw new Error("PO_NOT_FOUND");
      }

      if (po.status === "RECEIVED") {
        throw new Error("PO_ALREADY_RECEIVED");
      }

      if (po.status === "CANCELLED") {
        throw new Error("PO_CANCELLED");
      }

      // 1. Update PO Status
      const updatedPo = await tx.purchaseOrder.update({
        where: { id },
        data: { status: "RECEIVED" },
      });

      // 2. Log Goods Receipt
      const receipt = await tx.goodsReceipt.create({
        data: {
          purchaseOrderId: id,
          receivedById: user.id,
        },
      });

      // 3. Receive stock for each item
      for (const item of po.items) {
        // Upsert inventory record for the branch
        await tx.inventory.upsert({
          where: {
            productId_branchId: {
              productId: item.productId,
              branchId: po.branchId,
            },
          },
          update: {
            stock: { increment: item.quantity },
          },
          create: {
            productId: item.productId,
            branchId: po.branchId,
            stock: item.quantity,
          },
        });

        // Increment global product fallback stock
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
              branchId: po.branchId,
            },
          },
        });

        // Log Stock-in Inventory Movement
        await createInventoryMovement(tx, {
          productId: item.productId,
          branchId: po.branchId,
          type: "STOCK_IN",
          channel: "POS",
          quantity: item.quantity,
          previousStock: Number(updatedInventory.stock) - item.quantity,
          nextStock: Number(updatedInventory.stock),
          note: `Received PO: ${po.id}`,
          userId: user.id,
        });
      }

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "UPDATE",
          module: "procurement",
          recordId: id,
          newValue: {
            status: "RECEIVED",
            goodsReceiptId: receipt.id,
          },
        },
      });

      return updatedPo;
    });

    return ok({ data: result });
  } catch (error) {
    if (error.message === "PO_NOT_FOUND") {
      return fail("Purchase order not found.", 404);
    }
    if (error.message === "PO_ALREADY_RECEIVED") {
      return fail("This purchase order has already been received.", 409);
    }
    if (error.message === "PO_CANCELLED") {
      return fail("This purchase order has been cancelled.", 409);
    }
    return handleRouteError(error, "Unable to fulfill purchase order.");
  }
}
