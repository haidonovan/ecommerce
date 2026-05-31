"use client";

import { useEffect, useState } from "react";

export function useOffline() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    function updateStatus() {
      setIsOnline(navigator.onLine);
    }

    updateStatus();
    window.addEventListener("online", updateStatus);
    window.addEventListener("offline", updateStatus);

    return () => {
      window.removeEventListener("online", updateStatus);
      window.removeEventListener("offline", updateStatus);
    };
  }, []);

  return {
    isOnline,
    isOffline: !isOnline,
  };
}
