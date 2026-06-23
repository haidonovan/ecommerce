import Link from "next/link";
import { redirect } from "next/navigation";

import { requireAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";

function startOfDay(value) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function addDays(value, days) {
  const date = startOfDay(value);
  date.setDate(date.getDate() + days);
  return date;
}

function productName(product) {
  return product?.nameKh || product?.name || "Unknown product";
}

function groupBatches(batches) {
  const today = startOfDay(new Date());
  const sevenDays = addDays(today, 7);
  const thirtyDays = addDays(today, 30);

  return {
    expired: batches.filter((batch) => batch.expiryDate < today),
    sevenDays: batches.filter((batch) => batch.expiryDate >= today && batch.expiryDate <= sevenDays),
    thirtyDays: batches.filter((batch) => batch.expiryDate > sevenDays && batch.expiryDate <= thirtyDays),
  };
}

function BatchTable({ rows }) {
  if (!rows.length) {
    return (
      <div className="rounded-[1.2rem] border border-dashed border-[var(--border-soft)] p-8 text-center text-sm text-[var(--muted-foreground)]">
        No batches in this expiry window.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[54rem] text-left text-sm">
        <thead className="text-xs uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
          <tr>
            <th className="px-3 py-2">Product</th>
            <th className="px-3 py-2">Branch</th>
            <th className="px-3 py-2">Batch</th>
            <th className="px-3 py-2">Quantity Left</th>
            <th className="px-3 py-2">Expiry Date</th>
            <th className="px-3 py-2">Cost Value</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((batch) => (
            <tr key={batch.id} className="border-t border-[var(--border-soft)]">
              <td className="px-3 py-3 font-semibold text-[var(--foreground)]">{productName(batch.product)}</td>
              <td className="px-3 py-3 text-[var(--muted-foreground)]">{batch.branch?.name || "Main"}</td>
              <td className="px-3 py-3 font-mono text-xs text-[var(--foreground)]">{batch.batchNumber}</td>
              <td className="px-3 py-3 font-semibold text-[var(--foreground)]">{batch.qty.toLocaleString()}</td>
              <td className="px-3 py-3 text-[var(--muted-foreground)]">{batch.expiryDate.toLocaleDateString()}</td>
              <td className="px-3 py-3 font-semibold text-[var(--foreground)]">{formatCurrency(Number(batch.costPrice) * batch.qty)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function AdminInventoryExpiryPage({ searchParams }) {
  const admin = await requireAdminUser();

  if (!admin) {
    redirect("/login");
  }

  const resolvedParams = await searchParams;
  const activeTab = ["expired", "sevenDays", "thirtyDays"].includes(resolvedParams?.tab) ? resolvedParams.tab : "expired";
  const batches = await prisma.inventoryBatch.findMany({
    where: {
      qty: {
        gt: 0,
      },
    },
    include: {
      product: true,
      branch: true,
    },
    orderBy: {
      expiryDate: "asc",
    },
  });
  const grouped = groupBatches(batches);
  const tabs = [
    { key: "expired", label: "Expired", count: grouped.expired.length },
    { key: "sevenDays", label: "Expiring in 7 Days", count: grouped.sevenDays.length },
    { key: "thirtyDays", label: "Expiring in 30 Days", count: grouped.thirtyDays.length },
  ];

  return (
    <main className="app-shell">
      <section className="app-card p-4 sm:p-6">
        <Link href="/admin?tab=inventory" className="text-sm font-semibold text-[var(--action)]">
          Back to inventory
        </Link>
        <p className="mt-5 text-xs uppercase tracking-[0.28em] text-[var(--muted-foreground)]">Expiry Tracking</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight text-[var(--foreground)]">FEFO batch expiry report</h1>
        <p className="mt-3 text-sm leading-7 text-[var(--muted-foreground)]">
          Monitor expired and soon-expiring grocery stock by branch and batch.
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <Link
              key={tab.key}
              href={`/admin/inventory/expiry?tab=${tab.key}`}
              className={
                activeTab === tab.key
                  ? "rounded-full bg-[var(--action)] px-4 py-2 text-sm font-semibold text-[var(--action-foreground)]"
                  : "rounded-full bg-[var(--surface)] px-4 py-2 text-sm font-semibold text-[var(--foreground)]"
              }
            >
              {tab.label} ({tab.count})
            </Link>
          ))}
        </div>

        <div className="mt-6">
          <BatchTable rows={grouped[activeTab]} />
        </div>
      </section>
    </main>
  );
}
