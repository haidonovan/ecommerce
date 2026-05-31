"use client";

import { RefreshCw } from "lucide-react";

import { useSync } from "@/hooks/useSync";

export function SyncStatus() {
  const { pendingCount, isSyncing, syncNow } = useSync();

  return (
    <button
      type="button"
      onClick={syncNow}
      className="inline-flex items-center gap-2 rounded-full border border-[var(--border-soft)] bg-[var(--surface)] px-3 py-1.5 text-xs font-semibold text-[var(--foreground)]"
      disabled={isSyncing}
    >
      <RefreshCw className={isSyncing ? "size-3.5 animate-spin" : "size-3.5"} />
      {pendingCount} pending
    </button>
  );
}
