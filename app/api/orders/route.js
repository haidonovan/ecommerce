import { fail, ok } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serializeOrder } from "@/lib/serializers";

function mapCouponType(type) {
  if (!type) {
    return null;
  }
  return type === "percent" ? "PERCENT" : "FIXED";
}

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return fail("Not authenticated.", 401);
  }

  const orders = await prisma.order.findMany({
    where: user.role === "ADMIN" ? {} : { userId: user.id },
    include: {
      lines: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return ok({
    data: orders.map(serializeOrder),
  });
}

export async function POST(request) {
  const user = await getCurrentUser();

  if (!user) {
    return fail("Not authenticated.", 401);
  }

  const body = await request.json();
  const shippingAddress = body.shippingAddress?.trim();
  const paymentMethod = body.paymentMethod?.trim();
  const lines = Array.isArray(body.lines) ? body.lines : [];
  const couponCode = body.couponCode?.trim() || null;

  if (!shippingAddress || shippingAddress.length < 8 || !paymentMethod || !lines.length) {
    return fail("Invalid order payload.", 422);
  }

  const productIds = lines.map((line) => line.productId);
  const products = await prisma.product.findMany({
    where: {
      id: {
        in: productIds,
      },
      isActive: true,
    },
  });

  if (products.length !== productIds.length) {
    return fail("Some products are unavailable.", 422);
  }

  const productMap = new Map(products.map((product) => [product.id, product]));
  const normalizedLines = lines.map((line) => {
    const product = productMap.get(line.productId);
    const quantity = Number(line.quantity || 0);
    const unitPrice = Number(product.price) * (1 - product.discountPercent / 100);

    return {
      product,
      quantity,
      unitPrice: Number(unitPrice.toFixed(2)),
    };
  });

  if (normalizedLines.some((line) => line.quantity <= 0 || line.quantity > line.product.stock)) {
    return fail("Invalid quantity for one or more products.", 422);
  }

  const subtotal = normalizedLines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
  let coupon = null;
  if (couponCode) {
    coupon = await prisma.coupon.findFirst({
      where: {
        code: couponCode,
        isActive: true,
      },
    });

    if (!coupon) {
      return fail("Coupon not found or inactive.", 404);
    }

    if (coupon.audience === "USER" && coupon.userEmail && coupon.userEmail !== user.email) {
      return fail("Coupon is not assigned to this account.", 403);
    }
  }

  const couponDiscount = coupon
    ? coupon.type === "PERCENT"
      ? Number(((subtotal * Number(coupon.value)) / 100).toFixed(2))
      : Number(Math.min(Number(coupon.value), subtotal).toFixed(2))
    : 0;

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        userId: user.id,
        shippingAddress,
        paymentMethod,
        subtotal,
        total: subtotal - couponDiscount,
        status: "PENDING",
        couponCode: coupon?.code || null,
        couponType: mapCouponType(coupon?.type.toLowerCase()),
        couponValue: coupon ? Number(coupon.value) : null,
        couponDiscount,
        lines: {
          create: normalizedLines.map((line) => ({
            productId: line.product.id,
            productName: line.product.name,
            quantity: line.quantity,
            unitPrice: line.unitPrice,
            discountPercent: line.product.discountPercent,
          })),
        },
      },
      include: {
        lines: true,
      },
    });

    for (const line of normalizedLines) {
      await tx.product.update({
        where: {
          id: line.product.id,
        },
        data: {
          stock: {
            decrement: line.quantity,
          },
        },
      });
    }

    return created;
  });

  return ok({
    data: serializeOrder(order),
  });
}
