"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Eye,
  EyeOff,
  Heart,
  Search,
  ShieldCheck,
  ShoppingCart,
  Star,
  User,
} from "lucide-react";

import { EntranceMotion } from "@/components/motion/entrance-motion";
import { HoverLift } from "@/components/motion/hover-lift";
import { easeInOutCubic } from "@/components/motion/motion-utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAppStore } from "@/components/app-store-provider";
import { Button } from "@/components/ui/button";
import { cn, formatCurrency } from "@/lib/utils";

function SurfaceCard({ children, className = "" }) {
  return (
    <div
      className={cn(
        "app-card p-6",
        className,
      )}
    >
      {children}
    </div>
  );
}

function PublicProductCard({ product, onRequireLogin }) {
  return (
    <HoverLift hoverOffset={8} hoverScale={1.002} hoverElevation={18} normalElevation={6}>
      <article
        className="app-card overflow-hidden"
        onClick={() => onRequireLogin("Login to view product details.")}
      >
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
              onClick={(event) => {
                event.stopPropagation();
                onRequireLogin("Login to save favorites.");
              }}
              className="inline-flex size-9 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm"
              aria-label="Favorite"
            >
              <Heart className="size-4" />
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
          <div className="mt-4">
            <Button
              className="w-full"
              onClick={(event) => {
                event.stopPropagation();
                onRequireLogin("Login to add items to cart.");
              }}
            >
              {product.stock > 0 ? "Add to cart" : "Out of stock"}
            </Button>
          </div>
        </div>
      </article>
    </HoverLift>
  );
}

function AuthNotice({ children, tone = "neutral" }) {
  const toneClasses =
    tone === "error"
      ? "border-red-200 bg-red-50 text-red-700"
      : "border-[var(--border-soft)] bg-[var(--surface-quiet)] text-[var(--foreground)]";

  return <div className={cn("rounded-2xl border px-4 py-3 text-sm", toneClasses)}>{children}</div>;
}

function ClientLoginForm({ onSubmit, onSwitchToRegister, loading }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [hidePassword, setHidePassword] = useState(true);
  const [error, setError] = useState("");

  function validate() {
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !trimmedEmail.includes("@")) {
      setError("Enter a valid email");
      return null;
    }
    if (password.length < 4) {
      setError("Password must be at least 4 characters");
      return null;
    }
    setError("");
    return { email: trimmedEmail, password };
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const values = validate();
    if (!values) {
      return;
    }
    const nextError = await onSubmit(values.email, values.password);
    if (nextError) {
      setError(nextError);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <h2 className="text-3xl font-semibold text-[var(--foreground)]">Welcome back</h2>
        <p className="mt-3 text-sm leading-7 text-[var(--muted-foreground)]">Sign in to continue shopping.</p>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-[var(--foreground)]">Email</label>
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="app-input px-4 py-3"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-[var(--foreground)]">Password</label>
        <div className="relative">
          <input
            type={hidePassword ? "password" : "text"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="app-input px-4 py-3 pr-12"
          />
          <button
            type="button"
            onClick={() => setHidePassword((current) => !current)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]"
            aria-label="Toggle password visibility"
          >
            {hidePassword ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
          </button>
        </div>
      </div>

      {error ? <AuthNotice tone="error">{error}</AuthNotice> : null}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Please wait..." : "Login"}
      </Button>

      <button type="button" onClick={onSwitchToRegister} className="text-sm font-medium text-[var(--foreground)]">
        Create account
      </button>
    </form>
  );
}

function RegisterForm({ onSubmit, onSwitchToLogin, loading }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [hidePassword, setHidePassword] = useState(true);
  const [hideConfirmPassword, setHideConfirmPassword] = useState(true);
  const [error, setError] = useState("");

  function validate() {
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !trimmedEmail.includes("@")) {
      setError("Enter a valid email");
      return null;
    }
    if (password.length < 4) {
      setError("Password must be at least 4 characters");
      return null;
    }
    if (confirmPassword !== password) {
      setError("Passwords do not match");
      return null;
    }
    setError("");
    return { email: trimmedEmail, password };
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const values = validate();
    if (!values) {
      return;
    }
    const nextError = await onSubmit(values.email, values.password);
    if (nextError) {
      setError(nextError);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <h2 className="text-3xl font-semibold text-[var(--foreground)]">Create account</h2>
        <p className="mt-3 text-sm leading-7 text-[var(--muted-foreground)]">Register to start ordering.</p>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-[var(--foreground)]">Email</label>
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="app-input px-4 py-3"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-[var(--foreground)]">Password</label>
        <div className="relative">
          <input
            type={hidePassword ? "password" : "text"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="app-input px-4 py-3 pr-12"
          />
          <button
            type="button"
            onClick={() => setHidePassword((current) => !current)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]"
            aria-label="Toggle password visibility"
          >
            {hidePassword ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
          </button>
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-[var(--foreground)]">Confirm password</label>
        <div className="relative">
          <input
            type={hideConfirmPassword ? "password" : "text"}
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            className="app-input px-4 py-3 pr-12"
          />
          <button
            type="button"
            onClick={() => setHideConfirmPassword((current) => !current)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]"
            aria-label="Toggle confirm password visibility"
          >
            {hideConfirmPassword ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
          </button>
        </div>
      </div>

      {error ? <AuthNotice tone="error">{error}</AuthNotice> : null}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Please wait..." : "Register"}
      </Button>

      <button type="button" onClick={onSwitchToLogin} className="text-sm font-medium text-[var(--foreground)]">
        Back to login
      </button>
    </form>
  );
}

function AdminLoginForm({ onSubmit, loading }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    if (!email.trim()) {
      setError("Enter admin email");
      return;
    }
    if (!password) {
      setError("Enter password");
      return;
    }

    setError("");
    const nextError = await onSubmit(email.trim(), password);
    if (nextError) {
      setError(nextError);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <h2 className="text-3xl font-semibold text-[var(--foreground)]">Admin login</h2>
        <p className="mt-3 text-sm leading-7 text-[var(--muted-foreground)]">Manage product inventory, restocking, orders, and sales.</p>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-[var(--foreground)]">Admin email</label>
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="app-input px-4 py-3"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-[var(--foreground)]">Password</label>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="app-input px-4 py-3"
        />
      </div>

      {error ? <AuthNotice tone="error">{error}</AuthNotice> : null}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Please wait..." : "Login as admin"}
      </Button>
    </form>
  );
}

export function PublicAuthGate() {
  const store = useAppStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sort, setSort] = useState("Featured");
  const [showRegister, setShowRegister] = useState(false);
  const [roleTab, setRoleTab] = useState("client");
  const [showPublicShop, setShowPublicShop] = useState(true);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");

  const categories = useMemo(() => ["All", ...new Set(store.activeProducts.map((product) => product.category))], [store.activeProducts]);

  const products = useMemo(() => {
    const lower = query.trim().toLowerCase();
    const filtered = store.activeProducts.filter((product) => {
      if (selectedCategory !== "All" && product.category !== selectedCategory) {
        return false;
      }
      if (!lower) {
        return true;
      }
      return [product.name, product.description, product.category].some((value) => value.toLowerCase().includes(lower));
    });

    switch (sort) {
      case "Price: Low to High":
        return filtered.sort((a, b) => a.price * (1 - a.discountPercent / 100) - b.price * (1 - b.discountPercent / 100));
      case "Price: High to Low":
        return filtered.sort((a, b) => b.price * (1 - b.discountPercent / 100) - a.price * (1 - a.discountPercent / 100));
      case "Stock":
        return filtered.sort((a, b) => b.stock - a.stock);
      case "Name":
        return filtered.sort((a, b) => a.name.localeCompare(b.name));
      default:
        return filtered.sort((a, b) => b.rating - a.rating);
    }
  }, [store.activeProducts, query, selectedCategory, sort]);

  useEffect(() => {
    const authView = searchParams.get("auth");

    if (authView === "admin") {
      setRoleTab("admin");
      setShowRegister(false);
      setShowPublicShop(false);
      return;
    }

    if (authView === "register") {
      setRoleTab("client");
      setShowRegister(true);
      setShowPublicShop(false);
      return;
    }

    if (authView === "login") {
      setRoleTab("client");
      setShowRegister(false);
      setShowPublicShop(false);
      return;
    }

    setRoleTab("client");
    setShowRegister(false);
    setShowPublicShop(true);
  }, [searchParams]);

  function syncAuthView(view) {
    router.replace(view ? `/?auth=${view}` : "/");
  }

  function openClientLogin(nextNotice = "") {
    setRoleTab("client");
    setShowRegister(false);
    setShowPublicShop(false);
    setNotice(nextNotice);
    syncAuthView("login");
  }

  async function submitAuth(endpoint, payload, redirectTo) {
    setLoading(true);
    setNotice("");

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        return data.error || "Unable to continue.";
      }

      router.push(redirectTo);
      router.refresh();
      return "";
    } catch {
      return "Unable to continue.";
    } finally {
      setLoading(false);
      }
    }

  const showingPublicShop = roleTab === "client" && showPublicShop;
  const authKey = roleTab === "admin" ? "admin-login" : showRegister ? "register" : "login";
  const viewKey = showingPublicShop ? "public-shop" : authKey;

  return (
    <main className="app-shell">
      <AnimatePresence mode="wait">
        <motion.div
          key={viewKey}
          initial={{ opacity: 0, x: -14, scale: 0.98 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 12, scale: 0.98 }}
          transition={{ duration: 0.48, ease: easeInOutCubic }}
        >
          {showingPublicShop ? (
            <>
              <header className="app-bar px-5 py-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <h1 className="text-2xl font-semibold text-[var(--foreground)]">Shop</h1>
                  <div className="flex flex-wrap items-center gap-2">
                    <ThemeToggle />
                    <button type="button" onClick={() => openClientLogin("")} className="app-link-button">
                      Login
                    </button>
                  </div>
                </div>
              </header>

              <section className="mt-6 space-y-6">
                <EntranceMotion delay={0.08}>
                  <div className="app-card-inset px-5 py-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-sm leading-7 text-[var(--foreground)]">Browse products freely. Login to add items and checkout.</p>
                      <button
                        type="button"
                        onClick={() => {
                          setRoleTab("client");
                          setShowRegister(true);
                          setShowPublicShop(false);
                          setNotice("");
                          syncAuthView("register");
                        }}
                        className="app-link-button"
                      >
                        Create account
                      </button>
                    </div>
                  </div>
                </EntranceMotion>

                {notice ? <AuthNotice>{notice}</AuthNotice> : null}

                <EntranceMotion delay={0.16}>
                  <div className="space-y-3">
                    <div className="app-search-shell p-1.5">
                      <label className="flex items-center gap-3 rounded-[1.125rem] px-4 py-3">
                        <Search className="size-4 text-[var(--muted-foreground)]" />
                        <input
                          value={query}
                          onChange={(event) => setQuery(event.target.value)}
                          placeholder="Search products, categories, deals"
                          className="w-full bg-transparent text-sm outline-none"
                        />
                      </label>
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex flex-wrap gap-2">
                        {categories.map((category) => (
                          <button
                            key={category}
                            type="button"
                            onClick={() => setSelectedCategory(category)}
                            className="app-chip px-4 py-2 text-sm"
                            data-active={selectedCategory === category}
                          >
                            {category}
                          </button>
                        ))}
                      </div>
                      <select
                        value={sort}
                        onChange={(event) => setSort(event.target.value)}
                        className="app-select max-w-[15rem] px-4 py-3 text-sm"
                      >
                        <option>Featured</option>
                        <option>Price: Low to High</option>
                        <option>Price: High to Low</option>
                        <option>Stock</option>
                        <option>Name</option>
                      </select>
                    </div>
                  </div>
                </EntranceMotion>

                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                  {products.map((product, index) => (
                    <EntranceMotion key={product.id} delay={0.24 + index * 0.04}>
                      <PublicProductCard product={product} onRequireLogin={openClientLogin} />
                    </EntranceMotion>
                  ))}
                </div>
              </section>
            </>
          ) : (
            <section className="flex min-h-[70vh] items-center justify-center">
              <div className="w-full max-w-md">
                <EntranceMotion delay={0.08}>
                  <SurfaceCard>
                    <div className="mb-4 flex justify-end">
                      <ThemeToggle />
                    </div>

                    <div className="app-card-inset mb-4 grid grid-cols-2 gap-2 p-1">
                      <button
                        type="button"
                        onClick={() => {
                          setRoleTab("client");
                          setShowRegister(false);
                          setShowPublicShop(true);
                          setNotice("");
                          syncAuthView("");
                        }}
                        className={cn(
                          "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition",
                          roleTab === "client"
                            ? "bg-[var(--surface)] text-[var(--foreground)] shadow-[var(--shadow-soft)]"
                            : "text-[var(--muted-foreground)]",
                        )}
                      >
                        <User className="size-4" />
                        Client
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setRoleTab("admin");
                          setShowRegister(false);
                          setShowPublicShop(false);
                          setNotice("");
                          syncAuthView("admin");
                        }}
                        className={cn(
                          "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition",
                          roleTab === "admin"
                            ? "bg-[var(--surface)] text-[var(--foreground)] shadow-[var(--shadow-soft)]"
                            : "text-[var(--muted-foreground)]",
                        )}
                      >
                        <ShieldCheck className="size-4" />
                        Admin
                      </button>
                    </div>

                    {loading ? <div className="mb-4 h-1 w-full overflow-hidden rounded-full bg-[var(--surface-quiet)]"><div className="h-full w-1/2 animate-pulse rounded-full bg-[var(--action)]" /></div> : null}
                    {notice ? <div className="mb-4"><AuthNotice>{notice}</AuthNotice></div> : null}

                    <AnimatePresence mode="wait" initial={false}>
                      <motion.div
                        key={authKey}
                        initial={{ opacity: 0, x: -12, scale: 0.96 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 10, scale: 0.97 }}
                        transition={{ duration: 0.42, ease: easeInOutCubic }}
                      >
                        {roleTab === "admin" ? (
                          <AdminLoginForm
                            loading={loading}
                            onSubmit={(email, password) =>
                              submitAuth("/api/auth/login", { email, password, roleHint: "admin" }, "/admin")
                            }
                          />
                        ) : showRegister ? (
                          <RegisterForm
                            loading={loading}
                            onSwitchToLogin={() => {
                              setShowRegister(false);
                              syncAuthView("login");
                            }}
                            onSubmit={(email, password) =>
                              submitAuth("/api/auth/register", { email, password, roleHint: "client" }, "/client")
                            }
                          />
                        ) : (
                          <ClientLoginForm
                            loading={loading}
                            onSwitchToRegister={() => {
                              setShowRegister(true);
                              syncAuthView("register");
                            }}
                            onSubmit={(email, password) =>
                              submitAuth("/api/auth/login", { email, password, roleHint: "client" }, "/client")
                            }
                          />
                        )}
                      </motion.div>
                    </AnimatePresence>

                    {roleTab === "client" ? (
                      <button
                        type="button"
                        onClick={() => {
                          setShowPublicShop(true);
                          setNotice("");
                          syncAuthView("");
                        }}
                        className="mt-4 text-sm font-medium text-[var(--foreground)]"
                      >
                        Browse products without login
                      </button>
                    ) : null}
                  </SurfaceCard>
                </EntranceMotion>
              </div>
            </section>
          )}
        </motion.div>
      </AnimatePresence>
    </main>
  );
}
