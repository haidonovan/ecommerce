"use client";

import { Wifi, WifiOff } from "lucide-react";

import { useOffline } from "@/hooks/useOffline";

export function OfflineBadge() {
  const { isOnline } = useOffline();

  return (
    <span
      className={
        isOnline
          ? "inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800"
          : "inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800"
      }
    >
      {isOnline ? <Wifi className="size-3.5" /> : <WifiOff className="size-3.5" />}
      {isOnline ? "Online" : "Offline"}
    </span>
  );
}
