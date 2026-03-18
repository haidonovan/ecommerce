import { fail, handleRouteError, ok } from "@/lib/api-response";
import { requireAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serializeOrder } from "@/lib/serializers";

function mapStatus(status) {
  const normalized = String(status || "").toUpperCase();
  return ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"].includes(normalized) ? normalized : null;
}

export async function PATCH(request, { params }) {
  const admin = await requireAdminUser();

  if (!admin) {
    return fail("Admin access required.", 403);
  }

  const body = await request.json();
  const { id } = await params;
  const nextStatus = body.status !== undefined ? mapStatus(body.status) : undefined;

  if (body.status !== undefined && !nextStatus) {
    return fail("Invalid order status.", 422);
  }

  try {
    const updated = await prisma.order.update({
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

    return ok({
      data: serializeOrder(updated),
    });
  } catch (error) {
    return handleRouteError(error, "Unable to update order.", {
      notFoundMessage: "Order not found.",
    });
  }
}
