"use client";

import { useEffect, useState } from "react";

import { getAll, put } from "@/lib/db";
import { useOffline } from "@/hooks/useOffline";
import { usePosStore } from "@/store/posStore";

const todayKey = new Date().toISOString().slice(0, 10);
const fallbackStats = {
  revenue: 0,
  transactions: 0,
  itemsSold: 0,
  pendingSync: 0,
};

function formatKHR(value) {
  return `${Number(value || 0).toLocaleString()} KHR`;
}

function calculateStatsFromTransactions(transactions) {
  const todaysTransactions = transactions.filter(
    (entry) => entry.type !== "stats" && String(entry.timestamp || "").slice(0, 10) === todayKey,
  );

  return {
    revenue: todaysTransactions.reduce((sum, entry) => sum + Number(entry.total || 0), 0),
    transactions: todaysTransactions.length,
    itemsSold: todaysTransactions.reduce(
      (sum, entry) => sum + (entry.items || []).reduce((itemSum, item) => itemSum + Number(item.qty || 0), 0),
      0,
    ),
    pendingSync: todaysTransactions.filter((entry) => !entry.synced).length,
  };
}

export default function PosDashboardPage() {
  const { isOnline, isOffline } = useOffline();
  const pendingSyncCount = usePosStore((state) => state.pendingSyncCount);
  const setPendingSyncCount = usePosStore((state) => state.setPendingSyncCount);
  const [stats, setStats] = useState(fallbackStats);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadStats() {
      setLoading(true);
      const transactions = await getAll("transactions");
      const localStats = calculateStatsFromTransactions(transactions);
      const queued = await getAll("offline_queue");
      setPendingSyncCount(queued.length);

      if (active) {
        setStats({ ...localStats, pendingSync: queued.length });
      }

      if (isOnline) {
        try {
          const response = await fetch("/api/pos/stats", { cache: "no-store" });
          if (response.ok) {
            const data = await response.json();
            const nextStats = data.data || data;
            await put("transactions", {
              id: `stats-${todayKey}`,
              type: "stats",
              date: todayKey,
              ...nextStats,
              pendingSync: queued.length,
            });

            if (active) {
              setStats({ ...nextStats, pendingSync: queued.length });
            }
          }
        } catch {
          // Keep local IndexedDB stats when the backend is unavailable.
        }
      }

      if (active) {
        setLoading(false);
      }
    }

    loadStats();

    return () => {
      active = false;
    };
  }, [isOnline, setPendingSyncCount]);

  const cards = [
    { label: "Today's Revenue", value: formatKHR(stats.revenue) },
    { label: "Transactions", value: Number(stats.transactions || 0).toLocaleString() },
    { label: "Items Sold", value: Number(stats.itemsSold || 0).toLocaleString() },
    { label: "Pending Sync", value: Number(pendingSyncCount || stats.pendingSync || 0).toLocaleString() },
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-700">Dashboard</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight">POS Overview</h1>
      </div>

      {pendingSyncCount > 0 ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900">
          {pendingSyncCount} sales pending sync — will upload when online
        </div>
      ) : null}

      {isOffline ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600">
          Offline mode: dashboard stats are loaded from local transactions.
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <section key={card.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-bold text-slate-500">{card.label}</p>
            <p className="mt-3 text-3xl font-black tracking-tight">{loading ? "..." : card.value}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
