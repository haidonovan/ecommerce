import { fail, ok } from "@/lib/api-response";
import { requireAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serializeCoupon } from "@/lib/serializers";

export async function PATCH(request, { params }) {
  const admin = await requireAdminUser();

  if (!admin) {
    return fail("Admin access required.", 403);
  }

  const { id } = await params;
  const body = await request.json();

  const updated = await prisma.coupon.update({
    where: {
      id,
    },
    data: {
      ...(body.isActive !== undefined ? { isActive: Boolean(body.isActive) } : {}),
      ...(body.description !== undefined ? { description: body.description?.trim() || null } : {}),
    },
  });

  return ok({
    data: serializeCoupon(updated),
  });
}
