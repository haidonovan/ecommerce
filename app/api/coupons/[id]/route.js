import { fail, handleRouteError, ok } from "@/lib/api-response";
import { requireAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serializeCoupon } from "@/lib/serializers";

function mapCouponType(type) {
  return String(type || "percent").toLowerCase() === "fixed" ? "FIXED" : "PERCENT";
}

function mapAudience(audience) {
  const normalized = String(audience || "all").trim().toLowerCase();
  return normalized === "user" || normalized === "specific" ? "USER" : "EVERYONE";
}

export async function PATCH(request, { params }) {
  const admin = await requireAdminUser();

  if (!admin) {
    return fail("Admin access required.", 403);
  }

  const { id } = await params;
  const body = await request.json();
  const audience = body.audience !== undefined ? mapAudience(body.audience) : undefined;
  const userEmail = body.userEmail !== undefined ? body.userEmail?.trim().toLowerCase() || null : undefined;
  const value = body.value !== undefined ? Number(body.value) : undefined;

  if (audience === "USER" && !userEmail) {
    return fail("A specific-user coupon requires a target email.", 422);
  }

  if (value !== undefined && (Number.isNaN(value) || value <= 0)) {
    return fail("Invalid coupon value.", 422);
  }

  try {
    const updated = await prisma.coupon.update({
      where: {
        id,
      },
      data: {
        ...(body.isActive !== undefined ? { isActive: Boolean(body.isActive) } : {}),
        ...(body.description !== undefined ? { description: body.description?.trim() || null } : {}),
        ...(body.type !== undefined ? { type: mapCouponType(body.type) } : {}),
        ...(body.value !== undefined ? { value } : {}),
        ...(body.audience !== undefined ? { audience } : {}),
        ...(body.userEmail !== undefined ? { userEmail } : {}),
        ...(body.startsAt !== undefined ? { startsAt: body.startsAt ? new Date(body.startsAt) : null } : {}),
        ...(body.endsAt !== undefined ? { endsAt: body.endsAt ? new Date(body.endsAt) : null } : {}),
      },
    });

    return ok({
      data: serializeCoupon(updated),
    });
  } catch (error) {
    return handleRouteError(error, "Unable to update coupon.", {
      notFoundMessage: "Coupon not found.",
      conflictMessage: "Coupon code already exists.",
    });
  }
}
