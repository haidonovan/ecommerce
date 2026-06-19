"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { convertMoney, formatMoney, formatPrimaryMoney } from "@/components/pos/format";
import { ProductFormModal } from "@/components/pos/ProductFormModal";
import { useOffline } from "@/hooks/useOffline";
import { usePOSSettings } from "@/hooks/usePOSSettings";
import { clearStore, getAll, put, remove } from "@/lib/db";

const mockProducts = [
  { id: "angkor-rice", name: "Angkor Premium Jasmine Rice", sku: "RICE-001", category: "Grocery", price: 7.8, stock: 18, lowStockThreshold: 5, unit: "bag", image: "", isActive: true, createdAt: "2026-01-01T01:00:00Z" },
  { id: "coconut-water", name: "Fresh Coconut Water", sku: "DRINK-011", category: "Beverages", price: 1.22, stock: 14, lowStockThreshold: 5, unit: "bottle", image: "", isActive: true, createdAt: "2026-01-02T01:00:00Z" },
  { id: "banana-chips", name: "Banana Chips Pack", sku: "SNACK-020", category: "Snacks", price: 1.83, stock: 2, lowStockThreshold: 5, unit: "pack", image: "", isActive: true, createdAt: "2026-01-03T01:00:00Z" },
  { id: "fish-sauce", name: "Fish Sauce Bottle", sku: "SAUCE-002", category: "Sauce", price: 1.59, stock: 0, lowStockThreshold: 5, unit: "bottle", image: "", isActive: false, createdAt: "2026-01-04T01:00:00Z" },
];

function normalizeProduct(product, exchangeRate = 4100) {
  const price = product.price !== undefined && product.price !== ""
    ? Number(product.price)
    : convertMoney(product.price_khr, "KHR", "USD", exchangeRate);

  return {
    id: product.id || `prd-${Date.now()}`,
    name: product.name || "Unnamed Product",
    sku: product.sku || product.id || "",
    description: product.description || "",
    category: product.category || "General",
    price: Number(price || 0),
    stock: Number(product.stock || 0),
    lowStockThreshold: Number(product.lowStockThreshold || 5),
    unit: product.unit || "pcs",
    image: product.image || product.imageUrl || "",
    isActive: product.isActive !== false,
    createdAt: product.createdAt || new Date().toISOString(),
    updatedAt: product.updatedAt || new Date().toISOString(),
  };
}

function stockLabel(product) {
  if (product.stock <= 0) {
    return <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-black text-red-700">Out</span>;
  }

  if (product.stock <= product.lowStockThreshold) {
    return <span className="rounded-full bg-yellow-100 px-2.5 py-1 text-xs font-black text-yellow-800">Low</span>;
  }

  return <span className="font-black text-emerald-700">{product.stock.toLocaleString()}</span>;
}

function parseCsv(text, exchangeRate = 4100) {
  const lines = text.split(/\r?\n/).filter(Boolean);
  const headers = lines[0]?.split(",").map((header) => header.trim().toLowerCase()) || [];

  return lines.slice(1).map((line, index) => {
    const values = line.split(",").map((value) => value.trim());
    const row = headers.reduce((entry, header, headerIndex) => ({ ...entry, [header]: values[headerIndex] || "" }), {});
    const product = normalizeProduct({
      id: row.sku || `csv-${Date.now()}-${index}`,
      name: row.name,
      sku: row.sku,
      category: row.category,
      price: row.price || row.price_usd,
      price_khr: row.price_khr,
      stock: row.stock,
    }, exchangeRate);

    return {
      ...product,
      rowNumber: index + 2,
      errors: [!product.name ? "Missing name" : "", !product.price ? "Missing price" : ""].filter(Boolean),
    };
  });
}

export default function PosProductsPage() {
  const { isOnline } = useOffline();
  const { settings } = usePOSSettings();
  const fileInputRef = useRef(null);
  const [products, setProducts] = useState(mockProducts.map(normalizeProduct));
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [sortBy, setSortBy] = useState("newest");
  const [status, setStatus] = useState("all");
  const [view, setView] = useState("table");
  const [selectedIds, setSelectedIds] = useState([]);
  const [lastSynced, setLastSynced] = useState("Never");
  const [syncing, setSyncing] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [editingProduct, setEditingProduct] = useState(null);
  const [csvRows, setCsvRows] = useState([]);
  const [importResult, setImportResult] = useState("");
  const primaryCurrency = settings.currency.primaryCurrency || "USD";
  const secondaryCurrency = primaryCurrency === "USD" ? "KHR" : "USD";

  function formatSecondaryPrice(value) {
    const converted = convertMoney(value, "USD", secondaryCurrency, settings.currency.exchangeRate);
    return formatMoney(converted, secondaryCurrency, settings.currency.exchangeRate, false);
  }

  useEffect(() => {
    let active = true;

    async function loadProducts() {
      const localProducts = await getAll("products");
      if (active && Array.isArray(localProducts) && localProducts.length) {
        setProducts(localProducts.map((product) => normalizeProduct(product, settings.currency.exchangeRate)));
      }
      setLastSynced(window.localStorage.getItem("pos-products-last-synced") || "Never");

      if (!isOnline) {
        return;
      }

      await syncProducts(false);
    }

    loadProducts();

    return () => {
      active = false;
    };
    // syncProducts intentionally stays out of deps so initial online refresh runs once per online state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline]);

  const categories = useMemo(() => ["All", ...new Set(products.map((product) => product.category))], [products]);

  const visibleProducts = useMemo(() => {
    const lower = query.trim().toLowerCase();
    const filtered = products.filter((product) => {
      const matchesSearch =
        !lower ||
        product.name.toLowerCase().includes(lower) ||
        product.sku.toLowerCase().includes(lower);
      const matchesCategory = category === "All" || product.category === category;
      const matchesStatus =
        status === "all" ||
        (status === "active" && product.isActive) ||
        (status === "inactive" && !product.isActive);
      return matchesSearch && matchesCategory && matchesStatus;
    });

    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "name-asc":
          return a.name.localeCompare(b.name);
        case "name-desc":
          return b.name.localeCompare(a.name);
        case "price-asc":
          return a.price - b.price;
        case "price-desc":
          return b.price - a.price;
        case "stock-asc":
          return a.stock - b.stock;
        case "stock-desc":
          return b.stock - a.stock;
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });
  }, [category, products, query, sortBy, status]);

  async function persistProducts(nextProducts) {
    setProducts(nextProducts);
    await clearStore("products");
    await Promise.all(nextProducts.map((product) => put("products", product)));
  }

  async function syncProducts(showLoading = true) {
    if (showLoading) {
      setSyncing(true);
    }

    try {
      const response = await fetch("/api/products", { cache: "no-store" });
      if (!response.ok) {
        return;
      }
      const payload = await response.json();
      const rawProducts = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : [];
      const nextProducts = rawProducts.map((product) => normalizeProduct(product, settings.currency.exchangeRate));
      if (nextProducts.length) {
        await persistProducts(nextProducts);
        const timestamp = new Date().toLocaleString();
        window.localStorage.setItem("pos-products-last-synced", timestamp);
        setLastSynced(timestamp);
      }
    } catch {
      // Keep local products when server sync is unavailable.
    } finally {
      setSyncing(false);
    }
  }

  async function saveProduct(product, mode) {
    const method = mode === "edit" ? "PATCH" : "POST";

    try {
      await fetch("/api/admin/products", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(product),
      });
    } catch {
      // Local IndexedDB update still happens so POS remains offline-capable.
    }

    const nextProducts =
      mode === "edit"
        ? products.map((entry) => (entry.id === product.id ? normalizeProduct(product, settings.currency.exchangeRate) : entry))
        : [normalizeProduct(product, settings.currency.exchangeRate), ...products];
    await persistProducts(nextProducts);
    setModalOpen(false);
  }

  async function deleteProducts(ids) {
    const idSet = new Set(ids);
    try {
      await fetch("/api/admin/products", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
    } catch {
      // Continue with local delete.
    }

    await Promise.all(ids.map((id) => remove("products", id)));
    setProducts((current) => current.filter((product) => !idSet.has(product.id)));
    setSelectedIds([]);
  }

  async function bulkStatus(isActive) {
    const idSet = new Set(selectedIds);
    const nextProducts = products.map((product) => (idSet.has(product.id) ? { ...product, isActive } : product));
    try {
      await fetch("/api/admin/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds, isActive }),
      });
    } catch {}
    await persistProducts(nextProducts);
    setSelectedIds([]);
  }

  function openEdit(product) {
    setEditingProduct(product);
    setModalMode("edit");
    setModalOpen(true);
  }

  function openAdd() {
    setEditingProduct(null);
    setModalMode("add");
    setModalOpen(true);
  }

  function handleCsvFile(file) {
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => setCsvRows(parseCsv(String(reader.result || ""), settings.currency.exchangeRate));
    reader.readAsText(file);
  }

  async function importCsvRows() {
    const validRows = csvRows.filter((row) => !row.errors.length);
    try {
      await fetch("/api/admin/products/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ products: validRows }),
      });
    } catch {}

    const nextProducts = [...validRows.map((product) => normalizeProduct(product, settings.currency.exchangeRate)), ...products];
    await persistProducts(nextProducts);
    setImportResult(`Imported ${validRows.length} rows. ${csvRows.length - validRows.length} errors.`);
    setCsvRows([]);
  }

  function toggleSelected(id) {
    setSelectedIds((current) => (current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id]));
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-700">Products</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight">Products</h1>
          <p className="mt-1 text-sm font-semibold text-slate-500">Last synced {lastSynced}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={openAdd} className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-black text-white">+ Add Product</button>
          <button type="button" onClick={() => fileInputRef.current?.click()} className="rounded-2xl bg-white px-4 py-3 text-sm font-black text-slate-700 shadow-sm">Import CSV</button>
          <input ref={fileInputRef} type="file" accept=".csv,text/csv" onChange={(event) => handleCsvFile(event.target.files?.[0])} className="hidden" />
          <button type="button" onClick={() => syncProducts()} disabled={syncing} className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-black text-white disabled:bg-slate-300">{syncing ? "Syncing..." : "Sync from Server"}</button>
          <div className="grid grid-cols-2 rounded-2xl bg-white p-1 shadow-sm">
            <button type="button" onClick={() => setView("table")} className={view === "table" ? "rounded-xl bg-emerald-600 px-3 py-2 text-sm font-black text-white" : "rounded-xl px-3 py-2 text-sm font-black"}>Table</button>
            <button type="button" onClick={() => setView("grid")} className={view === "grid" ? "rounded-xl bg-emerald-600 px-3 py-2 text-sm font-black text-white" : "rounded-xl px-3 py-2 text-sm font-black"}>Grid</button>
          </div>
        </div>
      </div>

      <div className="grid gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm lg:grid-cols-[minmax(0,1fr)_13rem_13rem_11rem_auto]">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name or SKU" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:border-emerald-500" />
        <select value={category} onChange={(event) => setCategory(event.target.value)} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:border-emerald-500">
          {categories.map((entry) => <option key={entry}>{entry === "All" ? "All Categories" : entry}</option>)}
        </select>
        <select value={sortBy} onChange={(event) => setSortBy(event.target.value)} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:border-emerald-500">
          <option value="name-asc">Name A-Z</option>
          <option value="name-desc">Name Z-A</option>
          <option value="price-asc">Price Low-High</option>
          <option value="price-desc">Price High-Low</option>
          <option value="stock-asc">Stock Low-High</option>
          <option value="stock-desc">Stock High-Low</option>
          <option value="newest">Newest</option>
        </select>
        <select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:border-emerald-500">
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <div className="flex items-center text-sm font-black text-slate-600">Showing {visibleProducts.length} of {products.length}</div>
      </div>

      {selectedIds.length ? (
        <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-amber-50 p-3 text-sm font-black text-amber-900">
          {selectedIds.length} selected
          <button type="button" onClick={() => bulkStatus(true)} className="rounded-xl bg-white px-3 py-2">Set Active</button>
          <button type="button" onClick={() => bulkStatus(false)} className="rounded-xl bg-white px-3 py-2">Set Inactive</button>
          <button type="button" onClick={() => deleteProducts(selectedIds)} className="rounded-xl bg-red-600 px-3 py-2 text-white">Delete Selected</button>
        </div>
      ) : null}

      {csvRows.length ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-black">CSV Preview ({csvRows.length} rows)</h2>
            <button type="button" onClick={importCsvRows} className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-black text-white">
              Import {csvRows.filter((row) => !row.errors.length).length} valid rows
            </button>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[40rem] text-left text-sm">
              <thead><tr className="bg-slate-50"><th className="px-3 py-2">Row</th><th>Name</th><th>SKU</th><th>Category</th><th>Price</th><th>Stock</th><th>Errors</th></tr></thead>
              <tbody>
                {csvRows.map((row) => (
                  <tr key={row.rowNumber} className={row.errors.length ? "bg-red-50" : ""}>
                    <td className="px-3 py-2 font-bold">{row.rowNumber}</td><td>{row.name}</td><td>{row.sku}</td><td>{row.category}</td><td>{formatPrimaryMoney(row.price, settings, false)}</td><td>{row.stock}</td><td className="text-red-700">{row.errors.join(", ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
      {importResult ? <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-700">{importResult}</div> : null}

      {view === "table" ? (
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[68rem] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-[0.16em] text-slate-500">
                <tr>
                  <th className="px-4 py-3"><input type="checkbox" checked={selectedIds.length === visibleProducts.length && visibleProducts.length > 0} onChange={(event) => setSelectedIds(event.target.checked ? visibleProducts.map((product) => product.id) : [])} /></th>
                  <th className="px-4 py-3">Image</th><th className="px-4 py-3">Name + SKU</th><th className="px-4 py-3">Category</th><th className="px-4 py-3">Display ({primaryCurrency})</th><th className="px-4 py-3">Converted ({secondaryCurrency})</th><th className="px-4 py-3">Stock</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visibleProducts.map((product) => (
                  <tr key={product.id}>
                    <td className="px-4 py-3"><input type="checkbox" checked={selectedIds.includes(product.id)} onChange={() => toggleSelected(product.id)} /></td>
                    <td className="px-4 py-3"><div className="flex size-10 items-center justify-center rounded-xl bg-slate-200 bg-cover bg-center font-black text-slate-500" style={product.image ? { backgroundImage: `url(${product.image})` } : undefined}>{product.image ? "" : product.name.charAt(0)}</div></td>
                    <td className="px-4 py-3"><p className="font-black">{product.name}</p><p className="text-xs font-bold text-slate-500">{product.sku}</p></td>
                    <td className="px-4 py-3 font-bold text-slate-600">{product.category}</td>
                    <td className="px-4 py-3 font-black">{formatPrimaryMoney(product.price, settings, false)}</td>
                    <td className="px-4 py-3 font-bold text-slate-600">{formatSecondaryPrice(product.price)}</td>
                    <td className="px-4 py-3">{stockLabel(product)}</td>
                    <td className="px-4 py-3"><span className={product.isActive ? "rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700" : "rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-500"}>{product.isActive ? "Active" : "Inactive"}</span></td>
                    <td className="px-4 py-3"><div className="flex gap-2"><button type="button" onClick={() => openEdit(product)} className="rounded-xl bg-slate-100 px-3 py-2 font-black">✎</button><button type="button" onClick={() => window.confirm("Delete this product?") && deleteProducts([product.id])} className="rounded-xl bg-red-50 px-3 py-2 font-black text-red-700">🗑</button></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {visibleProducts.map((product) => (
            <article key={product.id} className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="relative flex h-48 items-center justify-center bg-slate-200 bg-cover bg-center text-5xl font-black text-slate-500" style={product.image ? { backgroundImage: `url(${product.image})` } : undefined}>
                {product.image ? "" : product.name.charAt(0)}
                <button type="button" onClick={() => openEdit(product)} className="absolute inset-x-4 bottom-4 hidden rounded-2xl bg-slate-950/90 py-3 text-sm font-black text-white group-hover:block">Edit</button>
              </div>
              <div className="p-4">
                <p className="font-black">{product.name}</p><p className="text-xs font-bold text-slate-500">{product.sku} · {product.category}</p>
                <p className="mt-3 text-lg font-black">{formatPrimaryMoney(product.price, settings, false)}</p>
                <p className="text-sm font-bold text-slate-500">{formatSecondaryPrice(product.price)}</p>
                <div className="mt-3">{stockLabel(product)}</div>
              </div>
            </article>
          ))}
        </div>
      )}

      <ProductFormModal
        open={modalOpen}
        mode={modalMode}
        product={editingProduct}
        categories={categories.filter((entry) => entry !== "All")}
        exchangeRate={settings.currency.exchangeRate}
        onClose={() => setModalOpen(false)}
        onSave={saveProduct}
      />
    </div>
  );
}
