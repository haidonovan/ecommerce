import { fail, handleRouteError, ok } from "@/lib/api-response";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, "admin:procurement")) {
      return fail("Unauthorized.", 403);
    }

    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get("branchId");
    const status = searchParams.get("status");

    const where = {};
    if (branchId) where.branchId = branchId;
    if (status) where.status = status;

    const pos = await prisma.purchaseOrder.findMany({
      where,
      include: {
        supplier: true,
        branch: true,
        items: {
          include: {
            product: { select: { name: true, sku: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return ok({ data: pos });
  } catch (error) {
    return handleRouteError(error, "Unable to load purchase orders.");
  }
}

export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user, "admin:procurement")) {
      return fail("Unauthorized.", 403);
    }

    const body = await request.json();
    const { supplierId, branchId, items } = body;
    const poItems = Array.isArray(items) ? items : [];

    if (!supplierId || !branchId || !poItems.length) {
      return fail("Supplier, branch, and items are required.", 422);
    }

    const totalAmount = poItems.reduce((sum, item) => sum + Number(item.quantity) * Number(item.costPrice), 0);

    const po = await prisma.$transaction(async (tx) => {
      const created = await tx.purchaseOrder.create({
        data: {
          supplierId,
          branchId,
          status: "PENDING",
          totalAmount,
          items: {
            create: poItems.map((item) => ({
              productId: item.productId,
              quantity: Number(item.quantity),
              costPrice: Number(item.costPrice),
            })),
          },
        },
        include: {
          items: true,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "CREATE",
          module: "procurement",
          recordId: created.id,
          newValue: {
            supplierId,
            branchId,
            totalAmount,
            itemCount: poItems.length,
          },
        },
      });

      return created;
    });

    return ok({ data: po });
  } catch (error) {
    return handleRouteError(error, "Unable to create purchase order.");
  }
}
