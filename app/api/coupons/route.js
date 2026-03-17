import { fail, ok } from "@/lib/api-response";
import { getCurrentUser, requireAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serializeCoupon } from "@/lib/serializers";

function mapCouponType(type) {
  return String(type || "percent").toUpperCase();
}

function mapAudience(audience) {
  return String(audience || "everyone").toUpperCase();
}

export async function GET() {
  const user = await getCurrentUser();

  const coupons = await prisma.coupon.findMany({
    where: user?.role === "ADMIN"
      ? {}
      : {
          isActive: true,
          OR: [
            { audience: "EVERYONE" },
            ...(user ? [{ userEmail: user.email }] : []),
          ],
        },
    orderBy: {
      createdAt: "desc",
    },
  });

  return ok({
    data: coupons.map(serializeCoupon),
  });
}

export async function POST(request) {
  const admin = await requireAdminUser();

  if (!admin) {
    return fail("Admin access required.", 403);
  }

  const body = await request.json();

  if (!body.code || !body.type || body.value === undefined) {
    return fail("Invalid coupon payload.", 422);
  }

  const created = await prisma.coupon.create({
    data: {
      code: body.code.trim().toUpperCase(),
      type: mapCouponType(body.type),
      value: Number(body.value),
      description: body.description?.trim() || null,
      audience: mapAudience(body.audience),
      userEmail: body.userEmail?.trim() || null,
      isActive: true,
    },
  });

  return ok({
    data: serializeCoupon(created),
  });
}
