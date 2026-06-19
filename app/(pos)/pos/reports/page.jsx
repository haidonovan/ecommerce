"use client";

import { useEffect, useState } from "react";

import { formatPrimaryMoney } from "@/components/pos/format";
import { usePOSSettings } from "@/hooks/usePOSSettings";

const rangeOptions = [
  { key: "today", label: "Today" },
  { key: "week", label: "7 days" },
  { key: "month", label: "Month" },
];

function ProgressRows({ rows, formatter }) {
  const max = Math.max(...rows.map((row) => Number(row.value ?? row.quantity ?? 0)), 1);

  return (
    <div className="space-y-3">
      {rows.map((row) => {
        const value = Number(row.value ?? row.quantity ?? 0);

        return (
          <div key={row.label}>
            <div className="flex items-center justify-between gap-4 text-sm">
              <span className="truncate font-black">{row.label}</span>
              <span className="shrink-0 font-bold text-slate-500">{formatter(value)}</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-emerald-600" style={{ width: `${Math.max((value / max) * 100, value > 0 ? 8 : 0)}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MetricCard({ label, value, detail }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-bold text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-black tracking-tight">{value}</p>
      <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">{detail}</p>
    </section>
  );
}

export default function PosReportsPage() {
  const { settings } = usePOSSettings();
  const [range, setRange] = useState("today");
  const [report, setReport] = useState(null);
  const [message, setMessage] = useState("");

  async function loadReport() {
    try {
      const response = await fetch(`/api/pos/reports?range=${range}`, { cache: "no-store" });
      const payload = await response.json();

      if (!response.ok || !payload.data) {
        setMessage(payload.error || "Unable to load POS reports.");
        return;
      }

      setReport(payload.data);
      setMessage("");
    } catch {
      setMessage("Unable to load POS reports.");
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadReport();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [range]);

  const metrics = report?.metrics || {
    totalRevenue: 0,
    transactions: 0,
    itemsSold: 0,
    averageTransaction: 0,
    discountTotal: 0,
    taxTotal: 0,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-700">Reports</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight">Cashier POS Reports</h1>
          <p className="mt-2 text-sm font-semibold text-slate-500">Track sales, payment mix, and product performance from synced POS transactions.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <div className="grid grid-cols-3 rounded-2xl bg-white p-1 shadow-sm">
            {rangeOptions.map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => setRange(option.key)}
                className={
                  range === option.key
                    ? "rounded-xl bg-emerald-600 px-4 py-2 text-sm font-black text-white"
                    : "rounded-xl px-4 py-2 text-sm font-black text-slate-600"
                }
              >
                {option.label}
              </button>
            ))}
          </div>
          <button type="button" onClick={loadReport} className="rounded-2xl bg-white px-4 py-2 text-sm font-black text-slate-700 shadow-sm">
            Refresh
          </button>
        </div>
      </div>

      {message ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
          {message}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <MetricCard label="Revenue" value={formatPrimaryMoney(metrics.totalRevenue, settings, false)} detail="Total synced POS revenue." />
        <MetricCard label="Transactions" value={Number(metrics.transactions || 0).toLocaleString()} detail="Completed POS transactions." />
        <MetricCard label="Items sold" value={Number(metrics.itemsSold || 0).toLocaleString()} detail="Total product units sold." />
        <MetricCard label="Average sale" value={formatPrimaryMoney(metrics.averageTransaction, settings, false)} detail="Average transaction value." />
        <MetricCard label="Discounts" value={formatPrimaryMoney(metrics.discountTotal, settings, false)} detail="Discount value given at POS." />
        <MetricCard label="Tax" value={formatPrimaryMoney(metrics.taxTotal, settings, false)} detail="Tax collected in POS sales." />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Payment method report</p>
          <h2 className="mt-2 text-xl font-black">Payment mix</h2>
          <div className="mt-5">
            {report?.paymentRevenue?.length ? (
              <ProgressRows rows={report.paymentRevenue} formatter={(value) => formatPrimaryMoney(value, settings, false)} />
            ) : (
              <p className="text-sm font-semibold text-slate-500">No payment data yet.</p>
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Sales by product</p>
          <h2 className="mt-2 text-xl font-black">Top products</h2>
          <div className="mt-5">
            {report?.topProducts?.length ? (
              <ProgressRows rows={report.topProducts} formatter={(value) => `${value} sold`} />
            ) : (
              <p className="text-sm font-semibold text-slate-500">No product sales yet.</p>
            )}
          </div>
        </section>
      </div>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-4 py-4">
          <h2 className="text-xl font-black">Recent Transactions</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[48rem] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-[0.16em] text-slate-500">
              <tr>
                <th className="px-4 py-3">Transaction</th>
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">Payment</th>
                <th className="px-4 py-3">Items</th>
                <th className="px-4 py-3">Discount</th>
                <th className="px-4 py-3">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(report?.recentTransactions || []).map((transaction) => (
                <tr key={transaction.id}>
                  <td className="px-4 py-3 font-black">{transaction.id}</td>
                  <td className="px-4 py-3 font-semibold text-slate-600">{new Date(transaction.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-3 font-semibold capitalize">{transaction.paymentMethod}</td>
                  <td className="px-4 py-3 font-semibold">{transaction.itemCount}</td>
                  <td className="px-4 py-3 font-semibold">{formatPrimaryMoney(transaction.discount, settings, false)}</td>
                  <td className="px-4 py-3 font-black">{formatPrimaryMoney(transaction.total, settings, false)}</td>
                </tr>
              ))}
              {!report?.recentTransactions?.length ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm font-bold text-slate-500">
                    No synced POS transactions found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
