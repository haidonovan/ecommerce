"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CalendarRange,
  CircleUserRound,
  Copy,
  Edit3,
  Gift,
  Heart,
  MessageCircle,
  ReceiptText,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Ticket,
  Trash2,
  Truck,
} from "lucide-react";

import { useAppStore } from "@/components/app-store-provider";
import { LogoutButton } from "@/components/logout-button";
import { Button } from "@/components/ui/button";
import { cn, formatCurrency } from "@/lib/utils";

function Card({ children, className = "" }) {
  return (
    <div className={cn("app-card p-4 sm:p-6", className)}>
      {children}
    </div>
  );
}

function formatDate(value) {
  const date = new Date(value);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function formatStatusLabel(status) {
  const text = String(status || "").replace(/_/g, " ");
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function statusClasses(status) {
  switch (status) {
    case "delivered":
      return "bg-emerald-100 text-emerald-700";
    case "shipped":
      return "bg-sky-100 text-sky-700";
    case "processing":
      return "bg-amber-100 text-amber-700";
    case "cancelled":
      return "bg-rose-100 text-rose-700";
    default:
      return "bg-zinc-100 text-zinc-700";
  }
}

function StatusPill({ status }) {
  return (
    <span className={cn("inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase", statusClasses(status))}>
      {formatStatusLabel(status)}
    </span>
  );
}

function MetricCard({ icon: Icon, label, value, detail }) {
  return (
    <div className="app-card-soft p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="app-top-label">{label}</p>
        <div className="rounded-2xl bg-[var(--surface-quiet)] p-2 text-[var(--action)]">
          <Icon className="size-4" />
        </div>
      </div>
      <p className="mt-3 text-4xl font-semibold tracking-tight text-[var(--foreground)]">{value}</p>
      <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">{detail}</p>
    </div>
  );
}

function NavigationTile({ href, title, description }) {
  return (
    <Link
      href={href}
      className="app-card-soft group p-5 transition hover:-translate-y-1 hover:shadow-[var(--shadow-strong)]"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-[var(--foreground)]">{title}</h3>
          <p className="mt-2 text-sm leading-7 text-[var(--muted-foreground)]">{description}</p>
        </div>
        <div className="rounded-2xl bg-[var(--surface-quiet)] p-2 text-[var(--foreground)] transition group-hover:bg-[var(--action)] group-hover:text-[var(--action-foreground)]">
          <ArrowRight className="size-4" />
        </div>
      </div>
    </Link>
  );
}

function ActivityBars({ points }) {
  const max = Math.max(...points.map((point) => point.value), 1);

  return (
    <div className="flex h-36 items-end gap-2">
      {points.map((point) => (
        <div key={point.label} className="flex flex-1 flex-col items-center gap-3">
          <div className="flex h-full w-full items-end rounded-full bg-[var(--surface-quiet)] p-1">
            <div
              className="w-full rounded-full bg-[var(--action)]/85 transition-[height] duration-500"
              style={{ height: `${Math.max((point.value / max) * 100, point.value > 0 ? 12 : 6)}%` }}
            />
          </div>
          <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--muted-foreground)]">{point.label}</span>
        </div>
      ))}
    </div>
  );
}

function buildRecentOrderSeries(orders, days) {
  const today = new Date();
  const labels = [];

  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const current = new Date(today);
    current.setHours(0, 0, 0, 0);
    current.setDate(today.getDate() - offset);
    const next = new Date(current);
    next.setDate(current.getDate() + 1);

    labels.push({
      label: current.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      value: orders.filter((order) => {
        const createdAt = new Date(order.createdAt);
        return createdAt >= current && createdAt < next;
      }).length,
    });
  }

  return labels;
}

function ProductCard({ product, store, compact = false }) {
  const isFavorite = store.isFavorite(product.id);

  return (
    <div className="app-card overflow-hidden transition hover:-translate-y-1 hover:shadow-[var(--shadow-strong)]">
      <div
        className="relative aspect-[4/3] bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0.08), rgba(0,0,0,0.56)), url(${product.image})`,
        }}
      >
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4">
          <div>
            <p className="text-xs text-white/75">{product.category}</p>
            <h3 className="mt-1 text-lg font-bold text-white">{product.name}</h3>
          </div>
          <button
            type="button"
            onClick={() => store.toggleFavorite(product.id)}
            className={cn(
              "inline-flex size-9 items-center justify-center rounded-full backdrop-blur-sm transition",
              isFavorite ? "bg-rose-100/90 text-rose-600" : "bg-white/15 text-white",
            )}
          >
            <Heart className={cn("size-4", isFavorite && "fill-current")} />
          </button>
        </div>
      </div>
      <div className="p-4">
        <p className="line-clamp-2 text-sm text-[var(--foreground)]/82">{product.description}</p>
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-[var(--muted-foreground)]">
          <span className="font-semibold text-[var(--foreground)]">
            {formatCurrency(product.price * (1 - product.discountPercent / 100))}
          </span>
          {product.discountPercent ? <span className="text-green-700">{product.discountPercent}% off</span> : null}
          <Star className="size-4 text-amber-500" />
          <span>{product.rating.toFixed(1)} *</span>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
          <span className={cn("font-medium", product.stock <= 5 ? "text-red-600" : "text-green-700")}>
            {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
          </span>
        </div>
        <div className="mt-4 flex items-center justify-between gap-3">
          <div className={cn("flex gap-2", compact && "w-full flex-col")}>
            <Link
              href={`/client/product-detail/${product.id}`}
              className="inline-flex items-center justify-center rounded-xl border border-[var(--border-soft)] bg-[var(--surface)] px-4 py-[0.875rem] text-sm font-semibold text-[var(--foreground)]"
            >
              Details
            </Link>
            <Button onClick={() => store.addToCart(product.id)}>
              {product.stock > 0 ? "Add to cart" : "Out of stock"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ClientProductListPageView({ productsOverride = null }) {
  const store = useAppStore();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("featured");
  const sourceProducts = productsOverride || store.activeProducts;
  const sourceCategories = useMemo(() => ["All", ...new Set(sourceProducts.map((product) => product.category))], [sourceProducts]);

  const products = useMemo(() => {
    const lower = query.trim().toLowerCase();
    const filtered = sourceProducts.filter((product) => {
      if (category !== "All" && product.category !== category) {
        return false;
      }
      if (!lower) {
        return true;
      }
      return [product.name, product.description, product.category].some((value) => value.toLowerCase().includes(lower));
    });

    return filtered.sort((a, b) => {
      switch (sort) {
        case "price-asc":
          return a.price - b.price;
        case "price-desc":
          return b.price - a.price;
        case "stock":
          return b.stock - a.stock;
        case "name":
          return a.name.localeCompare(b.name);
        default:
          return b.rating - a.rating;
      }
    });
  }, [sourceProducts, query, category, sort]);

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="app-search-shell p-1.5">
          <label className="flex items-center gap-3 rounded-[1.125rem] px-4 py-3">
            <Search className="size-4 text-[var(--action)]" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search products, deals, categories" className="w-full bg-transparent text-sm outline-none" />
          </label>
        </div>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {sourceCategories.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setCategory(item)}
                className="app-chip px-4 py-2 text-sm"
                data-active={category === item}
              >
                {item}
              </button>
            ))}
          </div>
          <select value={sort} onChange={(event) => setSort(event.target.value)} className="app-select w-full sm:max-w-[14rem] px-4 py-3 text-sm">
            <option value="featured">Featured</option>
            <option value="price-asc">Price low to high</option>
            <option value="price-desc">Price high to low</option>
            <option value="stock">Stock</option>
            <option value="name">Name</option>
          </select>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} store={store} />
        ))}
      </div>
    </div>
  );
}

export function ClientFavoritesPageView() {
  const store = useAppStore();

  if (!store.favoriteProducts.length) {
    return (
      <div className="flex min-h-[18rem] items-center justify-center px-4">
        <div className="max-w-md text-center">
          <div className="mx-auto flex h-[4.625rem] w-[4.625rem] items-center justify-center rounded-[1.375rem] bg-[linear-gradient(135deg,#1E4540,#B57878)] text-white shadow-[var(--shadow-card)]">
            <Heart className="size-8" />
          </div>
          <h2 className="mt-4 text-3xl font-semibold text-[var(--foreground)]">No favorites yet</h2>
          <p className="mt-2 text-sm leading-7 text-[var(--muted-foreground)]">Tap the heart on any product and it will appear here.</p>
        </div>
      </div>
    );
  }

  return <ClientProductListPageView productsOverride={store.favoriteProducts} />;
}

export function ClientCartPageView() {
  const store = useAppStore();

  return (
    <div className="space-y-4">
      {store.cartItems.length ? (
        <>
          <div className="space-y-3 px-4">
            {store.cartItems.map((item) => (
              <Card key={item.productId} className="p-3">
                <div className="flex flex-col gap-3 sm:flex-row">
                  <div
                    className="h-[5.25rem] w-[5.25rem] rounded-xl bg-cover bg-center"
                    style={{ backgroundImage: `url(${item.product.image})` }}
                  />
                  <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-[var(--foreground)]">{item.product.name}</h2>
                      <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                        {item.product.discountPercent > 0
                          ? `${formatCurrency(item.product.price * (1 - item.product.discountPercent / 100))} each (was ${formatCurrency(item.product.price)})`
                          : `${formatCurrency(item.product.price)} each`}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-[var(--foreground)]">Subtotal: {formatCurrency(item.subtotal)}</p>
                    </div>
                    <div className="flex flex-col items-start gap-2 sm:items-center">
                      <div className="flex items-center">
                        <button type="button" onClick={() => store.decreaseCart(item.productId)} className="app-icon-button p-2">
                          -
                        </button>
                        <span className="min-w-8 text-center font-semibold">{item.quantity}</span>
                        <button type="button" onClick={() => store.addToCart(item.productId)} className="app-icon-button p-2">
                          +
                        </button>
                      </div>
                      <button type="button" onClick={() => store.removeFromCart(item.productId)} className="text-sm font-medium text-[var(--action)]">
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          <div className="rounded-t-[1.5rem] border-t border-[var(--border-soft)] bg-[linear-gradient(135deg,var(--surface-quiet),var(--surface),color-mix(in_srgb,var(--action)_12%,var(--surface)))] px-4 pb-4 pt-3 shadow-[0_-4px_16px_rgba(15,24,35,0.06)]">
            <div className="flex items-center gap-4">
              <div>
                <p className="text-lg font-bold text-[var(--foreground)]">Total</p>
                <p className="mt-1 text-2xl font-extrabold text-[var(--foreground)]">{formatCurrency(store.cartTotal)}</p>
              </div>
              <div className="ml-auto">
                <Link href="/client/checkout" className="inline-flex items-center justify-center rounded-xl bg-[var(--action)] px-[1.125rem] py-[0.875rem] text-sm font-semibold text-[var(--action-foreground)] shadow-[var(--shadow-soft)]">
                  Proceed to checkout
                </Link>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="flex min-h-[14rem] items-center justify-center px-4 text-center text-[var(--muted-foreground)]">
          Your cart is empty. Add products from the shop tab.
        </div>
      )}
    </div>
  );
}

export function ClientCheckoutPageView() {
  const store = useAppStore();
  const router = useRouter();
  const [shippingAddress, setShippingAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash on delivery");
  const [couponCode, setCouponCode] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    if (shippingAddress.trim().length < 8) {
      setMessage("Please enter a full shipping address.");
      return;
    }
    const result = await store.placeOrder({
      shippingAddress: shippingAddress.trim(),
      paymentMethod,
      couponCode: couponCode.trim(),
    });
    if (!result.success || !result.order) {
      setMessage(result.message || "Unable to place order.");
      return;
    }
    setMessage(`Order ${result.order.id} placed successfully.`);
    router.push("/client/order-history");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <Card>
          <h2 className="text-xl font-semibold text-[var(--foreground)]">Order summary</h2>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between gap-4 text-sm">
              <span className="text-[var(--muted-foreground)]">Items</span>
              <span className="font-semibold text-[var(--foreground)]">{store.cartItems.length}</span>
            </div>
            {store.cartItems.map((item) => (
              <div key={item.productId} className="flex items-center justify-between gap-4 text-sm">
                <span className="text-[var(--muted-foreground)]">
                  {item.product.name} x {item.quantity}
                </span>
                <span className="font-semibold text-[var(--foreground)]">{formatCurrency(item.subtotal)}</span>
              </div>
            ))}
          </div>
          <div className="mt-5 border-t border-white/50 pt-4">
            <p className="text-sm text-[var(--muted-foreground)]">Total</p>
            <p className="mt-2 text-3xl font-semibold text-[var(--foreground)]">{formatCurrency(store.cartTotal)}</p>
          </div>
        </Card>
        <Card>
          <h2 className="text-xl font-semibold text-[var(--foreground)]">Delivery details</h2>
          <div className="mt-4 space-y-4">
            <textarea value={shippingAddress} onChange={(event) => setShippingAddress(event.target.value)} placeholder="Shipping address" className="app-input min-h-32 px-4 py-3 text-sm" />
            <div className="rounded-[1.125rem] border border-[color:color-mix(in_srgb,var(--border-soft)_85%,transparent)] bg-[linear-gradient(135deg,color-mix(in_srgb,var(--action)_12%,var(--surface)),color-mix(in_srgb,var(--accent-secondary)_35%,var(--surface)))] p-4">
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-white/35 p-2 text-[var(--foreground)]">
                  <Ticket className="size-5" />
                </div>
                <p className="text-sm leading-6 text-[var(--foreground)]/88">
                  Have a promo code from your coupon wallet or a campaign? Enter it below and the backend will validate the discount when you place the order.
                </p>
              </div>
            </div>
            <input value={couponCode} onChange={(event) => setCouponCode(event.target.value)} placeholder="Enter coupon (optional)" className="app-input px-4 py-3 text-sm" />
            <p className="text-xs leading-6 text-[var(--muted-foreground)]">Copy a code from Profile &gt; Coupon wallet and paste it here. Each account can redeem a coupon only once.</p>
            <select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)} className="app-select px-4 py-3 text-sm">
              <option>Cash on delivery</option>
              <option>Credit card</option>
              <option>Bank transfer</option>
            </select>
            {message ? <div className="rounded-2xl bg-[var(--surface-quiet)] px-4 py-3 text-sm">{message}</div> : null}
            <Button type="submit" className="w-full">
              Place order securely
            </Button>
          </div>
        </Card>
      </form>
  );
}

export function ClientOrderHistoryPageView() {
  const store = useAppStore();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("newest");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const orders = useMemo(() => {
    const lower = query.trim().toLowerCase();
    const filtered = store.orders.filter((order) => {
      if (status !== "all" && order.status !== status) {
        return false;
      }

      const createdAt = new Date(order.createdAt);
      if (startDate) {
        const start = new Date(`${startDate}T00:00:00`);
        if (createdAt < start) {
          return false;
        }
      }
      if (endDate) {
        const end = new Date(`${endDate}T23:59:59`);
        if (createdAt > end) {
          return false;
        }
      }

      if (!lower) {
        return true;
      }

      return (
        order.id.toLowerCase().includes(lower) ||
        order.shippingAddress.toLowerCase().includes(lower) ||
        order.paymentMethod.toLowerCase().includes(lower) ||
        order.lines.some((line) => line.productName.toLowerCase().includes(lower))
      );
    });

    return filtered.sort((a, b) => {
      switch (sort) {
        case "oldest":
          return new Date(a.createdAt) - new Date(b.createdAt);
        case "total-high":
          return b.total - a.total;
        case "total-low":
          return a.total - b.total;
        default:
          return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });
  }, [store.orders, query, status, sort, startDate, endDate]);

  const dateRangeLabel =
    startDate && endDate
      ? `${new Date(`${startDate}T00:00:00`).toLocaleDateString("en-US", { month: "numeric", day: "numeric" })} - ${new Date(`${endDate}T00:00:00`).toLocaleDateString("en-US", { month: "numeric", day: "numeric" })}`
      : startDate
        ? `From ${new Date(`${startDate}T00:00:00`).toLocaleDateString("en-US", { month: "numeric", day: "numeric" })}`
        : endDate
          ? `Until ${new Date(`${endDate}T00:00:00`).toLocaleDateString("en-US", { month: "numeric", day: "numeric" })}`
          : "Date range";

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="grid gap-3 xl:grid-cols-[1.3fr_0.8fr_0.8fr]">
          <label className="flex items-center gap-3 rounded-2xl bg-[var(--surface)] px-4 py-3">
            <Search className="size-4 text-[var(--action)]" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search order ID, address, payment, product"
              className="w-full bg-transparent text-sm outline-none"
            />
          </label>
          <select value={status} onChange={(event) => setStatus(event.target.value)} className="app-select px-4 py-3 text-sm">
            <option value="all">All status</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select value={sort} onChange={(event) => setSort(event.target.value)} className="app-select px-4 py-3 text-sm">
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="total-high">Total high-low</option>
            <option value="total-low">Total low-high</option>
          </select>
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-[1fr_1fr_auto]">
          <input type="date" value={startDate} max={endDate || undefined} onChange={(event) => setStartDate(event.target.value)} className="app-input px-4 py-3 text-sm" />
          <input type="date" value={endDate} min={startDate || undefined} onChange={(event) => setEndDate(event.target.value)} className="app-input px-4 py-3 text-sm" />
          <button
            type="button"
            onClick={() => {
              setStartDate("");
              setEndDate("");
            }}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[var(--border-soft)] bg-[var(--surface)] px-4 py-3 text-sm font-semibold text-[var(--foreground)]"
          >
            <CalendarRange className="size-4" />
            {dateRangeLabel}
          </button>
        </div>
      </Card>

      {store.orders.length === 0 ? (
        <div className="flex min-h-[12rem] items-center justify-center text-center text-[var(--muted-foreground)]">
          No orders yet. Completed orders will show here.
        </div>
      ) : (
        <div className="space-y-3">
          {orders.length ? (
          orders.map((order) => (
            <details key={order.id} className="app-card overflow-hidden">
              <summary className="cursor-pointer list-none px-5 py-4 [&::-webkit-details-marker]:hidden">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-lg font-semibold text-[var(--foreground)]">{order.id}</h2>
                      <StatusPill status={order.status} />
                    </div>
                    <p className="mt-2 text-sm text-[var(--muted-foreground)]">{formatDate(order.createdAt)}</p>
                    <p className="mt-1 text-sm leading-6 text-[var(--muted-foreground)]">{order.shippingAddress}</p>
                  </div>
                  <div className="rounded-2xl bg-[var(--surface)] px-4 py-3 text-left lg:min-w-[11rem] lg:text-right">
                    <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted-foreground)]">Total</p>
                    <p className="mt-2 text-xl font-semibold text-[var(--foreground)]">{formatCurrency(order.total)}</p>
                  </div>
                </div>
              </summary>

              <div className="grid gap-5 border-t border-[var(--border-soft)] px-5 py-5 xl:grid-cols-[1.1fr_0.9fr]">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted-foreground)]">Items</p>
                  <div className="mt-4 space-y-3">
                    {order.lines.map((line) => (
                      <div key={`${order.id}-${line.productId}`} className="rounded-[1.2rem] bg-[var(--surface)] px-4 py-3">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="font-semibold text-[var(--foreground)]">{line.productName}</p>
                            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                              Qty {line.quantity}
                              {line.discountPercent ? ` | ${line.discountPercent}% off` : " | Regular price"}
                            </p>
                          </div>
                          <p className="text-sm font-semibold text-[var(--foreground)]">{formatCurrency(line.quantity * line.unitPrice)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  {(order.trackingCarrier || order.trackingStatus || order.trackingNumber) ? (
                    <div className="rounded-[1.2rem] bg-[var(--surface)] p-4">
                      <div className="flex items-center gap-2 text-sm font-semibold text-[var(--foreground)]">
                        <Truck className="size-4 text-[var(--action)]" />
                        Tracking
                      </div>
                      <div className="mt-3 space-y-2 text-sm text-[var(--muted-foreground)]">
                        {order.trackingCarrier ? <p>Carrier: {order.trackingCarrier}</p> : null}
                        {order.trackingNumber ? <p>Number: {order.trackingNumber}</p> : null}
                        {order.trackingStatus ? <p>Status: {order.trackingStatus}</p> : null}
                      </div>
                    </div>
                  ) : null}

                  {order.couponCode ? (
                    <div className="rounded-[1.2rem] bg-[var(--surface)] p-4">
                      <div className="flex items-center gap-2 text-sm font-semibold text-[var(--foreground)]">
                        <Gift className="size-4 text-[var(--action)]" />
                        Coupon applied
                      </div>
                      <p className="mt-3 text-sm text-[var(--muted-foreground)]">
                        {order.couponCode}
                        {order.couponDiscount ? ` saved ${formatCurrency(order.couponDiscount)}` : ""}
                      </p>
                    </div>
                  ) : null}

                </div>
              </div>
            </details>
          ))
        ) : (
            <div className="flex min-h-[12rem] items-center justify-center text-center text-[var(--muted-foreground)]">
              No orders for this filter.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function ClientProfilePageView({ user }) {
  const store = useAppStore();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [supportNotice, setSupportNotice] = useState("");
  const [replyDrafts, setReplyDrafts] = useState({});
  const [copiedCoupon, setCopiedCoupon] = useState("");

  const userTickets = store.supportTickets.filter(
    (ticket) => ticket.messages.some((entry) => entry.authorEmail === user.email) || ticket.messages[0]?.authorEmail === user.email,
  );
  const userCoupons = store.coupons.filter(
    (coupon) => coupon.isActive && ((coupon.audience === "everyone" || coupon.audience === "all") || !coupon.userEmail || coupon.userEmail === user.email),
  );

  async function submitTicket(event) {
    event.preventDefault();
    if (subject.trim().length < 3 || message.trim().length < 3) {
      setSupportNotice("Please enter a longer subject and message.");
      return;
    }
    const result = await store.submitSupportTicket(subject.trim(), message.trim());
    if (!result.success) {
      setSupportNotice(result.message || "Unable to send support ticket.");
      return;
    }
    setSupportNotice("Support ticket sent.");
    setSubject("");
    setMessage("");
  }

  async function copyCoupon(code) {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCoupon(code);
      window.setTimeout(() => setCopiedCoupon(""), 1400);
    } catch {
      setCopiedCoupon(code);
      window.setTimeout(() => setCopiedCoupon(""), 1400);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-[1.5rem] bg-[linear-gradient(135deg,rgba(19,127,111,0.16),rgba(19,127,111,0.05))] p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-[3.75rem] w-[3.75rem] items-center justify-center rounded-full bg-[var(--surface)] text-[var(--foreground)]">
            <CircleUserRound className="size-8" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-lg font-semibold text-[var(--foreground)]">Welcome back</p>
            <p className="mt-1 truncate text-sm text-[var(--muted-foreground)]">{user.email}</p>
          </div>
          <LogoutButton iconOnly />
        </div>
      </div>

      <Card className="p-0">
        <div className="divide-y divide-[var(--border-soft)]">
          <div className="flex items-center justify-between gap-4 px-4 py-4">
            <div className="flex items-center gap-3">
              <ReceiptText className="size-5 text-[var(--action)]" />
              <span className="font-medium text-[var(--foreground)]">Total orders</span>
            </div>
            <span className="text-base font-semibold text-[var(--foreground)]">{store.orders.length}</span>
          </div>
          <div className="flex items-center gap-3 px-4 py-4">
            <Truck className="size-5 text-[var(--action)]" />
            <div>
              <p className="font-medium text-[var(--foreground)]">Delivery preferences</p>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">Standard delivery - 2 to 3 days</p>
            </div>
          </div>
        </div>
      </Card>

      <div className="rounded-[1.5rem] bg-[linear-gradient(135deg,color-mix(in_srgb,var(--action)_24%,white),color-mix(in_srgb,var(--accent-secondary)_28%,white),color-mix(in_srgb,var(--accent-tertiary)_20%,white))] p-5 text-[var(--foreground)] shadow-[var(--shadow-card)]">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl bg-white/30 p-3">
            <Ticket className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-semibold">Coupon wallet</h2>
            <p className="mt-1 text-sm text-[var(--foreground)]/78">
              {userCoupons.length ? "Tap to view, copy, and use your coupons" : "No coupons yet. New offers will appear here."}
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {userCoupons.length ? (
            userCoupons.slice(0, 3).map((coupon) => (
              <button
                key={coupon.id}
                type="button"
                onClick={() => copyCoupon(coupon.code)}
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/12 px-3 py-2 text-sm font-semibold"
              >
                <span>
                  {coupon.code} {coupon.type === "percent" ? `${coupon.value}% OFF` : `${formatCurrency(coupon.value)} OFF`}
                </span>
                <Copy className="size-4" />
              </button>
            ))
          ) : (
            <div className="w-full rounded-2xl border border-white/15 bg-white/10 px-4 py-4 text-sm text-[var(--foreground)]/84">
              When the store publishes a promo or assigns a coupon to your account, you will see it here.
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between gap-4 text-sm">
          <span className="text-[var(--foreground)]/78">{userCoupons.length ? `${userCoupons.length} available` : "Waiting for offers"}</span>
          <span className="font-semibold">{copiedCoupon ? `${copiedCoupon} copied` : userCoupons.length ? "Open wallet" : "Check offers"}</span>
        </div>
      </div>

      {userTickets.length ? (
        <div className="rounded-[1.5rem] bg-[linear-gradient(135deg,color-mix(in_srgb,var(--surface)_90%,white),color-mix(in_srgb,var(--surface-quiet)_88%,var(--accent-secondary)),color-mix(in_srgb,var(--surface)_92%,var(--action)))] p-4 shadow-[var(--shadow-card)]">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Your support tickets</h2>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">Track replies and ticket status from the support team.</p>
          <div className="mt-4 space-y-3">
            {userTickets.map((ticket) => (
              <div key={ticket.id} className="rounded-[1.4rem] border border-white/45 bg-white/55 p-4 backdrop-blur-xl">
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="text-lg font-semibold text-[var(--foreground)]">{ticket.subject}</h3>
                  <span className={cn("rounded-full px-3 py-1 text-xs font-semibold uppercase", statusClasses(ticket.status))}>
                    {ticket.status}
                  </span>
                </div>
                <div className="mt-3 space-y-3">
                  {ticket.messages.map((entry) => (
                    <div key={entry.id} className="rounded-2xl bg-[var(--surface)] px-4 py-3 text-sm">
                      <p className="font-semibold text-[var(--foreground)]">{entry.authorRole === "ADMIN" ? "Admin" : entry.authorEmail}</p>
                      <p className="mt-1 leading-7 text-[var(--muted-foreground)]">{entry.message}</p>
                    </div>
                  ))}
                </div>
                {ticket.status !== "closed" ? (
                  <div className="mt-4 flex flex-col gap-3 md:flex-row">
                    <input
                      value={replyDrafts[ticket.id] || ""}
                      onChange={(event) => setReplyDrafts((current) => ({ ...current, [ticket.id]: event.target.value }))}
                      placeholder="Reply to this ticket"
                      className="app-input flex-1 px-4 py-3 text-sm"
                    />
                    <Button
                      onClick={() => {
                        const next = (replyDrafts[ticket.id] || "").trim();
                        if (!next) {
                          return;
                        }
                        store.replySupport(ticket.id, next, user.email, "CLIENT");
                        setReplyDrafts((current) => ({ ...current, [ticket.id]: "" }));
                      }}
                    >
                      Reply
                    </Button>
                    <Button variant="secondary" onClick={() => store.closeSupport(ticket.id)}>
                      Close ticket
                    </Button>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <Card>
        <div className="flex items-center gap-3">
          <MessageCircle className="size-5 text-[var(--action)]" />
          <h2 className="text-xl font-semibold text-[var(--foreground)]">Support team</h2>
        </div>
        <form onSubmit={submitTicket} className="mt-5 space-y-4">
          <input value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="Subject" className="app-input w-full px-4 py-3 text-sm" />
          <textarea value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Describe your issue" className="app-input min-h-28 w-full px-4 py-3 text-sm" />
          <p className="text-xs leading-6 text-[var(--muted-foreground)]">
            Only signed-in users can create tickets. Replies will appear above in your ticket history.
          </p>
          {supportNotice ? <div className="rounded-2xl bg-[var(--surface-quiet)] px-4 py-3 text-sm">{supportNotice}</div> : null}
          <Button type="submit">Contact support</Button>
        </form>
      </Card>
    </div>
  );
}

export function ClientProductDetailPageView({ productId, user }) {
  const store = useAppStore();
  const [comment, setComment] = useState("");
  const [editingId, setEditingId] = useState("");
  const [editingMessage, setEditingMessage] = useState("");
  const product = store.getProduct(productId);

  if (!product) {
    return (
      <Card>
        <p className="text-sm text-[var(--muted-foreground)]">Product not found.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4 pb-28">
      <div className="overflow-hidden rounded-[1.75rem] border border-white/45 bg-white/60 shadow-[0_20px_45px_rgba(10,24,35,0.08)] backdrop-blur-xl">
        <div className="min-h-80 bg-cover bg-center" style={{ backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0.06), rgba(0,0,0,0.48)), url(${product.image})` }} />
      </div>

      <Card>
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            <span className="app-chip px-3 py-1.5 text-sm" data-active="true">{product.category}</span>
            <span className="app-chip px-3 py-1.5 text-sm" data-active="true">
              {product.stock > 0 ? `${product.stock} available` : "Out of stock"}
            </span>
            <span className="app-chip px-3 py-1.5 text-sm" data-active="true">
              {product.rating.toFixed(1)} * ({product.ratingCount})
            </span>
          </div>
          <button
            type="button"
            onClick={() => store.toggleFavorite(product.id)}
            className={cn(
              "rounded-full p-3",
              store.isFavorite(product.id) ? "bg-rose-100 text-rose-600" : "bg-[var(--surface)] text-[var(--muted-foreground)]",
            )}
          >
            <Heart className={cn("size-5", store.isFavorite(product.id) && "fill-current")} />
          </button>
        </div>

        <h1 className="mt-4 text-3xl font-semibold text-[var(--foreground)]">{product.name}</h1>
        <p className="mt-3 text-3xl font-bold text-[var(--foreground)]">
          {formatCurrency(product.price * (1 - product.discountPercent / 100))}
        </p>
        {product.discountPercent ? <p className="mt-1 text-sm font-semibold text-green-700">{product.discountPercent}% off</p> : null}

        <p className="mt-5 text-base leading-8 text-[var(--muted-foreground)]">{product.description}</p>

        <div className="mt-6 rounded-[1.4rem] bg-[linear-gradient(135deg,color-mix(in_srgb,var(--action)_18%,white),color-mix(in_srgb,var(--accent-secondary)_25%,white))] p-4">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-white/35 p-3 text-[var(--foreground)]">
              <Truck className="size-5" />
            </div>
            <div>
              <p className="font-semibold text-[var(--foreground)]">Free delivery over $50</p>
              <p className="mt-1 text-sm leading-6 text-[var(--foreground)]/82">
                Same-day pickup available for essentials and fresh items.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Rate this product</h2>
          <div className="mt-2 flex">
            {Array.from({ length: 5 }, (_, index) => index + 1).map((ratingValue) => (
              <button
                key={ratingValue}
                type="button"
                onClick={() => {
                  if (!user?.email) {
                    return;
                  }
                  store.submitRating?.(product.id, ratingValue);
                }}
                className="rounded-full p-1"
                aria-label={`Rate ${ratingValue} stars`}
              >
                <Star className={cn("size-6", product.rating >= ratingValue ? "fill-amber-400 text-amber-400" : "text-amber-400")} />
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6">
          <div className="flex items-center gap-3">
            <MessageCircle className="size-5 text-[var(--action)]" />
            <h2 className="text-xl font-semibold text-[var(--foreground)]">Customer comments</h2>
          </div>
          <div className="mt-4 space-y-3">
            {(product.comments || []).length ? (
              product.comments.map((entry) => {
                const canEdit = Boolean(user?.email) && (user.role === "ADMIN" || user.email === entry.userEmail);
                const isEditing = editingId === entry.id;

                return (
                  <div key={entry.id} className="rounded-[1.2rem] bg-[var(--surface)] px-4 py-4 text-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-[var(--foreground)]">{entry.userEmail}</p>
                        <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                          {entry.isEdited ? `Edited | ${formatDate(entry.updatedAt || entry.createdAt)}` : formatDate(entry.createdAt)}
                        </p>
                      </div>
                      {canEdit ? (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingId(entry.id);
                              setEditingMessage(entry.message);
                            }}
                            className="app-icon-button p-2"
                            aria-label="Edit comment"
                          >
                            <Edit3 className="size-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => store.deleteComment?.(product.id, entry.id)}
                            className="app-icon-button p-2"
                            aria-label="Delete comment"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      ) : null}
                    </div>
                    {isEditing ? (
                      <div className="mt-3 space-y-3">
                        <textarea value={editingMessage} onChange={(event) => setEditingMessage(event.target.value)} className="app-input min-h-24 w-full px-4 py-3 text-sm" />
                        <div className="flex gap-2">
                          <Button
                            onClick={() => {
                              if (editingMessage.trim().length < 3) {
                                return;
                              }
                              store.updateComment?.(product.id, entry.id, editingMessage.trim());
                              setEditingId("");
                              setEditingMessage("");
                            }}
                          >
                            Save
                          </Button>
                          <Button variant="secondary" onClick={() => {
                            setEditingId("");
                            setEditingMessage("");
                          }}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-3 leading-7 text-[var(--muted-foreground)]">{entry.message}</p>
                    )}
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-[var(--muted-foreground)]">No comments yet. Be the first to comment.</p>
            )}
          </div>

          {!user?.email ? (
            <div className="mt-4">
              <Link href="/?auth=login" className="inline-flex items-center justify-center rounded-xl border border-[var(--border-soft)] bg-[var(--surface)] px-4 py-3 text-sm font-semibold text-[var(--foreground)]">
                Login to comment
              </Link>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              <textarea value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Write a comment" className="app-input min-h-24 w-full px-4 py-3 text-sm" />
              <div className="flex justify-end">
                <Button
                  onClick={() => {
                    if (comment.trim().length < 3) {
                      return;
                    }
                    store.addComment(product.id, comment.trim());
                    setComment("");
                  }}
                >
                  Post comment
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>

      <div className="sticky bottom-4 rounded-[1.5rem] border border-[var(--border-soft)] bg-[linear-gradient(135deg,var(--surface-quiet),var(--surface),color-mix(in_srgb,var(--action)_12%,var(--surface)))] px-4 py-4 shadow-[0_-4px_16px_rgba(15,24,35,0.06)]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-[var(--muted-foreground)]">Total</p>
            <p className="mt-1 text-2xl font-bold text-[var(--foreground)]">
              {formatCurrency(product.price * (1 - product.discountPercent / 100))}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {store.cartQuantityFor(product.id) ? (
              <span className="text-sm font-medium text-[var(--muted-foreground)]">{store.cartQuantityFor(product.id)} in cart</span>
            ) : null}
            <Button onClick={() => store.addToCart(product.id)} disabled={product.stock <= 0}>
              {product.stock > 0 ? "Add to cart" : "Out of stock"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
