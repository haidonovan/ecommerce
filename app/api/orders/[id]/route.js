import { fail, handleRouteError, ok } from "@/lib/api-response";
import { createAuditLog } from "@/lib/business-events";
import { canAccessPOS, getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serializeOrder } from "@/lib/serializers";

function mapStatus(status) {
  const normalized = String(status || "").toUpperCase();
  return ["PENDING", "CONFIRMED", "PROCESSING", "PREPARING", "READY", "SHIPPED", "DELIVERED", "COMPLETED", "CANCELLED"].includes(normalized)
    ? normalized
    : null;
}

export async function PATCH(request, { params }) {
  const user = await getCurrentUser();

  if (!user || !canAccessPOS(user.role)) {
    return fail("POS access required.", 403);
  }

  const body = await request.json();
  const { id } = await params;
  const nextStatus = body.status !== undefined ? mapStatus(body.status) : undefined;

  if (body.status !== undefined && !nextStatus) {
    return fail("Invalid order status.", 422);
  }

  try {
    const updated = await prisma.$transaction(async (tx) => {
      const existing = await tx.order.findUnique({
        where: {
          id,
        },
        select: {
          status: true,
          trackingNumber: true,
          trackingCarrier: true,
          trackingStatus: true,
        },
      });

      if (!existing) {
        throw Object.assign(new Error("ORDER_NOT_FOUND"), { code: "P2025" });
      }

      const next = await tx.order.update({
        where: {
          id,
        },
        data: {
          ...(body.status !== undefined ? { status: nextStatus } : {}),
          ...(body.trackingNumber !== undefined ? { trackingNumber: body.trackingNumber || null } : {}),
          ...(body.trackingCarrier !== undefined ? { trackingCarrier: body.trackingCarrier || null } : {}),
          ...(body.trackingStatus !== undefined ? { trackingStatus: body.trackingStatus || null } : {}),
          ...(body.trackingNumber !== undefined || body.trackingCarrier !== undefined || body.trackingStatus !== undefined
            ? { trackingUpdatedAt: new Date() }
            : {}),
        },
        include: {
          lines: true,
        },
      });

      await createAuditLog(tx, {
        userId: user.id,
        action: body.status !== undefined && existing.status !== next.status ? "STATUS_CHANGE" : "UPDATE",
        module: "orders",
        recordId: id,
        oldValue: existing,
        newValue: {
          status: next.status,
          trackingNumber: next.trackingNumber,
          trackingCarrier: next.trackingCarrier,
          trackingStatus: next.trackingStatus,
        },
      });

      return next;
    });

    return ok({
      data: serializeOrder(updated),
    });
  } catch (error) {
    return handleRouteError(error, "Unable to update order.", {
      notFoundMessage: "Order not found.",
    });
  }
}
