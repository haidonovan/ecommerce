"use client";

import Link from "next/link";
import { RotateCcw, WifiOff } from "lucide-react";

export default function OfflinePage() {
  return (
    <main className="flex min-h-dvh items-center justify-center px-5 py-10">
      <section className="app-card w-full max-w-[32rem] p-6">
        <div className="inline-flex rounded-2xl bg-[color-mix(in_srgb,var(--action)_14%,var(--surface))] p-3 text-[var(--action)]">
          <WifiOff className="size-7" />
        </div>
        <p className="app-top-label">Offline</p>
        <h1 className="mt-3 text-3xl font-semibold text-[var(--foreground)]">You are offline</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--muted-foreground)]">
          Cached pages and POS sale capture can still work. Reconnect to sync fresh catalog,
          inventory, and orders.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--action)] px-4 py-3 text-sm font-semibold text-[var(--action-foreground)]"
          >
            <RotateCcw className="size-4" />
            Retry
          </button>
          <Link href="/pos" className="rounded-xl bg-[var(--action)] px-4 py-3 text-sm font-semibold text-[var(--action-foreground)]">
            Open POS
          </Link>
          <Link href="/" className="app-link-button">
            Go home
          </Link>
        </div>
      </section>
    </main>
  );
}
