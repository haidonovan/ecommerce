import { NextResponse } from "next/server";

import { fail, handleRouteError } from "@/lib/api-response";
import { requireAdminUser } from "@/lib/auth";
import { normalizeProduct } from "@/lib/catalog";
import { prisma } from "@/lib/prisma";

export async function PATCH(request, { params }) {
  try {
    const admin = await requireAdminUser();

    if (!admin) {
      return fail("Admin access required.", 403);
    }

    const { id } = await params;
    const body = await request.json();
    const price = body.price !== undefined ? Number(body.price) : undefined;
    const discountPercent = body.discountPercent !== undefined ? Number(body.discountPercent) : undefined;
    const stock = body.stock !== undefined ? Number(body.stock) : undefined;
    const ratingAvg = body.ratingAvg !== undefined ? Number(body.ratingAvg) : undefined;
    const ratingCount = body.ratingCount !== undefined ? Number(body.ratingCount) : undefined;

    if (
      (price !== undefined && (Number.isNaN(price) || price < 0)) ||
      (discountPercent !== undefined && (Number.isNaN(discountPercent) || discountPercent < 0 || discountPercent > 100)) ||
      (stock !== undefined && (!Number.isInteger(stock) || stock < 0)) ||
      (ratingAvg !== undefined && (Number.isNaN(ratingAvg) || ratingAvg < 0)) ||
      (ratingCount !== undefined && (!Number.isInteger(ratingCount) || ratingCount < 0))
    ) {
      return fail("Invalid product update payload.", 422);
    }

    const updated = await prisma.product.update({
      where: {
        id,
      },
      data: {
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.category !== undefined ? { category: body.category } : {}),
        ...(body.description !== undefined ? { description: body.description } : {}),
        ...(body.imageUrl !== undefined ? { imageUrl: body.imageUrl } : {}),
        ...(body.price !== undefined ? { price } : {}),
        ...(body.discountPercent !== undefined ? { discountPercent } : {}),
        ...(body.stock !== undefined ? { stock } : {}),
        ...(body.isActive !== undefined ? { isActive: Boolean(body.isActive) } : {}),
        ...(body.ratingAvg !== undefined ? { ratingAvg } : {}),
        ...(body.ratingCount !== undefined ? { ratingCount } : {}),
      },
      include: {
        comments: {
          include: {
            user: {
              select: {
                email: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      data: normalizeProduct(updated),
    });
  } catch (error) {
    return handleRouteError(error, "Unable to update product.", {
      notFoundMessage: "Product not found.",
    });
  }
}
