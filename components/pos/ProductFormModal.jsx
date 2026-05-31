"use client";

import { useEffect, useMemo, useState } from "react";

import { formatUSD, toUSD } from "@/components/pos/format";

const emptyProduct = {
  id: "",
  name: "",
  sku: "",
  description: "",
  category: "Beverages",
  price: 0,
  stock: 0,
  lowStockThreshold: 5,
  unit: "pcs",
  image: "",
  isActive: true,
};

function createProductId() {
  return `prd-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

function generateSku() {
  return `PRD-${Math.floor(1000 + Math.random() * 9000)}`;
}

export function ProductFormModal({ open, mode = "add", product, categories = [], exchangeRate = 4100, onClose, onSave }) {
  const [form, setForm] = useState(emptyProduct);
  const [newCategory, setNewCategory] = useState("");
  const [overrideUsd, setOverrideUsd] = useState(false);
  const [priceUsd, setPriceUsd] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) {
      return;
    }

    const nextForm = {
      ...emptyProduct,
      ...(product || {}),
      id: product?.id || createProductId(),
      sku: product?.sku || "",
      price: Number(product?.price || 0),
      stock: Number(product?.stock || 0),
      lowStockThreshold: Number(product?.lowStockThreshold || 5),
      image: product?.image || product?.imageUrl || "",
      isActive: product?.isActive !== false,
    };

    setForm(nextForm);
    setNewCategory("");
    setOverrideUsd(false);
    setPriceUsd("");
    setError("");
  }, [open, product]);

  const categoryOptions = useMemo(() => {
    return [...new Set(["Beverages", "Snacks", "Grocery", "Noodles", "Sauce", ...categories])];
  }, [categories]);

  const calculatedUsd = formatUSD(toUSD(form.price, exchangeRate));

  function patch(values) {
    setForm((current) => ({ ...current, ...values }));
  }

  function handleImageUpload(file) {
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => patch({ image: reader.result });
    reader.readAsDataURL(file);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.name.trim()) {
      setError("Product name is required.");
      return;
    }

    if (!Number(form.price)) {
      setError("Price in KHR is required.");
      return;
    }

    setSaving(true);
    setError("");

    const finalCategory = form.category === "__new" ? newCategory.trim() : form.category;
    if (!finalCategory) {
      setError("Category is required.");
      setSaving(false);
      return;
    }

    const payload = {
      ...form,
      category: finalCategory,
      sku: form.sku || generateSku(),
      price: overrideUsd && priceUsd ? Math.round(Number(priceUsd) * exchangeRate) : Number(form.price),
      stock: Number(form.stock || 0),
      lowStockThreshold: Number(form.lowStockThreshold || 0),
      updatedAt: new Date().toISOString(),
      createdAt: form.createdAt || new Date().toISOString(),
    };

    await onSave(payload, mode);
    setSaving(false);
  }

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 p-4">
      <div className="mx-auto max-w-4xl rounded-3xl bg-white p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-700">
              {mode === "add" ? "Add Product" : "Edit Product"}
            </p>
            <h2 className="mt-2 text-3xl font-black">Product Details</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-full bg-slate-100 px-4 py-2 text-sm font-black">
            Close
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 grid gap-6 lg:grid-cols-[14rem_minmax(0,1fr)]">
          <section>
            <div
              className="flex aspect-square w-full items-center justify-center rounded-3xl border border-slate-200 bg-slate-100 bg-cover bg-center text-5xl font-black text-slate-400"
              style={form.image ? { backgroundImage: `url(${form.image})` } : undefined}
            >
              {form.image ? null : form.name.charAt(0).toUpperCase() || "P"}
            </div>
            <label className="mt-4 block cursor-pointer rounded-2xl bg-slate-900 px-4 py-3 text-center text-sm font-black text-white">
              Upload Image
              <input type="file" accept="image/*" onChange={(event) => handleImageUpload(event.target.files?.[0])} className="hidden" />
            </label>
            {form.image ? (
              <button type="button" onClick={() => patch({ image: "" })} className="mt-3 w-full text-sm font-black text-red-600">
                Remove Image
              </button>
            ) : null}
          </section>

          <section className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="text-sm font-bold text-slate-700">Product Name*</label>
                <input value={form.name} onChange={(event) => patch({ name: event.target.value })} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 font-bold outline-none focus:border-emerald-500" />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-700">SKU</label>
                <div className="mt-2 flex gap-2">
                  <input value={form.sku} onChange={(event) => patch({ sku: event.target.value })} className="w-full rounded-2xl border border-slate-200 px-4 py-3 font-bold outline-none focus:border-emerald-500" />
                  <button type="button" onClick={() => patch({ sku: generateSku() })} className="rounded-2xl bg-slate-100 px-4 text-sm font-black">
                    Auto
                  </button>
                </div>
              </div>
              <div>
                <label className="text-sm font-bold text-slate-700">Category</label>
                <select value={form.category} onChange={(event) => patch({ category: event.target.value })} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 font-bold outline-none focus:border-emerald-500">
                  {categoryOptions.map((entry) => <option key={entry}>{entry}</option>)}
                  <option value="__new">+ New Category</option>
                </select>
              </div>
              {form.category === "__new" ? (
                <div className="md:col-span-2">
                  <label className="text-sm font-bold text-slate-700">New Category</label>
                  <input value={newCategory} onChange={(event) => setNewCategory(event.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 font-bold outline-none focus:border-emerald-500" />
                </div>
              ) : null}
              <div className="md:col-span-2">
                <label className="text-sm font-bold text-slate-700">Description</label>
                <textarea value={form.description} onChange={(event) => patch({ description: event.target.value })} className="mt-2 min-h-24 w-full rounded-2xl border border-slate-200 px-4 py-3 font-bold outline-none focus:border-emerald-500" />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-bold text-slate-700">Price in KHR*</label>
                <input type="number" value={form.price} onChange={(event) => patch({ price: Number(event.target.value) })} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 font-bold outline-none focus:border-emerald-500" />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-slate-700">Price in USD</label>
                  <label className="flex items-center gap-2 text-xs font-black text-slate-600">
                    <input type="checkbox" checked={overrideUsd} onChange={(event) => setOverrideUsd(event.target.checked)} className="accent-emerald-600" />
                    Override
                  </label>
                </div>
                <input value={overrideUsd ? priceUsd : calculatedUsd} onChange={(event) => setPriceUsd(event.target.value)} readOnly={!overrideUsd} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 font-bold outline-none focus:border-emerald-500 read-only:bg-slate-50" />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="text-sm font-bold text-slate-700">Current Stock*</label>
                <input type="number" value={form.stock} onChange={(event) => patch({ stock: Number(event.target.value) })} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 font-bold outline-none focus:border-emerald-500" />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-700">Low Stock Alert</label>
                <input type="number" value={form.lowStockThreshold} onChange={(event) => patch({ lowStockThreshold: Number(event.target.value) })} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 font-bold outline-none focus:border-emerald-500" />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-700">Unit</label>
                <input value={form.unit} onChange={(event) => patch({ unit: event.target.value })} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 font-bold outline-none focus:border-emerald-500" />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-4">
              <span className="text-sm font-bold text-slate-700">Active</span>
              <button type="button" onClick={() => patch({ isActive: !form.isActive })} className={form.isActive ? "h-8 w-14 rounded-full bg-emerald-600 p-1" : "h-8 w-14 rounded-full bg-slate-300 p-1"}>
                <span className={form.isActive ? "block size-6 translate-x-6 rounded-full bg-white transition" : "block size-6 rounded-full bg-white transition"} />
              </button>
            </div>

            {error ? <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div> : null}

            <div className="flex justify-end gap-3">
              <button type="button" onClick={onClose} className="rounded-2xl bg-slate-100 px-5 py-3 text-sm font-black">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white disabled:bg-slate-300">
                {saving ? "Saving..." : "Save Product"}
              </button>
            </div>
          </section>
        </form>
      </div>
    </div>
  );
}
