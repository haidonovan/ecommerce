"use client";

import { useEffect, useMemo, useState } from "react";

import { formatPrimaryMoney } from "@/components/pos/format";
import { usePOSSettings } from "@/hooks/usePOSSettings";
import { getAll } from "@/lib/db";

const mockTransactions = [
  {
    id: "TXN-MOCK-001",
    items: [{ productId: "rice-5kg", name: "Jasmine Rice 5kg", price: 7.8, qty: 1, stock: 12 }],
    total: 8.58,
    tax: 0.78,
    timestamp: "2026-01-01T09:00:00.000Z",
    synced: true,
  },
];

const queueActions = {
  pending: [
    { label: "Accept", status: "preparing" },
    { label: "Cancel", status: "cancelled" },
  ],
  confirmed: [
    { label: "Prepare", status: "preparing" },
    { label: "Cancel", status: "cancelled" },
  ],
  processing: [
    { label: "Prepare", status: "preparing" },
    { label: "Cancel", status: "cancelled" },
  ],
  preparing: [
    { label: "Ready", status: "ready" },
    { label: "Cancel", status: "cancelled" },
  ],
  ready: [
    { label: "Complete", status: "completed" },
    { label: "Cancel", status: "cancelled" },
  ],
};

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
  const { settings } = usePOSSettings();
  const [transactions, setTransactions] = useState(mockTransactions);
  const [onlineOrders, setOnlineOrders] = useState([]);
  const [filter, setFilter] = useState("all");
  const [queueMessage, setQueueMessage] = useState("");
  const [hydrated, setHydrated] = useState(false);

  async function loadOnlineOrders() {
    try {
      const response = await fetch("/api/orders?channel=online", { cache: "no-store" });
      const payload = await response.json();

      if (!response.ok || !Array.isArray(payload.data)) {
        setQueueMessage(payload.error || "Unable to load online orders.");
        return;
      }

      setOnlineOrders(payload.data);
      setQueueMessage("");
    } catch {
      setQueueMessage("Unable to load online orders.");
    }
  }

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
    const onlineTimer = window.setTimeout(() => {
      loadOnlineOrders();
    }, 0);

    return () => {
      active = false;
      window.clearTimeout(onlineTimer);
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

  const queueOrders = useMemo(() => {
    return onlineOrders.filter((order) => !["completed", "cancelled", "delivered"].includes(order.status));
  }, [onlineOrders]);

  async function updateOrderStatus(orderId, status) {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });
      const payload = await response.json();

      if (!response.ok || !payload.data) {
        setQueueMessage(payload.error || "Unable to update order.");
        return;
      }

      setOnlineOrders((current) => current.map((order) => (order.id === orderId ? payload.data : order)));
      setQueueMessage("");
    } catch {
      setQueueMessage("Unable to update order.");
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-700">Orders</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight">Online Queue & Today&apos;s Transactions</h1>
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

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-3 border-b border-slate-100 px-4 py-4 md:flex-row md:items-center">
          <div>
            <h2 className="text-xl font-black">Online Order Queue</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">{queueOrders.length} active online orders</p>
          </div>
          <button type="button" onClick={loadOnlineOrders} className="rounded-2xl bg-slate-100 px-4 py-2 text-sm font-black text-slate-700">
            Refresh
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {queueOrders.map((order) => (
            <article key={order.id} className="grid gap-4 px-4 py-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_auto] xl:items-center">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="truncate text-base font-black">{order.id}</h3>
                  <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-black uppercase text-emerald-700">{order.status}</span>
                </div>
                <p className="mt-1 line-clamp-2 text-sm font-semibold text-slate-500">{order.shippingAddress}</p>
                <p className="mt-1 text-xs font-bold text-slate-400">{new Date(order.createdAt).toLocaleString()}</p>
              </div>

              <div className="min-w-0">
                <p className="text-sm font-black">{formatPrimaryMoney(order.total, settings, false)}</p>
                <p className="mt-1 text-xs font-bold text-slate-500">
                  {(order.lines || []).map((line) => `${line.quantity} x ${line.productName}`).join(", ")}
                </p>
              </div>

              <div className="flex flex-wrap gap-2 xl:justify-end">
                {(queueActions[order.status] || []).map((action) => (
                  <button
                    key={`${order.id}-${action.status}`}
                    type="button"
                    onClick={() => updateOrderStatus(order.id, action.status)}
                    className={
                      action.status === "cancelled"
                        ? "rounded-xl bg-red-50 px-3 py-2 text-sm font-black text-red-700"
                        : "rounded-xl bg-emerald-600 px-3 py-2 text-sm font-black text-white"
                    }
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </article>
          ))}

          {!queueOrders.length ? (
            <div className="px-4 py-10 text-center text-sm font-bold text-slate-500">
              {queueMessage || "No active online orders."}
            </div>
          ) : null}
        </div>
      </section>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-4 py-4">
          <h2 className="text-xl font-black">Today&apos;s POS Transactions</h2>
        </div>
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
                  <td className="px-4 py-3 font-black">{formatPrimaryMoney(transaction.total, settings, false)}</td>
                  <td className="px-4 py-3 text-sm font-black">{transaction.synced ? "Yes" : "Pending"}</td>
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
