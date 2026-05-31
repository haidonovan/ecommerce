"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useOffline } from "@/hooks/useOffline";
import { usePosStore } from "@/store/posStore";

const navItems = [
  { label: "Dashboard", href: "/pos" },
  { label: "New Sale", href: "/pos/new-sale" },
  { label: "Products", href: "/pos/products" },
  { label: "Orders", href: "/pos/orders" },
  { label: "Settings", href: "/pos/settings" },
];

export default function PosLayout({ children }) {
  const pathname = usePathname();
  const { isOnline, isOffline } = useOffline();
  const pendingSyncCount = usePosStore((state) => state.pendingSyncCount);

  // TODO: Add cashier authentication guard before production rollout.
  return (
    <div className="min-h-dvh bg-slate-100 text-slate-950">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-slate-200 bg-white p-5 shadow-sm md:flex">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-700">MyShop</p>
          <h1 className="mt-2 text-2xl font-black tracking-tight">POS Terminal</h1>
        </div>

        <nav className="mt-8 space-y-2">
          {navItems.map((item) => {
            const active = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={
                  active
                    ? "flex items-center justify-between rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white"
                    : "flex items-center justify-between rounded-xl px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-100"
                }
              >
                {item.label}
                {item.label === "Orders" && pendingSyncCount > 0 ? (
                  <span className="rounded-full bg-amber-400 px-2 py-0.5 text-xs font-black text-amber-950">
                    {pendingSyncCount}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm font-bold">
              <span className={isOnline ? "size-3 rounded-full bg-emerald-500" : "size-3 rounded-full bg-red-500"} />
              {isOffline ? "Offline" : "Online"}
            </div>
            {pendingSyncCount > 0 ? (
              <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-black text-amber-800">
                {pendingSyncCount} pending
              </span>
            ) : null}
          </div>
        </div>
      </aside>

      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur md:hidden">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">MyShop</p>
            <p className="text-lg font-black">POS</p>
          </div>
          <span className={isOnline ? "size-3 rounded-full bg-emerald-500" : "size-3 rounded-full bg-red-500"} />
        </div>
        <nav className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={
                pathname === item.href
                  ? "shrink-0 rounded-full bg-emerald-600 px-4 py-2 text-xs font-bold text-white"
                  : "shrink-0 rounded-full bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700"
              }
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>

      <main className="md:pl-64">
        <div className="mx-auto w-full max-w-7xl p-4 md:p-6">{children}</div>
      </main>
    </div>
  );
}
