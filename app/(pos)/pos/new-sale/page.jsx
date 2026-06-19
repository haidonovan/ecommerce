"use client";

import { useEffect, useMemo, useState } from "react";

import { CartItem } from "@/components/pos/CartItem";
import { convertMoney, formatDisplayMoney } from "@/components/pos/format";
import { PaymentModal } from "@/components/pos/PaymentModal";
import { ProductCard } from "@/components/pos/ProductCard";
import { ReceiptView } from "@/components/pos/ReceiptView";
import { useOffline } from "@/hooks/useOffline";
import { usePOSSettings } from "@/hooks/usePOSSettings";
import { addToQueue, getAll, put } from "@/lib/db";
import { usePosStore } from "@/store/posStore";

const mockProducts = [
  { id: "angkor-rice", name: "Angkor Premium Jasmine Rice 5kg", sku: "RICE-001", category: "Rice", price: 7.8, stock: 18, image: "", isActive: true },
  { id: "kampot-pepper", name: "Kampot Black Pepper 100g", sku: "SPICE-004", category: "Spices", price: 5.37, stock: 8, image: "", isActive: true },
  { id: "iced-coffee", name: "Cambodian Iced Coffee", sku: "DRINK-010", category: "Drinks", price: 0.98, stock: 24, image: "", isActive: true },
  { id: "fish-sauce", name: "Fish Sauce Bottle", sku: "SAUCE-002", category: "Sauce", price: 1.59, stock: 5, image: "", isActive: true },
  { id: "palm-sugar", name: "Palm Sugar 500g", sku: "SWEET-003", category: "Grocery", price: 2.2, stock: 3, image: "", isActive: true },
  { id: "nom-banh-chok", name: "Fresh Nom Banh Chok Noodles", sku: "NOOD-008", category: "Noodles", price: 1.34, stock: 0, image: "", isActive: true },
  { id: "coconut-water", name: "Fresh Coconut Water", sku: "DRINK-011", category: "Drinks", price: 1.22, stock: 14, image: "", isActive: true },
  { id: "banana-chips", name: "Banana Chips Pack", sku: "SNACK-020", category: "Snacks", price: 1.83, stock: 11, image: "", isActive: true },
];

function createTransactionId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `txn-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

function normalizeProduct(product) {
  return {
    id: product.id,
    name: product.name,
    sku: product.sku || product.id,
    category: product.category || "General",
    price: Number(product.price || 0),
    stock: Number(product.stock || 0),
    image: product.image || product.imageUrl || "",
    isActive: product.isActive !== false,
  };
}

export default function NewSalePage() {
  const { isOnline } = useOffline();
  const { settings } = usePOSSettings();
  const cartState = usePosStore((state) => state.cart);
  const heldSalesState = usePosStore((state) => state.heldSales);
  const addToCart = usePosStore((state) => state.addToCart);
  const updateQty = usePosStore((state) => state.updateQty);
  const removeFromCart = usePosStore((state) => state.removeFromCart);
  const updateItemNote = usePosStore((state) => state.updateItemNote);
  const clearCart = usePosStore((state) => state.clearCart);
  const holdCurrentSale = usePosStore((state) => state.holdCurrentSale);
  const restoreHeldSale = usePosStore((state) => state.restoreHeldSale);
  const cashierName = usePosStore((state) => state.cashierName);
  const pendingSyncCount = usePosStore((state) => state.pendingSyncCount);
  const setPendingSyncCount = usePosStore((state) => state.setPendingSyncCount);

  const cart = Array.isArray(cartState) ? cartState : [];
  const heldSales = Array.isArray(heldSalesState) ? heldSalesState : [];

  const [products, setProducts] = useState(mockProducts);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [lastSynced, setLastSynced] = useState("Never");
  const [displayCurrency, setDisplayCurrency] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [discountOpen, setDiscountOpen] = useState(false);
  const [discountType, setDiscountType] = useState("percent");
  const [discountValue, setDiscountValue] = useState("");
  const [managerPin, setManagerPin] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState({ type: "percent", value: 0, amount: 0 });
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [receipt, setReceipt] = useState(null);

  useEffect(() => {
    let active = true;

    async function loadProducts() {
      if (active) {
        setLastSynced(window.localStorage.getItem("pos-products-last-synced") || "Never");
      }

      const localProducts = await getAll("products");
      if (active && Array.isArray(localProducts) && localProducts.length) {
        setProducts(localProducts.map(normalizeProduct));
      }

      if (!active || !isOnline) {
        return;
      }

      try {
        const response = await fetch("/api/products", { cache: "no-store" });
        if (!response.ok) {
          return;
        }

        const payload = await response.json();
        const rawProducts = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : [];
        const nextProducts = rawProducts.map(normalizeProduct);

        if (nextProducts.length) {
          await Promise.all(nextProducts.map((product) => put("products", product)));
          const timestamp = new Date().toLocaleString();
          window.localStorage.setItem("pos-products-last-synced", timestamp);

          if (active) {
            setProducts(nextProducts);
            setLastSynced(timestamp);
          }
        }
      } catch {
        // IndexedDB and mock products keep the POS usable offline.
      }
    }

    loadProducts();

    return () => {
      active = false;
    };
  }, [isOnline]);

  const categories = useMemo(() => {
    const safeProducts = Array.isArray(products) ? products : [];
    return ["All", ...new Set(safeProducts.map((product) => product.category))];
  }, [products]);

  const categoryCounts = useMemo(() => {
    const safeProducts = Array.isArray(products) ? products : [];
    const counts = { All: safeProducts.length };
    for (const product of safeProducts) {
      counts[product.category] = (counts[product.category] || 0) + 1;
    }
    return counts;
  }, [products]);

  const visibleProducts = useMemo(() => {
    const lower = query.trim().toLowerCase();

    const safeProducts = Array.isArray(products) ? products : [];

    return safeProducts.filter((product) => {
      const matchesCategory = category === "All" || product.category === category;
      const matchesQuery =
        !lower ||
        product.name.toLowerCase().includes(lower) ||
        product.sku.toLowerCase().includes(lower);
      return matchesCategory && matchesQuery;
    });
  }, [category, products, query]);

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const taxBase = Math.max(0, subtotal - appliedDiscount.amount);
  const tax = settings.tax.enabled
    ? settings.tax.taxType === "inclusive"
      ? Number((taxBase - taxBase / (1 + settings.tax.taxRate / 100)).toFixed(2))
      : Number((taxBase * (settings.tax.taxRate / 100)).toFixed(2))
    : 0;
  const total = Number(Math.max(0, taxBase + (settings.tax.enabled && settings.tax.taxType === "exclusive" ? tax : 0)).toFixed(2));
  const itemCount = cart.reduce((sum, item) => sum + item.qty, 0);
  const activeDisplayCurrency = displayCurrency || settings.currency.primaryCurrency || "USD";
  const money = (value, showBoth = true) => formatDisplayMoney(value, activeDisplayCurrency, settings, showBoth);

  function applyDiscount(value = discountValue, type = discountType) {
    const numericValue = Number(value || 0);
    if (!settings.discount.enabled || !numericValue) {
      setAppliedDiscount({ type, value: 0, amount: 0 });
      return;
    }

    if (type === "percent") {
      const max = Number(settings.discount.maxDiscountPercent || 0);
      const threshold = Number(settings.discount.managerPinThresholdPercent || 0);
      if (numericValue > max || (numericValue > threshold && managerPin !== settings.cashiers.managerPin)) {
        return;
      }

      setAppliedDiscount({
        type,
        value: numericValue,
        amount: Number((subtotal * (numericValue / 100)).toFixed(2)),
      });
      return;
    }

    const discountAmountUsd = convertMoney(numericValue, activeDisplayCurrency, "USD", settings.currency.exchangeRate);
    setAppliedDiscount({
      type,
      value: numericValue,
      amount: Number(Math.min(discountAmountUsd, subtotal).toFixed(2)),
    });
  }

  async function confirmPayment(payment) {
    const transaction = {
      id: createTransactionId(),
      items: cart,
      subtotal,
      tax,
      discount: appliedDiscount.amount,
      total,
      cashReceived: payment.cashReceived,
      changeDue: payment.changeDue,
      paymentMethod: payment.paymentMethod,
      reference: payment.reference || "",
      cashierName: payment.cashierName,
      currency: payment.currency,
      timestamp: new Date().toISOString(),
      synced: false,
    };

    await put("transactions", transaction);

    if (isOnline) {
      try {
        const response = await fetch("/api/pos/transaction", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(transaction),
        });

        if (response.ok) {
          transaction.synced = true;
          await put("transactions", transaction);
        } else {
          await addToQueue({ url: "/api/pos/transaction", method: "POST", body: JSON.stringify(transaction) });
          setPendingSyncCount(pendingSyncCount + 1);
        }
      } catch {
        await addToQueue({ url: "/api/pos/transaction", method: "POST", body: JSON.stringify(transaction) });
        setPendingSyncCount(pendingSyncCount + 1);
      }
    } else {
      await addToQueue({ url: "/api/pos/transaction", method: "POST", body: JSON.stringify(transaction) });
      setPendingSyncCount(pendingSyncCount + 1);
    }

    clearCart();
    setPaymentOpen(false);
    setDrawerOpen(false);
    setAppliedDiscount({ type: "percent", value: 0, amount: 0 });
    setReceipt(transaction);
  }

  if (receipt) {
    return <ReceiptView transaction={receipt} settings={settings} onNewSale={() => setReceipt(null)} />;
  }

  const checkoutPanel = (
    <aside className="flex h-full min-h-0 flex-col rounded-t-3xl border border-slate-200 bg-white p-3.5 shadow-xl md:rounded-3xl">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-black">New Sale</h2>
          <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-black text-emerald-700">{itemCount}</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              if (window.confirm("Clear all cart items?")) {
                clearCart();
              }
            }}
            className="text-sm font-black text-red-600"
          >
            Clear All
          </button>
          <button
            type="button"
            onClick={() => setDrawerOpen(false)}
            className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-black text-slate-700 md:hidden"
            aria-label="Close cart"
          >
            Close
          </button>
        </div>
      </div>

      <div className="mt-3 min-h-[26rem] flex-1 space-y-2 overflow-y-auto pr-1">
        {cart.length ? (
          cart.map((item) => (
            <CartItem
              key={item.productId}
              item={item}
              settings={settings}
              displayCurrency={activeDisplayCurrency}
              onUpdateQty={(qty) => updateQty(item.productId, qty)}
              onRemove={() => removeFromCart(item.productId)}
              onUpdateNote={(note) => updateItemNote(item.productId, note)}
            />
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm font-bold text-slate-500">
            No items added yet
          </div>
        )}
      </div>

      <div className="mt-3 shrink-0 space-y-2 border-t border-slate-200 pt-3">
        <div className="flex justify-between text-sm font-bold leading-5"><span>Subtotal</span><span>{money(subtotal)}</span></div>
        {appliedDiscount.amount > 0 ? <div className="flex justify-between text-sm font-bold leading-5 text-emerald-700"><span>Discount</span><span>-{money(appliedDiscount.amount)}</span></div> : null}
        {settings.tax.enabled ? <div className="flex justify-between text-sm font-bold leading-5"><span>{settings.tax.taxName}</span><span>{money(tax)}</span></div> : null}
        <div className="flex justify-between gap-3 text-xl font-black leading-7"><span>Total</span><span className="text-right">{money(total)}</span></div>
        <div className="grid grid-cols-2 rounded-xl bg-slate-100 p-1">
          {["KHR", "USD"].map((currency) => (
            <button key={currency} type="button" onClick={() => setDisplayCurrency(currency)} className={activeDisplayCurrency === currency ? "rounded-lg bg-white py-1.5 text-sm font-black shadow-sm" : "py-1.5 text-sm font-black text-slate-600"}>
              {currency}
            </button>
          ))}
        </div>

        <div>
          <button type="button" onClick={() => setDiscountOpen((value) => !value)} className="text-sm font-black text-emerald-700">
            Add Discount
          </button>
          {discountOpen ? (
            <div className="mt-2 rounded-2xl bg-slate-50 p-2.5">
              <div className="grid grid-cols-[minmax(0,1fr)_7rem] gap-2">
                <div className="grid grid-cols-2 gap-1.5">
                  {["percent", "fixed"].map((type) => (
                    <button key={type} type="button" onClick={() => setDiscountType(type)} className={discountType === type ? "rounded-lg bg-slate-900 py-2 text-sm font-black text-white" : "rounded-lg bg-white py-2 text-sm font-black"}>
                      {type === "percent" ? "%" : "Fixed"}
                    </button>
                  ))}
                </div>
                <input value={discountValue} onChange={(event) => setDiscountValue(event.target.value)} type="number" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold outline-none" />
              </div>
              {discountType === "percent" && Number(discountValue || 0) > Number(settings.discount.managerPinThresholdPercent || 0) ? (
                <input value={managerPin} onChange={(event) => setManagerPin(event.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="Manager PIN" className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold outline-none" />
              ) : null}
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                {settings.discount.presets.map((preset) => (
                  <button key={preset} type="button" onClick={() => applyDiscount(preset, "percent")} className="rounded-full bg-white px-3 py-1 text-xs font-black">
                    {preset}%
                  </button>
                ))}
                <button type="button" onClick={() => applyDiscount()} className="ml-auto rounded-full bg-emerald-600 px-4 py-1.5 text-xs font-black text-white">
                  Apply
                </button>
              </div>
            </div>
          ) : null}
        </div>

        <button type="button" disabled={!cart.length} onClick={() => setPaymentOpen(true)} className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-base font-black text-white disabled:bg-slate-300">
          Charge {money(total)}
        </button>
      </div>
    </aside>
  );

  return (
    <div className="min-h-[calc(100dvh-2rem)] md:h-[calc(100dvh-3rem)] md:min-h-[44rem]">
      <div className="min-h-[calc(100dvh-2rem)] md:grid md:h-full md:min-h-0 md:grid-cols-[minmax(0,1fr)_24rem] md:gap-5 xl:grid-cols-[minmax(0,1fr)_28rem]">
        <section className="min-h-[36rem] overflow-hidden rounded-3xl border border-slate-200 bg-white p-4 shadow-sm md:min-h-0">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative flex-1">
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search product name or SKU..." className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 pr-12 text-sm font-bold outline-none focus:border-emerald-500" />
              {query ? <button type="button" onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full px-2 py-1 text-sm font-black">X</button> : null}
            </div>
            <button type="button" onClick={holdCurrentSale} disabled={!cart.length} className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-black text-white disabled:bg-slate-300">
              Hold Current Sale
            </button>
          </div>

          <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
            {categories.map((entry) => (
              <button key={entry} type="button" onClick={() => setCategory(entry)} className={category === entry ? "shrink-0 rounded-full bg-slate-900 px-4 py-2 text-sm font-black text-white" : "shrink-0 rounded-full bg-slate-100 px-4 py-2 text-sm font-black text-slate-700"}>
                {entry} <span className="ml-1 opacity-70">{categoryCounts[entry] || 0}</span>
              </button>
            ))}
          </div>

          {heldSales.length ? (
            <div className="mt-4 flex items-center gap-2 overflow-x-auto rounded-2xl bg-amber-50 p-3">
              <span className="shrink-0 text-sm font-black text-amber-900">Held Sales:</span>
              {heldSales.map((sale) => (
                <button key={sale.id} type="button" onClick={() => restoreHeldSale(sale.id)} className="shrink-0 rounded-full bg-white px-3 py-1.5 text-xs font-black text-amber-900">
                  {sale.label}
                </button>
              ))}
            </div>
          ) : null}

          <div className="mt-4 max-h-[calc(100dvh-16rem)] overflow-y-auto pr-1 md:h-[calc(100%-9rem)] md:max-h-none">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
              {visibleProducts.map((product) => (
                <ProductCard key={product.id} product={product} settings={settings} onAdd={addToCart} />
              ))}
            </div>
          </div>
        </section>

        <div className="hidden min-h-0 w-full md:block">{checkoutPanel}</div>
      </div>

      {cart.length ? (
        <button type="button" onClick={() => setDrawerOpen(true)} className="fixed bottom-4 left-4 right-4 z-40 rounded-2xl bg-emerald-600 px-4 py-4 text-lg font-black text-white shadow-xl md:hidden">
          View Cart - {itemCount} items - {money(total, false)}
        </button>
      ) : null}

      {drawerOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-end bg-slate-950/50 md:hidden"
          onClick={() => setDrawerOpen(false)}
        >
          <div className="max-h-[96dvh] w-full" onClick={(event) => event.stopPropagation()}>
            {checkoutPanel}
          </div>
        </div>
      ) : null}

      <PaymentModal
        open={paymentOpen}
        summary={{ subtotal, tax, discount: appliedDiscount.amount, total, itemCount }}
        settings={settings}
        displayCurrency={activeDisplayCurrency}
        cashierName={cashierName}
        onClose={() => setPaymentOpen(false)}
        onConfirm={confirmPayment}
      />
    </div>
  );
}
