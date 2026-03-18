import { fail, handleRouteError, ok } from "@/lib/api-response";
import { requireAdminUser } from "@/lib/auth";
import { parseCsvRows } from "@/lib/csv";
import { prisma } from "@/lib/prisma";

export async function POST(request) {
  try {
    const admin = await requireAdminUser();

    if (!admin) {
      return fail("Admin access required.", 403);
    }

    const body = await request.json();
    const rows = parseCsvRows(typeof body.csv === "string" ? body.csv : "");

    if (!rows.length) {
      return fail("CSV is empty.", 422);
    }

    let importedCount = 0;
    let skippedCount = 0;

    for (const row of rows) {
      if (!row.name || !row.category || !row.description || !row.imageUrl) {
        skippedCount += 1;
        continue;
      }

      const price = Number(row.price || 0);
      const stock = Number(row.stock || 0);
      const discountPercent = Number(row.discountPercent || 0);

      if (
        Number.isNaN(price) ||
        price < 0 ||
        !Number.isInteger(stock) ||
        stock < 0 ||
        Number.isNaN(discountPercent) ||
        discountPercent < 0 ||
        discountPercent > 100
      ) {
        skippedCount += 1;
        continue;
      }

      const existing = await prisma.product.findFirst({
        where: {
          name: row.name,
        },
        select: {
          id: true,
        },
      });

      const data = {
        name: row.name,
        category: row.category,
        description: row.description,
        imageUrl: row.imageUrl,
        price,
        stock,
        discountPercent,
        isActive: row.isActive ? row.isActive.toLowerCase() !== "false" : true,
      };

      if (existing) {
        await prisma.product.update({
          where: { id: existing.id },
          data,
        });
      } else {
        await prisma.product.create({ data });
      }

      importedCount += 1;
    }

    return ok({
      importedCount,
      skippedCount,
    });
  } catch (error) {
    return handleRouteError(error, "Unable to import products from CSV.");
  }
}
