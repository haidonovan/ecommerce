"use client";

import { useMemo, useState } from "react";

import { formatKHR, formatMoney, formatUSD, toKHR, toUSD } from "@/components/pos/format";

const keypad = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "000", "0", "back"];

export function PaymentModal({ open, summary, settings, displayCurrency, cashierName, onClose, onConfirm }) {
  const [method, setMethod] = useState("cash");
  const [cashInput, setCashInput] = useState("");
  const [reference, setReference] = useState("");
  const exchangeRate = settings.currency.exchangeRate;

  const cashReceivedKHR = useMemo(() => {
    const rawValue = Number(cashInput || 0);
    return displayCurrency === "USD" ? toKHR(rawValue, exchangeRate) : rawValue;
  }, [cashInput, displayCurrency, exchangeRate]);

  const changeDue = Math.max(0, cashReceivedKHR - summary.total);
  const canConfirmCash = cashReceivedKHR >= summary.total;

  if (!open) {
    return null;
  }

  function pressKey(key) {
    if (key === "back") {
      setCashInput((value) => value.slice(0, -1));
      return;
    }

    setCashInput((value) => `${value}${key}`);
  }

  function setQuickAmount(amountKHR) {
    setCashInput(String(displayCurrency === "USD" ? Number(toUSD(amountKHR, exchangeRate).toFixed(2)) : amountKHR));
  }

  function confirm() {
    onConfirm({
      paymentMethod: method,
      cashReceived: method === "cash" ? cashReceivedKHR : summary.total,
      changeDue: method === "cash" ? changeDue : 0,
      reference,
      cashierName,
      currency: displayCurrency,
    });
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 p-4">
      <div className="mx-auto min-h-[calc(100dvh-2rem)] max-w-5xl rounded-3xl bg-white p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-700">Payment</p>
            <h2 className="mt-2 text-3xl font-black">Complete Sale</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-full bg-slate-100 px-4 py-2 text-sm font-black">
            Close
          </button>
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[22rem_minmax(0,1fr)]">
          <section className="rounded-2xl bg-slate-50 p-4">
            <h3 className="font-black">Order Summary</h3>
            <div className="mt-4 space-y-2 text-sm font-bold">
              <div className="flex justify-between"><span>Items</span><span>{summary.itemCount}</span></div>
              <div className="flex justify-between"><span>Subtotal</span><span>{formatKHR(summary.subtotal)}</span></div>
              <div className="flex justify-between text-emerald-700"><span>Discount</span><span>-{formatKHR(summary.discount)}</span></div>
              <div className="flex justify-between"><span>{settings.tax.taxName}</span><span>{formatKHR(summary.tax)}</span></div>
              <div className="flex justify-between border-t border-slate-200 pt-3 text-xl font-black">
                <span>Total</span><span>{formatKHR(summary.total)}</span>
              </div>
              <p className="text-slate-500">{formatUSD(toUSD(summary.total, exchangeRate))}</p>
            </div>
          </section>

          <section>
            <div className="grid grid-cols-3 rounded-2xl bg-slate-100 p-1">
              {["cash", "card", "qr"].map((entry) => (
                <button
                  key={entry}
                  type="button"
                  onClick={() => setMethod(entry)}
                  className={method === entry ? "rounded-xl bg-white px-4 py-3 text-sm font-black capitalize shadow-sm" : "rounded-xl px-4 py-3 text-sm font-black capitalize text-slate-600"}
                >
                  {entry === "qr" ? "QR/Other" : entry}
                </button>
              ))}
            </div>

            {method === "cash" ? (
              <div className="mt-5 grid gap-5 md:grid-cols-[minmax(0,1fr)_15rem]">
                <div>
                  <p className="text-sm font-bold text-slate-500">Cash Received</p>
                  <p className="mt-2 rounded-2xl bg-slate-950 px-4 py-4 text-3xl font-black text-white">
                    {cashInput ? formatMoney(displayCurrency === "USD" ? Number(cashInput) : Number(cashInput), displayCurrency, exchangeRate) : "0"}
                  </p>
                  <p className={changeDue >= 0 ? "mt-4 text-2xl font-black text-emerald-700" : "mt-4 text-2xl font-black text-red-700"}>
                    Change Due: {formatKHR(changeDue)} ({formatUSD(toUSD(changeDue, exchangeRate))})
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {[summary.total, 5000, 10000, 20000, 4100, 20500, 41000].map((amount) => (
                      <button key={amount} type="button" onClick={() => setQuickAmount(amount)} className="rounded-full bg-slate-100 px-4 py-2 text-sm font-black">
                        {amount === summary.total ? "Exact" : formatKHR(amount)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {keypad.map((key) => (
                    <button key={key} type="button" onClick={() => pressKey(key)} className="rounded-2xl bg-slate-100 py-4 text-xl font-black">
                      {key === "back" ? "⌫" : key}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  disabled={!canConfirmCash}
                  onClick={confirm}
                  className="rounded-2xl bg-emerald-600 px-5 py-4 text-lg font-black text-white disabled:bg-slate-300 md:col-span-2"
                >
                  Confirm Payment
                </button>
              </div>
            ) : (
              <div className="mt-5 space-y-4">
                <div className="rounded-2xl bg-slate-50 p-8 text-center text-xl font-black">
                  Swipe card or scan QR
                </div>
                <input
                  value={reference}
                  onChange={(event) => setReference(event.target.value)}
                  placeholder="Reference number (optional)"
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 font-bold outline-none focus:border-emerald-500"
                />
                <button type="button" onClick={confirm} className="w-full rounded-2xl bg-emerald-600 px-5 py-4 text-lg font-black text-white">
                  Confirm Payment
                </button>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
