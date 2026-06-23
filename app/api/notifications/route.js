import { fail, handleRouteError, ok } from "@/lib/api-response";
import { requireAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function productName(product) {
  return product?.nameKh || product?.name || "Unknown product";
}

function stockMessage(type, inventory) {
  const name = productName(inventory.product);
  const branch = inventory.branch?.name || "Main";

  if (type === "low_stock") {
    return `ស្តុកទាប / Low stock: ${name} [${branch}] នៅសល់ ${inventory.stock}`;
  }

  return `អស់ស្តុក / Out of stock: ${name} [${branch}]`;
}

function expiryMessage(type, batch) {
  const name = productName(batch.product);
  const branch = batch.branch?.name || "Main";

  if (type === "expired") {
    return `ផុតកំណត់ / Expired: ${name} [${branch}] Batch ${batch.batchNumber}`;
  }

  return `ជិតផុតកំណត់ / Expiring soon: ${name} [${branch}] Batch ${batch.batchNumber}`;
}

export async function GET() {
  try {
    const admin = await requireAdminUser();

    if (!admin) {
      return fail("Admin access required.", 403);
    }

    const now = new Date();
    const nextSevenDays = new Date(now);
    nextSevenDays.setDate(now.getDate() + 7);

    const [inventoryRows, expiryRows] = await Promise.all([
      prisma.inventory.findMany({
        include: {
          product: true,
          branch: true,
        },
      }),
      prisma.inventoryBatch.findMany({
        where: {
          qty: {
            gt: 0,
          },
          expiryDate: {
            lte: nextSevenDays,
          },
        },
        include: {
          product: true,
          branch: true,
        },
        orderBy: {
          expiryDate: "asc",
        },
      }),
    ]);

    const lowStock = inventoryRows
      .filter((row) => row.stock > 0 && row.stock <= (row.product?.minStockAlert || 5))
      .map((row) => ({
        id: `low-stock-${row.id}`,
        type: "low_stock",
        severity: "warning",
        message: stockMessage("low_stock", row),
        href: "/admin?tab=inventory",
        createdAt: new Date().toISOString(),
      }));

    const outOfStock = inventoryRows
      .filter((row) => row.stock === 0)
      .map((row) => ({
        id: `out-stock-${row.id}`,
        type: "out_of_stock",
        severity: "danger",
        message: stockMessage("out_of_stock", row),
        href: "/admin?tab=inventory",
        createdAt: new Date().toISOString(),
      }));

    const expired = expiryRows
      .filter((batch) => batch.expiryDate < now)
      .map((batch) => ({
        id: `expired-${batch.id}`,
        type: "expired",
        severity: "danger",
        message: expiryMessage("expired", batch),
        href: "/admin/inventory/expiry?tab=expired",
        createdAt: batch.expiryDate,
      }));

    const expiringSoon = expiryRows
      .filter((batch) => batch.expiryDate >= now)
      .map((batch) => ({
        id: `expiring-${batch.id}`,
        type: "expiring_soon",
        severity: "warning",
        message: expiryMessage("expiring_soon", batch),
        href: "/admin/inventory/expiry?tab=sevenDays",
        createdAt: batch.expiryDate,
      }));

    const groups = {
      lowStock,
      outOfStock,
      expired,
      expiringSoon,
    };

    return ok({
      data: groups,
      alerts: [...expired, ...expiringSoon, ...outOfStock, ...lowStock],
      total: Object.values(groups).reduce((sum, group) => sum + group.length, 0),
    });
  } catch (error) {
    return handleRouteError(error, "Unable to load notifications.");
  }
}
