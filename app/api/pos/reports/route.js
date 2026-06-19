import { fail, handleRouteError, ok } from "@/lib/api-response";
import { canAccessPOS, getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function getRangeStart(range) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  switch (range) {
    case "week":
      start.setDate(start.getDate() - 6);
      return start;
    case "month":
      start.setDate(1);
      return start;
    case "today":
    default:
      return start;
  }
}

function addMapValue(map, key, value) {
  map.set(key, Number(((map.get(key) || 0) + Number(value || 0)).toFixed(2)));
}

function addMapCount(map, key, value = 1) {
  map.set(key, (map.get(key) || 0) + Number(value || 0));
}

function rows(map, valueKey = "value", limit = 8) {
  return Array.from(map.entries())
    .map(([label, value]) => ({ label, [valueKey]: value }))
    .sort((a, b) => b[valueKey] - a[valueKey])
    .slice(0, limit);
}

export async function GET(request) {
  try {
    const user = await getCurrentUser({ suppressDatabaseErrors: true });

    if (!user || !canAccessPOS(user.role)) {
      return fail("POS access required.", 403);
    }

    const { searchParams } = new URL(request.url);
    const range = searchParams.get("range") || "today";
    const start = getRangeStart(range);
    const where = {
      channel: "POS",
      createdAt: {
        gte: start,
      },
      ...(user.role === "CASHIER" ? { cashierUserId: user.id } : {}),
    };

    const sales = await prisma.sale.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        items: true,
        payments: true,
      },
    });

    const paymentRevenue = new Map();
    const productUnits = new Map();
    const cashierRevenue = new Map();
    const revenueTrend = new Map();
    const totalRevenue = sales.reduce((sum, sale) => sum + Number(sale.total || 0), 0);
    const discountTotal = sales.reduce((sum, sale) => sum + Number(sale.discount || 0), 0);
    const taxTotal = sales.reduce((sum, sale) => sum + Number(sale.tax || 0), 0);
    const itemsSold = sales.reduce(
      (sum, sale) => sum + (sale.items || []).reduce((itemSum, item) => itemSum + Number(item.quantity || 0), 0),
      0,
    );

    for (const sale of sales) {
      addMapValue(cashierRevenue, sale.cashierName || "POS", Number(sale.total || 0));
      addMapValue(revenueTrend, new Date(sale.createdAt).toISOString().slice(0, 10), Number(sale.total || 0));

      for (const payment of sale.payments || []) {
        addMapValue(paymentRevenue, payment.method || "cash", Number(payment.amount || 0));
      }

      for (const item of sale.items || []) {
        addMapCount(productUnits, item.name, item.quantity);
      }
    }

    return ok({
      data: {
        range,
        generatedAt: new Date().toISOString(),
        metrics: {
          totalRevenue: Number(totalRevenue.toFixed(2)),
          transactions: sales.length,
          itemsSold,
          averageTransaction: sales.length ? Number((totalRevenue / sales.length).toFixed(2)) : 0,
          discountTotal: Number(discountTotal.toFixed(2)),
          taxTotal: Number(taxTotal.toFixed(2)),
        },
        paymentRevenue: rows(paymentRevenue),
        topProducts: rows(productUnits, "quantity"),
        cashierRevenue: rows(cashierRevenue),
        revenueTrend: Array.from(revenueTrend.entries())
          .map(([label, value]) => ({ label, value }))
          .sort((a, b) => a.label.localeCompare(b.label)),
        recentTransactions: sales.slice(0, 12).map((sale) => ({
          id: sale.id,
          cashierName: sale.cashierName || "POS",
          total: Number(sale.total || 0),
          tax: Number(sale.tax || 0),
          discount: Number(sale.discount || 0),
          paymentMethod: sale.payments?.[0]?.method || "cash",
          itemCount: (sale.items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0),
          createdAt: sale.createdAt,
        })),
      },
    });
  } catch (error) {
    return handleRouteError(error, "Unable to load POS reports.");
  }
}
