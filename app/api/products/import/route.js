import { fail, ok } from "@/lib/api-response";
import { requireAdminUser } from "@/lib/auth";
import { parseCsvRows } from "@/lib/csv";
import { prisma } from "@/lib/prisma";

export async function POST(request) {
  const admin = await requireAdminUser();

  if (!admin) {
    return fail("Admin access required.", 403);
  }

  const body = await request.json();
  const rows = parseCsvRows(body.csv);

  if (!rows.length) {
    return fail("CSV is empty.", 422);
  }

  let importedCount = 0;

  for (const row of rows) {
    if (!row.name || !row.category || !row.description || !row.imageUrl) {
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
      price: Number(row.price || 0),
      stock: Number(row.stock || 0),
      discountPercent: Number(row.discountPercent || 0),
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
  });
}
