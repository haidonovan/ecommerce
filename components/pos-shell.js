"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Banknote, Minus, Plus, Search, ShoppingBag, Trash2, Wifi, WifiOff } from "lucide-react";

import { useAppStore } from "@/components/app-store-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { listQueuedPosSales, queuePosSale } from "@/lib/offline-db";
import { cn, formatCurrency } from "@/lib/utils";
import { usePOSSettings } from "@/hooks/usePOSSettings";
import { useTranslation } from "@/lib/translations";
import { LogoutButton } from "@/components/logout-button";

function discountedPrice(product) {
  return Number((product.price * (1 - (product.discountPercent || 0) / 100)).toFixed(2));
}

function createSaleId() {
  return `POS-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

export function PosShell() {
  const store = useAppStore();
  const { settings } = usePOSSettings();
  const lang = settings?.appearance?.defaultLanguage || "en";
  const { t } = useTranslation(lang);

  const [cart, setCart] = useState([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [cashReceived, setCashReceived] = useState("");
  const [queuedCount, setQueuedCount] = useState(0);
  const [online, setOnline] = useState(true);
  const [onlineStatusReady, setOnlineStatusReady] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    function refreshOnline() {
      setOnline(navigator.onLine);
      setOnlineStatusReady(true);
    }

    refreshOnline();
    window.addEventListener("online", refreshOnline);
    window.addEventListener("offline", refreshOnline);

    return () => {
      window.removeEventListener("online", refreshOnline);
      window.removeEventListener("offline", refreshOnline);
    };
  }, []);

  useEffect(() => {
    let active = true;

    listQueuedPosSales().then((sales) => {
      if (active) {
        setQueuedCount(sales.length);
      }
    });

    return () => {
      active = false;
    };
  }, [notice]);

  const categories = useMemo(() => ["All", ...new Set(store.products.map((product) => product.category))], [store.products]);

  const products = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return store.activeProducts.filter((product) => {
      const matchesCategory = category === "All" || product.category === category;
      const matchesQuery =
        !normalizedQuery ||
        product.name.toLowerCase().includes(normalizedQuery) ||
        product.category.toLowerCase().includes(normalizedQuery);

      return matchesCategory && matchesQuery;
    });
  }, [category, query, store.activeProducts]);

  const cartLines = useMemo(
    () =>
      cart
        .map((item) => {
          const product = store.products.find((entry) => entry.id === item.productId);
          if (!product) {
            return null;
          }

          const unitPrice = discountedPrice(product);

          return {
            ...item,
            product,
            unitPrice,
            lineTotal: Number((unitPrice * item.quantity).toFixed(2)),
          };
        })
        .filter(Boolean),
    [cart, store.products],
  );

  const subtotal = Number(cartLines.reduce((sum, line) => sum + line.lineTotal, 0).toFixed(2));
  const tax = Number((subtotal * 0.1).toFixed(2));
  const total = Number((subtotal + tax).toFixed(2));
  const changeDue = Math.max(0, Number(cashReceived || 0) - total);

  function addProduct(productId) {
    setNotice("");
    setCart((current) => {
      const product = store.products.find((entry) => entry.id === productId);
      const existing = current.find((entry) => entry.productId === productId);
      const nextQuantity = (existing?.quantity || 0) + 1;

      if (!product || nextQuantity > product.stock) {
        return current;
      }

      return existing
        ? current.map((entry) => (entry.productId === productId ? { ...entry, quantity: nextQuantity } : entry))
        : [...current, { productId, quantity: 1 }];
    });
  }

  function updateQuantity(productId, nextQuantity) {
    setNotice("");
    setCart((current) => {
      if (nextQuantity <= 0) {
        return current.filter((entry) => entry.productId !== productId);
      }

      const product = store.products.find((entry) => entry.id === productId);
      if (!product || nextQuantity > product.stock) {
        return current;
      }

      return current.map((entry) => (entry.productId === productId ? { ...entry, quantity: nextQuantity } : entry));
    });
  }

  async function completeSale() {
    if (!cartLines.length) {
      setNotice("Add at least one product before completing a sale.");
      return;
    }

    if (paymentMethod === "cash" && Number(cashReceived || 0) < total) {
      setNotice("Cash received is less than the total.");
      return;
    }

    const sale = {
      id: createSaleId(),
      source: "pos",
      paymentMethod,
      subtotal,
      tax,
      total,
      cashReceived: paymentMethod === "cash" ? Number(cashReceived || 0) : null,
      changeDue: paymentMethod === "cash" ? Number(changeDue.toFixed(2)) : null,
      lines: cartLines.map((line) => ({
        productId: line.productId,
        productName: line.product.name,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        lineTotal: line.lineTotal,
      })),
    };

    await queuePosSale(sale);
    setCart([]);
    setCashReceived("");
    setNotice(`Sale ${sale.id} saved locally.`);
  }

  return (
    <main className="app-shell">
      <header className="app-bar px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="app-top-label">{t("pos")}</p>
            <h1 className="mt-1 text-2xl font-semibold text-[var(--foreground)]">{t("cashier_checkout")}</h1>
          </div>
          <div className="flex items-center gap-2">
                      <ThemeToggle />
                      <LogoutButton className="hidden min-[700px]:inline-flex" iconOnly />
                    </div>
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold",
                online
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-amber-200 bg-amber-50 text-amber-800",
              )}
            >
              {onlineStatusReady && !online ? <WifiOff className="size-3.5" /> : <Wifi className="size-3.5" />}
              {onlineStatusReady ? (online ? t("online") : t("offline")) : t("checking")}
            </span>
            <Link href="/client" className="app-link-button">
              {t("storefront")}
            </Link>
            <Link href="/login" className="app-link-button">
              {t("admin")}
            </Link>
          </div>
        </div>
      </header>

      <section className="grid gap-6 pt-6 xl:grid-cols-[minmax(0,1fr)_25rem]">
        <div className="space-y-4">
          <div className="app-card p-4">
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_14rem]">
              <label className="app-input flex items-center gap-3 px-4 py-3">
                <Search className="size-4 text-[var(--muted-foreground)]" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={t("search_products")}
                  className="w-full bg-transparent text-sm outline-none placeholder:text-[var(--muted-foreground)]"
                />
              </label>
              <select value={category} onChange={(event) => setCategory(event.target.value)} className="app-select px-4 py-3 text-sm">
                {categories.map((entry) => (
                  <option key={entry}>{entry === "All" ? t("all_categories") : entry}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {products.map((product) => (
              <button
                key={product.id}
                type="button"
                onClick={() => addProduct(product.id)}
                disabled={product.stock <= 0}
                className="app-card group min-h-[10rem] overflow-hidden p-0 text-left transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-55"
              >
                <div className="flex h-full flex-col">
                  <div
                    className="h-24 bg-cover bg-center"
                    style={{ backgroundImage: `url(${product.image})` }}
                  />
                  <div className="flex flex-1 flex-col p-3">
                    <p className="text-xs text-[var(--muted-foreground)]">{product.category}</p>
                    <h2 className="mt-1 line-clamp-2 text-sm font-semibold text-[var(--foreground)]">{product.name}</h2>
                    <div className="mt-auto flex items-end justify-between gap-3 pt-3">
                      <span className="text-base font-bold text-[var(--foreground)]">{formatCurrency(discountedPrice(product))}</span>
                      <span className="text-xs text-[var(--muted-foreground)]">{product.stock} {t("left")}</span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <aside className="app-card h-fit p-4 xl:sticky xl:top-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="app-top-label">{t("current_sale")}</p>
              <h2 className="mt-1 text-xl font-semibold text-[var(--foreground)]">{cartLines.length} {t("items")}</h2>
            </div>
            <div className="rounded-full bg-[color-mix(in_srgb,var(--action)_14%,var(--surface))] p-3 text-[var(--action)]">
              <ShoppingBag className="size-5" />
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {cartLines.length ? (
              cartLines.map((line) => (
                <div key={line.productId} className="rounded-xl border border-[var(--border-soft)] bg-[var(--surface-soft)] p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[var(--foreground)]">{line.product.name}</p>
                      <p className="mt-1 text-xs text-[var(--muted-foreground)]">{formatCurrency(line.unitPrice)} {t("each")}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => updateQuantity(line.productId, 0)}
                      className="app-icon-button size-8"
                      aria-label={`${t("remove")} ${line.product.name}`}
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => updateQuantity(line.productId, line.quantity - 1)} className="app-icon-button size-8" aria-label={t("decrease")}>
                        <Minus className="size-3.5" />
                      </button>
                      <span className="w-8 text-center text-sm font-semibold">{line.quantity}</span>
                      <button type="button" onClick={() => updateQuantity(line.productId, line.quantity + 1)} className="app-icon-button size-8" aria-label={t("increase")}>
                        <Plus className="size-3.5" />
                      </button>
                    </div>
                    <span className="text-sm font-bold text-[var(--foreground)]">{formatCurrency(line.lineTotal)}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-[var(--border-soft)] px-4 py-8 text-center text-sm text-[var(--muted-foreground)]">
                {t("select_products_pos")}
              </div>
            )}
          </div>

          <div className="mt-5 space-y-2 border-t border-[var(--border-soft)] pt-4 text-sm">
            <div className="flex justify-between">
              <span className="text-[var(--muted-foreground)]">{t("subtotal")}</span>
              <span className="font-semibold">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--muted-foreground)]">{t("tax")}</span>
              <span className="font-semibold">{formatCurrency(tax)}</span>
            </div>
            <div className="flex justify-between text-lg">
              <span className="font-semibold">{t("total")}</span>
              <span className="font-bold">{formatCurrency(total)}</span>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2 rounded-xl bg-[var(--surface-quiet)] p-1">
            {["cash", "card"].map((method) => (
              <button
                key={method}
                type="button"
                onClick={() => setPaymentMethod(method)}
                className={cn(
                  "inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold capitalize",
                  paymentMethod === method && "bg-[var(--surface)] shadow-[var(--shadow-soft)]",
                )}
              >
                <Banknote className="size-4" />
                {t(method)}
              </button>
            ))}
          </div>

          {paymentMethod === "cash" ? (
            <div className="mt-4">
              <label className="mb-2 block text-sm font-medium text-[var(--foreground)]">{t("cash_received")}</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={cashReceived}
                onChange={(event) => setCashReceived(event.target.value)}
                className="app-input px-4 py-3"
              />
              <p className="mt-2 text-sm text-[var(--muted-foreground)]">{t("change")}: {formatCurrency(changeDue)}</p>
            </div>
          ) : null}

          {notice ? <div className="mt-4 rounded-xl border border-[var(--border-soft)] bg-[var(--surface-quiet)] px-4 py-3 text-sm text-[var(--foreground)]">{notice}</div> : null}

          <button
            type="button"
            onClick={completeSale}
            className="mt-5 w-full rounded-xl bg-[var(--action)] px-4 py-3 text-sm font-semibold text-[var(--action-foreground)]"
          >
            {t("complete_sale")}
          </button>

          <p className="mt-3 text-center text-xs text-[var(--muted-foreground)]">
            {queuedCount} {t("sales_queued")}
          </p>
        </aside>
      </section>
    </main>
  );
}
