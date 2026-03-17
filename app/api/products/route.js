import { NextResponse } from "next/server";

import { fail } from "@/lib/api-response";
import { listCatalogProducts } from "@/lib/catalog";
import { prisma } from "@/lib/prisma";
import { productSchema } from "@/lib/validations";

export async function GET() {
  return NextResponse.json({
    data: await listCatalogProducts(),
  });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const result = productSchema.safeParse(body);

    if (!result.success) {
      return fail("Invalid product payload.", 422, {
        issues: result.error.flatten(),
      });
    }

    const created = await prisma.product.create({
      data: {
        name: result.data.name,
        category: result.data.category,
        description: result.data.description,
        imageUrl: result.data.imageUrl,
        price: result.data.price,
        discountPercent: result.data.discountPercent,
        stock: result.data.stock,
      },
    });

    return NextResponse.json({
      data: {
        id: created.id,
        name: created.name,
        category: created.category,
        description: created.description,
        image: created.imageUrl,
        price: Number(created.price),
        discountPercent: created.discountPercent,
        rating: Number(created.ratingAvg),
        ratingCount: created.ratingCount,
        stock: created.stock,
        isActive: created.isActive,
        comments: [],
      },
    });
  } catch {
    return fail("Unable to create product.", 500);
  }
}
