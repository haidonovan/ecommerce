import { NextResponse } from "next/server";

import { fail, handleRouteError } from "@/lib/api-response";
import { createAuditLog, createInventoryMovement } from "@/lib/business-events";
import { requireAdminUser } from "@/lib/auth";
import { listCatalogProducts, normalizeProduct } from "@/lib/catalog";
import { prisma } from "@/lib/prisma";
import { productSchema } from "@/lib/validations";

export async function GET() {
  return NextResponse.json({
    data: await listCatalogProducts(),
  });
}

export async function POST(request) {
  try {
    const admin = await requireAdminUser();

    if (!admin) {
      return fail("Admin access required.", 403);
    }

    const body = await request.json();
    const result = productSchema.safeParse(body);

    if (!result.success) {
      return fail("Invalid product payload.", 422, {
        issues: result.error.flatten(),
      });
    }

    const created = await prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          name: result.data.name,
          sku: result.data.sku || null,
          barcode: result.data.barcode || null,
          brand: result.data.brand || null,
          category: result.data.category,
          description: result.data.description,
          imageUrl: result.data.imageUrl,
          price: result.data.price,
          costPrice: result.data.costPrice || null,
          wholesalePrice: result.data.wholesalePrice || null,
          discountPercent: result.data.discountPercent,
          stock: result.data.stock,
          minStockAlert: result.data.minStockAlert,
        },
      });

      if (product.stock > 0) {
        await createInventoryMovement(tx, {
          productId: product.id,
          type: "STOCK_IN",
          channel: "POS",
          quantity: product.stock,
          previousStock: 0,
          nextStock: product.stock,
          note: "Initial product stock",
          userId: admin.id,
        });
      }

      await createAuditLog(tx, {
        userId: admin.id,
        action: "CREATE",
        module: "products",
        recordId: product.id,
        newValue: normalizeProduct(product),
      });

      return product;
    });

    return NextResponse.json({
      data: normalizeProduct(created),
    });
  } catch (error) {
    return handleRouteError(error, "Unable to create product.", {
      conflictMessage: "SKU or barcode already exists.",
    });
  }
}
