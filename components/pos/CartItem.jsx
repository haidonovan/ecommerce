"use client";

import { useState } from "react";

import { formatDisplayMoney } from "@/components/pos/format";

export function CartItem({ item, settings, displayCurrency, onUpdateQty, onRemove, onUpdateNote }) {
  const [showNote, setShowNote] = useState(Boolean(item.note));
  const lineTotal = item.qty * item.price;

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-2.5">
      <div className="flex items-start justify-between gap-3">
        <button type="button" onClick={() => setShowNote((value) => !value)} className="min-w-0 text-left">
          <p className="truncate text-sm font-black">{item.name}</p>
          <p className="mt-0.5 text-xs font-bold text-slate-500">
            Unit: {formatDisplayMoney(item.price, displayCurrency, settings)}
          </p>
        </button>
        <button type="button" onClick={onRemove} className="rounded-full bg-red-50 px-2 py-1 text-xs font-black text-red-700">
          Trash
        </button>
      </div>

      <div className="mt-2 flex items-center justify-between gap-3">
        <div className="flex items-center rounded-full bg-white p-1">
          <button type="button" onClick={() => onUpdateQty(Math.max(0, item.qty - 1))} className="size-7 rounded-full bg-slate-100 font-black">
            -
          </button>
          <input
            value={item.qty}
            onChange={(event) => onUpdateQty(event.target.value)}
            className="w-10 bg-transparent text-center text-sm font-black outline-none"
          />
          <button type="button" onClick={() => onUpdateQty(item.qty + 1)} className="size-7 rounded-full bg-slate-100 font-black">
            +
          </button>
        </div>
        <p className="text-sm font-black">
          {formatDisplayMoney(lineTotal, displayCurrency, settings)}
        </p>
      </div>

      {showNote ? (
        <textarea
          value={item.note || ""}
          onChange={(event) => onUpdateNote(event.target.value)}
          placeholder="Item note..."
          className="mt-3 min-h-16 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold outline-none focus:border-emerald-500"
        />
      ) : null}
    </div>
  );
}
