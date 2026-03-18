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
      const identifier = row.productId || row.id || row.name;
      const quantity = Number(row.quantity || row.quantityAdded || row.stock || 0);

      if (!identifier || !Number.isInteger(quantity) || quantity <= 0) {
        skippedCount += 1;
        continue;
      }

      const product = row.productId || row.id
        ? await prisma.product.findUnique({ where: { id: identifier } })
        : await prisma.product.findFirst({ where: { name: identifier } });

      if (!product) {
        skippedCount += 1;
        continue;
      }

      await prisma.product.update({
        where: { id: product.id },
        data: {
          stock: {
            increment: quantity,
          },
        },
      });

      importedCount += 1;
    }

    return ok({
      importedCount,
      skippedCount,
    });
  } catch (error) {
    return handleRouteError(error, "Unable to import inventory restocks from CSV.");
  }
}
