"use client";

import { useCallback, useEffect, useState } from "react";

import { getAll } from "@/lib/db";
import { replayQueue, requestBackgroundSync } from "@/lib/sync";
import { useOffline } from "@/hooks/useOffline";

export function useSync() {
  const { isOnline } = useOffline();
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  const refreshPendingCount = useCallback(async () => {
    const queued = await getAll("offline_queue");
    setPendingCount(queued.length);
  }, []);

  const syncNow = useCallback(async () => {
    if (!isOnline) {
      return [];
    }

    setIsSyncing(true);
    try {
      await requestBackgroundSync();
      return await replayQueue();
    } finally {
      setIsSyncing(false);
      await refreshPendingCount();
    }
  }, [isOnline, refreshPendingCount]);

  useEffect(() => {
    refreshPendingCount();
  }, [refreshPendingCount]);

  useEffect(() => {
    if (isOnline) {
      syncNow();
    }
  }, [isOnline, syncNow]);

  return {
    pendingCount,
    isSyncing,
    syncNow,
    refreshPendingCount,
  };
}
