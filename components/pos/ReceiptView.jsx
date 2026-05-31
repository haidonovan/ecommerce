"use client";

import { formatKHR } from "@/components/pos/format";

export function ReceiptView({ transaction, settings, onNewSale }) {
  if (!transaction) {
    return null;
  }

  return (
    <div className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <style>
        {`@media print {
          body * { visibility: hidden; }
          #receipt-print, #receipt-print * { visibility: visible; }
          #receipt-print { position: absolute; inset: 0; width: 100%; padding: 24px; }
          .no-print { display: none !important; }
        }`}
      </style>

      <div id="receipt-print">
        <div className="text-center">
          <h1 className="text-2xl font-black">{settings.storeInfo.storeName}</h1>
          <p className="mt-1 text-sm font-semibold text-slate-600">{settings.storeInfo.storeAddress}</p>
          <p className="text-sm font-semibold text-slate-600">{settings.storeInfo.receiptHeaderNote}</p>
        </div>

        <div className="mt-5 border-y border-dashed border-slate-300 py-3 text-sm font-bold">
          <div className="flex justify-between"><span>Transaction</span><span>{transaction.id}</span></div>
          <div className="flex justify-between"><span>Date</span><span>{new Date(transaction.timestamp).toLocaleString()}</span></div>
          <div className="flex justify-between"><span>Cashier</span><span>{transaction.cashierName || "POS"}</span></div>
        </div>

        <div className="mt-4 space-y-3">
          {transaction.items.map((item) => (
            <div key={item.productId} className="text-sm">
              <div className="flex justify-between gap-4 font-bold">
                <span>{item.name}</span>
                <span>{formatKHR(item.price * item.qty)}</span>
              </div>
              <p className="text-slate-500">{item.qty} × {formatKHR(item.price)}</p>
              {item.note ? <p className="text-slate-500">Note: {item.note}</p> : null}
            </div>
          ))}
        </div>

        <div className="mt-5 space-y-2 border-t border-slate-200 pt-4 text-sm font-bold">
          <div className="flex justify-between"><span>Subtotal</span><span>{formatKHR(transaction.subtotal)}</span></div>
          <div className="flex justify-between text-emerald-700"><span>Discount</span><span>-{formatKHR(transaction.discount)}</span></div>
          <div className="flex justify-between"><span>{settings.tax.taxName}</span><span>{formatKHR(transaction.tax)}</span></div>
          <div className="flex justify-between text-xl font-black"><span>Total</span><span>{formatKHR(transaction.total)}</span></div>
          <div className="flex justify-between"><span>Cash Received</span><span>{formatKHR(transaction.cashReceived)}</span></div>
          <div className="flex justify-between"><span>Change Due</span><span>{formatKHR(transaction.changeDue)}</span></div>
        </div>

        <p className="mt-6 text-center text-sm font-semibold text-slate-600">{settings.storeInfo.receiptFooterMessage}</p>
      </div>

      <div className="no-print mt-6 grid grid-cols-2 gap-3">
        <button type="button" onClick={() => window.print()} className="rounded-2xl bg-slate-900 px-4 py-3 font-black text-white">
          Print Receipt
        </button>
        <button type="button" onClick={onNewSale} className="rounded-2xl bg-emerald-600 px-4 py-3 font-black text-white">
          New Sale
        </button>
      </div>
    </div>
  );
}
