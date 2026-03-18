"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  BarChart3,
  Boxes,
  ClipboardList,
  LayoutDashboard,
  LifeBuoy,
  Menu,
  ReceiptText,
  Ticket,
  X,
} from "lucide-react";

import {
  AdminCouponsPageView,
  AdminDashboardPageView,
  AdminInventoryPageView,
  AdminOrderManagementPageView,
  AdminProductManagementPageView,
  AdminSalesReportPageView,
  AdminSupportInboxPageView,
} from "@/components/admin-pages";
import { useAppStore } from "@/components/app-store-provider";
import { LogoutButton } from "@/components/logout-button";
import { easeInOutCubic } from "@/components/motion/motion-utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

const adminTabs = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "products", label: "Products", icon: Boxes },
  { key: "inventory", label: "Inventory", icon: ClipboardList },
  { key: "orders", label: "Orders", icon: ReceiptText },
  { key: "sales", label: "Sales", icon: BarChart3 },
  { key: "coupons", label: "Coupons", icon: Ticket },
  { key: "support", label: "Support", icon: LifeBuoy },
];

function resolveAdminTab(value) {
  return adminTabs.some((tab) => tab.key === value) ? value : "dashboard";
}

function NavButton({ active, icon: Icon, label, onClick, compact = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "app-nav-button flex items-center gap-3 px-4 py-3 text-sm font-semibold",
        compact && "w-full justify-start",
        active && "bg-[color-mix(in_srgb,var(--action)_14%,var(--surface))] text-[var(--foreground)]",
      )}
      data-active={active}
    >
      <Icon className="size-4" />
      {label}
    </button>
  );
}

export function AdminShell({ user, initialTab = "dashboard" }) {
  const store = useAppStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const [lastAlertSignature, setLastAlertSignature] = useState("");

  const selectedTab = resolveAdminTab(searchParams.get("tab") || initialTab);

  const title = useMemo(() => {
    switch (selectedTab) {
      case "products":
        return "Products";
      case "inventory":
        return "Inventory";
      case "orders":
        return "Orders";
      case "sales":
        return "Sales Report";
      case "coupons":
        return "Coupons";
      case "support":
        return "Support";
      default:
        return "Admin Dashboard";
    }
  }, [selectedTab]);

  function openTab(tab) {
    const href = tab === "dashboard" ? "/admin" : `/admin?tab=${tab}`;
    router.push(href);
    setDrawerOpen(false);
  }

  function renderContent() {
    switch (selectedTab) {
      case "products":
        return <AdminProductManagementPageView />;
      case "inventory":
        return <AdminInventoryPageView />;
      case "orders":
        return <AdminOrderManagementPageView />;
      case "sales":
        return <AdminSalesReportPageView />;
      case "coupons":
        return <AdminCouponsPageView />;
      case "support":
        return <AdminSupportInboxPageView user={user} />;
      default:
        return <AdminDashboardPageView />;
    }
  }

  const activeAlerts = useMemo(() => {
    const lowStock = store.products.filter((product) => product.stock <= 5).length;
    const openComplaints = store.supportTickets.filter((ticket) => ticket.status !== "closed").length;
    const pendingOrders = store.orders.filter((order) => order.status === "pending").length;
    const alerts = [];

    if (openComplaints > 0) {
      alerts.push({
        title: "Customer complaints need attention",
        message: `${openComplaints} support ticket${openComplaints === 1 ? "" : "s"} still need admin action.`,
        tone: "danger",
      });
    }
    if (lowStock > 0) {
      alerts.push({
        title: "Low stock warning",
        message: `${lowStock} product${lowStock === 1 ? "" : "s"} are running low and may need restocking.`,
        tone: lowStock >= 5 ? "danger" : "warning",
      });
    }
    if (pendingOrders >= 8) {
      alerts.push({
        title: "Pending orders are building up",
        message: `${pendingOrders} orders are still pending. Review fulfillment so delivery does not slip.`,
        tone: "warning",
      });
    }

    return alerts;
  }, [store.orders, store.products, store.supportTickets]);

  useEffect(() => {
    const signature = activeAlerts.map((alert) => `${alert.title}:${alert.message}`).join("|");

    if (!activeAlerts.length) {
      if (!lastAlertSignature) {
        return undefined;
      }

      const clearTimer = window.setTimeout(() => {
        setLastAlertSignature("");
      }, 0);

      return () => window.clearTimeout(clearTimer);
    }

    if (alertOpen || signature === lastAlertSignature) {
      return;
    }

    const openTimer = window.setTimeout(() => {
      setLastAlertSignature(signature);
      setAlertOpen(true);
    }, 0);

    return () => window.clearTimeout(openTimer);
  }, [activeAlerts, alertOpen, lastAlertSignature]);

  return (
    <main className="app-shell">
      <header className="app-bar px-5 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="app-icon-button p-2 min-[700px]:hidden"
              aria-label="Open navigation"
            >
              <Menu className="size-5" />
            </button>
            <h1 className="text-2xl font-semibold text-[var(--foreground)]">{title}</h1>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <LogoutButton className="hidden min-[700px]:inline-flex" iconOnly />
          </div>
        </div>
      </header>

      {drawerOpen ? (
        <div className="fixed inset-0 z-40 bg-black/35 min-[700px]:hidden">
          <div className="h-full w-[18rem] bg-[var(--background-start)] p-4 shadow-[var(--shadow-strong)]">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.28em] text-[var(--muted-foreground)]">Admin</p>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="app-icon-button p-2"
                aria-label="Close navigation"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="space-y-2">
              {adminTabs.map((tab) => (
                <NavButton key={tab.key} active={selectedTab === tab.key} icon={tab.icon} label={tab.label} compact onClick={() => openTab(tab.key)} />
              ))}
            </div>
            <LogoutButton className="mt-5 w-full" />
          </div>
        </div>
      ) : null}

      <section className="grid gap-6 pt-6 min-[700px]:grid-cols-[6rem_minmax(0,1fr)]">
        <aside className="hidden min-[700px]:block">
          <div className="app-nav-surface p-3">
            <div className="space-y-2">
              {adminTabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => openTab(tab.key)}
                  className={cn(
                    "app-nav-button flex w-full flex-col items-center gap-2 px-2 py-4 text-xs font-semibold",
                    selectedTab === tab.key && "bg-[color-mix(in_srgb,var(--action)_14%,var(--surface))] text-[var(--foreground)]",
                  )}
                  data-active={selectedTab === tab.key}
                >
                  <tab.icon className="size-5" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </aside>

        <div className="min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedTab}
              initial={{ opacity: 0, x: 18, scale: 0.985 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -12, scale: 0.985 }}
              transition={{ duration: 0.48, ease: easeInOutCubic }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      <AnimatePresence>
        {alertOpen && activeAlerts.length ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, x: 18 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.96, x: 14 }}
              transition={{ duration: 0.42, ease: easeInOutCubic }}
              className="app-card w-full max-w-[26rem] p-6"
            >
              <h2 className="text-xl font-semibold text-[var(--foreground)]">Admin alerts</h2>
              <div className="mt-4 space-y-3">
                {activeAlerts.map((alert) => (
                  <div
                    key={alert.title}
                    className={cn(
                      "rounded-[1.15rem] border px-4 py-4",
                      alert.tone === "danger" ? "border-rose-200 bg-rose-50 text-rose-950" : "border-amber-200 bg-amber-50 text-amber-950",
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className="rounded-2xl bg-white/70 p-2">
                        <AlertTriangle className="size-4" />
                      </div>
                      <div>
                        <p className="font-semibold">{alert.title}</p>
                        <p className="mt-1 text-sm leading-6 text-current/78">{alert.message}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-5 flex justify-end">
                <button
                  type="button"
                  onClick={() => setAlertOpen(false)}
                  className="inline-flex items-center justify-center rounded-xl bg-[var(--action)] px-4 py-3 text-sm font-semibold text-[var(--action-foreground)]"
                >
                  Review dashboard
                </button>
              </div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>
    </main>
  );
}
