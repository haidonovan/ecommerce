"use client";

import { useEffect, useMemo, useState } from "react";

import { getAll } from "@/lib/db";

const mockTransactions = [
  {
    id: "TXN-MOCK-001",
    items: [{ productId: "rice-5kg", name: "Jasmine Rice 5kg", price: 32000, qty: 1, stock: 12 }],
    total: 35200,
    tax: 3200,
    timestamp: "2026-01-01T09:00:00.000Z",
    synced: true,
  },
];

function formatKHR(value) {
  return `${Number(value || 0).toLocaleString()} KHR`;
}

function isToday(timestamp, todayKey) {
  return String(timestamp || "").slice(0, 10) === todayKey;
}

function formatTime(timestamp) {
  if (!timestamp) {
    return "--";
  }

  return new Date(timestamp).toLocaleTimeString();
}

export default function PosOrdersPage() {
  const [transactions, setTransactions] = useState(mockTransactions);
  const [filter, setFilter] = useState("all");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadTransactions() {
      const todayKey = new Date().toISOString().slice(0, 10);
      const localTransactions = await getAll("transactions");
      const safeTransactions = Array.isArray(localTransactions) ? localTransactions : [];
      const todaysTransactions = safeTransactions.filter(
        (entry) => entry.type !== "stats" && isToday(entry.timestamp, todayKey),
      );

      if (active) {
        setTransactions(todaysTransactions.length ? todaysTransactions : []);
        setHydrated(true);
      }
    }

    loadTransactions();

    return () => {
      active = false;
    };
  }, []);

  const visibleTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      if (filter === "synced") {
        return transaction.synced;
      }

      if (filter === "pending") {
        return !transaction.synced;
      }

      return true;
    });
  }, [filter, transactions]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-700">Orders</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight">Today&apos;s Transactions</h1>
        </div>

        <div className="grid grid-cols-3 rounded-2xl bg-white p-1 shadow-sm">
          {["all", "synced", "pending"].map((entry) => (
            <button
              key={entry}
              type="button"
              onClick={() => setFilter(entry)}
              className={
                filter === entry
                  ? "rounded-xl bg-emerald-600 px-4 py-2 text-sm font-black capitalize text-white"
                  : "rounded-xl px-4 py-2 text-sm font-black capitalize text-slate-600"
              }
            >
              {entry}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[44rem] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-[0.16em] text-slate-500">
              <tr>
                <th className="px-4 py-3">Transaction ID</th>
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">Items</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Synced</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visibleTransactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td className="px-4 py-3 font-black">{transaction.id}</td>
                  <td className="px-4 py-3 font-semibold text-slate-600">
                    {hydrated ? formatTime(transaction.timestamp) : "--"}
                  </td>
                  <td className="px-4 py-3 font-semibold">
                    {(transaction.items || []).reduce((sum, item) => sum + Number(item.qty || 0), 0).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 font-black">{formatKHR(transaction.total)}</td>
                  <td className="px-4 py-3 text-xl">{transaction.synced ? "✓" : "⏳"}</td>
                </tr>
              ))}
              {!visibleTransactions.length ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm font-bold text-slate-500">
                    No transactions found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
