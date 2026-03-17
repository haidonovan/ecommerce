import { NextResponse } from "next/server";

import { fail } from "@/lib/api-response";
import { normalizeProduct } from "@/lib/catalog";
import { prisma } from "@/lib/prisma";

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updated = await prisma.product.update({
      where: {
        id,
      },
      data: {
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.category !== undefined ? { category: body.category } : {}),
        ...(body.description !== undefined ? { description: body.description } : {}),
        ...(body.imageUrl !== undefined ? { imageUrl: body.imageUrl } : {}),
        ...(body.price !== undefined ? { price: Number(body.price) } : {}),
        ...(body.discountPercent !== undefined ? { discountPercent: Number(body.discountPercent) } : {}),
        ...(body.stock !== undefined ? { stock: Number(body.stock) } : {}),
        ...(body.isActive !== undefined ? { isActive: Boolean(body.isActive) } : {}),
        ...(body.ratingAvg !== undefined ? { ratingAvg: Number(body.ratingAvg) } : {}),
        ...(body.ratingCount !== undefined ? { ratingCount: Number(body.ratingCount) } : {}),
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
  } catch {
    return fail("Unable to update product.", 500);
  }
}
