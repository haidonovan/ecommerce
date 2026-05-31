"use client";

import { useState } from "react";

import { formatKHR, formatUSD, toUSD } from "@/components/pos/format";

function stockBadgeClass(stock) {
  if (stock <= 0) {
    return "bg-red-100 text-red-700";
  }

  if (stock <= 5) {
    return "bg-yellow-100 text-yellow-800";
  }

  return "bg-emerald-100 text-emerald-700";
}

export function ProductCard({ product, settings, onAdd }) {
  const [pulse, setPulse] = useState(false);
  const exchangeRate = settings.currency.exchangeRate;
  const disabled = product.stock <= 0 || product.isActive === false;
  const initial = product.name?.charAt(0)?.toUpperCase() || "?";

  function handleClick() {
    if (disabled) {
      return;
    }

    onAdd(product);
    setPulse(true);
    window.setTimeout(() => setPulse(false), 180);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={[
        "relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 text-left shadow-sm transition",
        disabled ? "cursor-not-allowed opacity-55" : "hover:-translate-y-0.5 hover:shadow-md",
        pulse ? "scale-[0.98] ring-4 ring-emerald-200" : "",
      ].join(" ")}
    >
      <div className="relative aspect-square overflow-hidden rounded-xl bg-slate-100">
        {product.image ? (
          <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-slate-200 text-3xl font-black text-slate-500">
            {initial}
          </div>
        )}
        {disabled ? (
          <div className="absolute inset-0 flex items-center justify-center bg-white/75 text-sm font-black text-red-700">
            Out of Stock
          </div>
        ) : null}
      </div>

      <div className="mt-3 min-h-24">
        <p className="line-clamp-2 text-sm font-black leading-5">{product.name}</p>
        <p className="mt-2 text-base font-black text-slate-950">{formatKHR(product.price)}</p>
        {settings.currency.showBothCurrencies ? (
          <p className="text-xs font-bold text-slate-500">≈ {formatUSD(toUSD(product.price, exchangeRate))}</p>
        ) : null}
        <span className={`mt-3 inline-flex rounded-full px-2.5 py-1 text-xs font-black ${stockBadgeClass(product.stock)}`}>
          {product.stock <= 0 ? "Out" : `${product.stock} left`}
        </span>
      </div>
    </button>
  );
}
