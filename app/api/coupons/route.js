import { fail, handleRouteError, ok } from "@/lib/api-response";
import { getCurrentUser, requireAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serializeCoupon } from "@/lib/serializers";

function mapCouponType(type) {
  return String(type || "percent").toLowerCase() === "fixed" ? "FIXED" : "PERCENT";
}

function mapAudience(audience) {
  const normalized = String(audience || "all").trim().toLowerCase();
  return normalized === "user" || normalized === "specific" ? "USER" : "EVERYONE";
}

export async function GET() {
  try {
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
  } catch (error) {
    return handleRouteError(error, "Unable to load coupons.");
  }
}

export async function POST(request) {
  const admin = await requireAdminUser();

  if (!admin) {
    return fail("Admin access required.", 403);
  }

  const body = await request.json();
  const code = body.code?.trim().toUpperCase();
  const value = Number(body.value);
  const audience = mapAudience(body.audience);
  const userEmail = body.userEmail?.trim().toLowerCase() || null;

  if (!code || !body.type || body.value === undefined || Number.isNaN(value) || value <= 0) {
    return fail("Invalid coupon payload.", 422);
  }

  if (audience === "USER" && !userEmail) {
    return fail("A specific-user coupon requires a target email.", 422);
  }

  try {
    const created = await prisma.coupon.create({
      data: {
        code,
        type: mapCouponType(body.type),
        value,
        description: body.description?.trim() || null,
        audience,
        userEmail,
        isActive: true,
      },
    });

    return ok({
      data: serializeCoupon(created),
    });
  } catch (error) {
    return handleRouteError(error, "Unable to create coupon.", {
      conflictMessage: "Coupon code already exists.",
    });
  }
}
