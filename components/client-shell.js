"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Heart,
  Menu,
  ReceiptText,
  ShoppingCart,
  Store,
  User,
  X,
} from "lucide-react";

import { useAppStore } from "@/components/app-store-provider";
import { ClientCartPageView, ClientFavoritesPageView, ClientOrderHistoryPageView, ClientProductListPageView, ClientProfilePageView } from "@/components/client-pages";
import { LogoutButton } from "@/components/logout-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { easeInOutCubic } from "@/components/motion/motion-utils";
import { cn } from "@/lib/utils";

const clientTabs = [
  { key: "shop", label: "Shop", icon: Store },
  { key: "favorites", label: "Favorites", icon: Heart },
  { key: "cart", label: "Cart", icon: ShoppingCart },
  { key: "orders", label: "Orders", icon: ReceiptText },
  { key: "profile", label: "Profile", icon: User },
];

function resolveClientTab(value) {
  return clientTabs.some((tab) => tab.key === value) ? value : "shop";
}

function DrawerButton({ active, icon: Icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "app-nav-button flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-semibold",
        active && "bg-[color-mix(in_srgb,var(--action)_14%,var(--surface))] text-[var(--foreground)]",
      )}
      data-active={active}
    >
      <Icon className="size-4" />
      {label}
    </button>
  );
}

export function ClientShell({ user, initialTab = "shop" }) {
  const store = useAppStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const selectedTab = resolveClientTab(searchParams.get("tab") || initialTab);

  const title = useMemo(() => {
    switch (selectedTab) {
      case "favorites":
        return "Favorites";
      case "cart":
        return "Cart";
      case "orders":
        return "Orders";
      case "profile":
        return "Profile";
      default:
        return "Shop";
    }
  }, [selectedTab]);

  function openTab(tab) {
    const href = tab === "shop" ? "/client" : `/client?tab=${tab}`;
    router.push(href);
    setDrawerOpen(false);
  }

  function renderContent() {
    switch (selectedTab) {
      case "favorites":
        return <ClientFavoritesPageView />;
      case "cart":
        return <ClientCartPageView />;
      case "orders":
        return <ClientOrderHistoryPageView />;
      case "profile":
        return <ClientProfilePageView user={user} />;
      default:
        return <ClientProductListPageView />;
    }
  }

  return (
    <main className="app-shell pb-28">
      <header className="app-bar px-5 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="app-icon-button p-2 lg:hidden"
              aria-label="Open navigation"
            >
              <Menu className="size-5" />
            </button>
            <h1 className="text-2xl font-semibold text-[var(--foreground)]">{title}</h1>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            {selectedTab !== "cart" ? (
              <button
                type="button"
                onClick={() => openTab("cart")}
                className="app-icon-button relative p-2.5"
                aria-label="Open cart"
                title="Open cart"
              >
                <ShoppingCart className="size-4" />
                {store.cartCount > 0 ? (
                  <span className="absolute -right-1 -top-1 inline-flex min-w-4 items-center justify-center rounded-full bg-[var(--action)] px-1 text-[10px] font-bold text-[var(--action-foreground)]">
                    {store.cartCount}
                  </span>
                ) : null}
              </button>
            ) : null}
          </div>
        </div>
      </header>

      {drawerOpen ? (
        <div className="fixed inset-0 z-40 bg-black/35 lg:hidden">
          <div className="h-full w-[18rem] bg-[var(--background-start)] p-4 shadow-[var(--shadow-strong)]">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-[var(--muted-foreground)]">Client</p>
                <p className="mt-1 text-sm font-semibold text-[var(--foreground)]">{user.email}</p>
              </div>
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
              {clientTabs.map((tab) => (
                <DrawerButton key={tab.key} active={selectedTab === tab.key} icon={tab.icon} label={tab.label} onClick={() => openTab(tab.key)} />
              ))}
            </div>
            <LogoutButton className="mt-5 w-full" />
          </div>
        </div>
      ) : null}

      <div className="pt-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedTab}
            initial={{ opacity: 0, x: 18, scale: 0.98 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -12, scale: 0.98 }}
            transition={{ duration: 0.48, ease: easeInOutCubic }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </div>

      <nav className="app-nav-surface fixed bottom-4 left-4 right-4 z-30 hidden items-center justify-between p-2 md:flex lg:left-6 lg:right-6">
        {clientTabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => openTab(tab.key)}
            className={cn(
              "app-nav-button flex min-w-0 flex-1 flex-col items-center gap-1 px-3 py-3 text-xs font-semibold",
              selectedTab === tab.key && "bg-[color-mix(in_srgb,var(--action)_14%,var(--surface))] text-[var(--foreground)]",
            )}
            data-active={selectedTab === tab.key}
          >
            <tab.icon className="size-4" />
            {tab.label}
          </button>
        ))}
      </nav>
    </main>
  );
}
