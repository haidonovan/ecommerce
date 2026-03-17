import { fail, ok } from "@/lib/api-response";
import { requireAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serializeOrder } from "@/lib/serializers";

function mapStatus(status) {
  return String(status || "").toUpperCase();
}

export async function PATCH(request, { params }) {
  const admin = await requireAdminUser();

  if (!admin) {
    return fail("Admin access required.", 403);
  }

  const body = await request.json();
  const { id } = await params;

  const updated = await prisma.order.update({
    where: {
      id,
    },
    data: {
      ...(body.status ? { status: mapStatus(body.status) } : {}),
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
}
