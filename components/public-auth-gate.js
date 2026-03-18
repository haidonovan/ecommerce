"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Check,
  Eye,
  EyeOff,
  Heart,
  Search,
  ShieldCheck,
  User,
} from "lucide-react";

import { EntranceMotion } from "@/components/motion/entrance-motion";
import { HoverLift } from "@/components/motion/hover-lift";
import { easeInOutCubic } from "@/components/motion/motion-utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAppStore } from "@/components/app-store-provider";
import { Button } from "@/components/ui/button";
import { cn, formatCurrency } from "@/lib/utils";

function getDiscountedPrice(product) {
  return product.price * (1 - product.discountPercent / 100);
}

const PUBLIC_DESKTOP_COLUMNS = 3;
const PUBLIC_DEFAULT_ROWS = 3;
const PUBLIC_SHOW_MORE_ROWS = 3;
const PUBLIC_INITIAL_VISIBLE_PRODUCTS = PUBLIC_DESKTOP_COLUMNS * PUBLIC_DEFAULT_ROWS;
const PUBLIC_SHOW_MORE_INCREMENT = PUBLIC_DESKTOP_COLUMNS * PUBLIC_SHOW_MORE_ROWS;
const PUBLIC_REVEAL_DURATION_MS = 900;
const PUBLIC_SORT_OPTIONS = [
  "Featured",
  "Price: Low to High",
  "Price: High to Low",
  "Stock",
  "Name",
  "Biggest discount",
];
const PUBLIC_PRICE_OPTIONS = [
  { value: "all", label: "All" },
  { value: "under-15", label: "Under $15" },
  { value: "15-30", label: "$15-$30" },
  { value: "30-plus", label: "$30+" },
];
const PUBLIC_QUICK_FILTER_OPTIONS = [
  { id: "inStock", label: "In stock" },
  { id: "onSale", label: "On sale" },
  { id: "topRated", label: "Rating 4.7+" },
  { id: "bulkBuy", label: "Stock 20+" },
];
const INITIAL_PUBLIC_QUICK_FILTERS = {
  inStock: false,
  onSale: false,
  topRated: false,
  bulkBuy: false,
};

function SurfaceCard({ children, className = "" }) {
  return (
    <div
      className={cn(
        "app-card p-4 sm:p-6",
        className,
      )}
    >
      {children}
    </div>
  );
}

function PublicHeroCard({ product, onRequireLogin }) {
  return (
    <HoverLift hoverOffset={6} hoverScale={1.003} hoverElevation={12} normalElevation={0}>
      <article
        className="min-w-[17.75rem] snap-start sm:min-w-[19.5rem] lg:min-w-[21rem]"
      >
        <button
          type="button"
          onClick={() => onRequireLogin("Login to view product details.")}
          className="group block w-full text-left"
        >
          <div className="relative h-[13.5rem] overflow-hidden rounded-[1.55rem] bg-[#d8dcdf] sm:h-[14.5rem]">
            <div
              className="absolute inset-0 bg-cover bg-center transition duration-500 group-hover:scale-[1.025]"
              style={{ backgroundImage: `url(${product.image})` }}
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.3),rgba(255,255,255,0.05)_38%,rgba(0,0,0,0.66))]" />
            <div className="absolute inset-x-0 bottom-0 p-4.5 sm:p-5">
              <div>
                <p className="text-xs text-white/72">{product.category}</p>
                <h3 className="mt-2 max-w-[11rem] text-[1.68rem] font-bold leading-[1.03] text-white sm:max-w-[12rem] sm:text-[1.8rem]">{product.name}</h3>
                <p className="mt-2 line-clamp-2 max-w-[13rem] text-[0.76rem] leading-5 text-white/72">{product.description}</p>
              </div>
              <div className="mt-4 inline-flex items-center rounded-[0.9rem] border border-white/12 bg-white/16 px-3 py-1.5 text-sm font-semibold text-white backdrop-blur-sm">
                {formatCurrency(getDiscountedPrice(product))}
              </div>
            </div>
          </div>
        </button>
      </article>
    </HoverLift>
  );
}

function PublicProductCard({ product, onRequireLogin }) {
  const discountedPrice = getDiscountedPrice(product);
  const hasDiscount = product.discountPercent > 0 && discountedPrice < product.price;

  return (
    <HoverLift hoverOffset={5} hoverScale={1.006} hoverElevation={20} normalElevation={8}>
      <article className="public-home-product-card flex h-full flex-col overflow-hidden rounded-[1.45rem] shadow-[0_16px_38px_rgba(3,10,18,0.22)]">
        <div
          role="button"
          tabIndex={0}
          onClick={() => onRequireLogin("Login to view product details.")}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              onRequireLogin("Login to view product details.");
            }
          }}
          className="block w-full cursor-pointer text-left"
          aria-label={`Open ${product.name}`}
        >
          <div className="relative aspect-[1/0.92] overflow-hidden bg-[#d7dadd]">
            <div
              className="absolute inset-0 bg-cover bg-center transition duration-500 hover:scale-[1.03]"
              style={{ backgroundImage: `url(${product.image})` }}
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.16),rgba(0,0,0,0.52))]" />
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onRequireLogin("Login to save favorites.");
              }}
              className="absolute bottom-3 right-3 inline-flex size-9 items-center justify-center rounded-full border border-white/16 bg-black/26 text-white backdrop-blur-sm"
              aria-label="Favorite"
            >
              <Heart className="size-4" />
            </button>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-2.5 px-3.5 pb-3.5 pt-3">
          <div>
            <h3
              className="overflow-hidden text-ellipsis whitespace-nowrap text-[0.98rem] font-semibold leading-5 text-[var(--public-home-product-foreground)]"
              title={product.name}
            >
              {product.name}
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
            {hasDiscount ? (
              <span className="public-home-product-muted text-[0.88rem] line-through">
                {formatCurrency(product.price)}
              </span>
            ) : null}
            <span className="font-semibold text-[var(--public-home-product-foreground)]">
              {formatCurrency(discountedPrice)}
            </span>
            {hasDiscount ? <span className="text-emerald-400">{product.discountPercent}% off</span> : null}
          </div>

          <p className={cn("text-xs font-medium", product.stock <= 5 ? "text-red-400" : "text-emerald-400")}>
            {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
          </p>

          <Button
            className="mt-auto w-full rounded-[0.95rem] border border-[color-mix(in_srgb,var(--action)_36%,transparent)] bg-[var(--action)] py-2.5 text-[var(--action-foreground)] shadow-none hover:brightness-[1.01]"
            onClick={() => onRequireLogin("Login to add items to cart.")}
          >
            {product.stock > 0 ? "Add to cart" : "Out of stock"}
          </Button>
        </div>
      </article>
    </HoverLift>
  );
}

function PublicHeroCarousel({ products, onRequireLogin, reverse = false }) {
  const USER_PAUSE_MS = 1000;
  const REPEAT_COUNT = 5;
  const BASE_CYCLE_INDEX = Math.floor(REPEAT_COUNT / 2);
  const scrollRef = useRef(null);
  const animationRef = useRef(null);
  const lastTimeRef = useRef(0);
  const interactionUntilRef = useRef(0);
  const pointerActiveRef = useRef(false);
  const currentVelocityRef = useRef(0);
  const targetVelocityRef = useRef(0);
  const shouldAutoScroll = products.length > 1;
  const visibleProducts = products.slice(0, 5);
  const productIdsKey = visibleProducts.map((product) => product.id).join("|");
  const productKey = visibleProducts.map((product) => product.id).join("|");

  useEffect(() => {
    const scrollNode = scrollRef.current;

    if (!scrollNode) {
      return undefined;
    }

    lastTimeRef.current = 0;
    interactionUntilRef.current = 0;
    pointerActiveRef.current = false;
    currentVelocityRef.current = 0;
    targetVelocityRef.current = 0;

    if (!shouldAutoScroll || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return undefined;
    }

    const cycleWidth = scrollNode.scrollWidth / REPEAT_COUNT;
    if (!cycleWidth) {
      return undefined;
    }

    scrollNode.scrollLeft = cycleWidth * BASE_CYCLE_INDEX;

    const step = (now) => {
      if (!scrollNode) {
        return;
      }

      if (lastTimeRef.current === 0) {
        lastTimeRef.current = now;
      }

      const delta = now - lastTimeRef.current;
      lastTimeRef.current = now;

      const baseSpeed = window.innerWidth < 640 ? 0.04 : 0.05;
      const directionalSpeed = reverse ? -baseSpeed : baseSpeed;

      if (!pointerActiveRef.current && now >= interactionUntilRef.current) {
        targetVelocityRef.current = directionalSpeed;
      } else {
        targetVelocityRef.current = 0;
      }

      const easing = pointerActiveRef.current ? 0.12 : 0.045;
      currentVelocityRef.current += (targetVelocityRef.current - currentVelocityRef.current) * easing;

      if (Math.abs(currentVelocityRef.current) < 0.0006) {
        currentVelocityRef.current = 0;
      }

      if (currentVelocityRef.current !== 0) {
        scrollNode.scrollLeft += delta * currentVelocityRef.current;
      }

      while (scrollNode.scrollLeft <= cycleWidth * (BASE_CYCLE_INDEX - 0.5)) {
        scrollNode.scrollLeft += cycleWidth;
      }

      while (scrollNode.scrollLeft >= cycleWidth * (BASE_CYCLE_INDEX + 0.5)) {
        scrollNode.scrollLeft -= cycleWidth;
      }

      animationRef.current = window.requestAnimationFrame(step);
    };

    animationRef.current = window.requestAnimationFrame(step);

    return () => {
      if (animationRef.current) {
        window.cancelAnimationFrame(animationRef.current);
      }
    };
  }, [BASE_CYCLE_INDEX, REPEAT_COUNT, productIdsKey, reverse, shouldAutoScroll]);

  if (!shouldAutoScroll) {
    return (
      <div className="overflow-hidden pb-1">
        <div className="flex gap-4">
          {visibleProducts.map((product) => (
            <PublicHeroCard key={`${product.id}-single`} product={product} onRequireLogin={onRequireLogin} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className="overflow-hidden pb-1"
      onPointerDown={() => {
        pointerActiveRef.current = true;
        interactionUntilRef.current = performance.now() + USER_PAUSE_MS;
        targetVelocityRef.current = 0;
      }}
      onPointerUp={() => {
        pointerActiveRef.current = false;
        interactionUntilRef.current = performance.now() + USER_PAUSE_MS;
      }}
      onPointerCancel={() => {
        pointerActiveRef.current = false;
        interactionUntilRef.current = performance.now() + USER_PAUSE_MS;
      }}
      onWheel={() => {
        interactionUntilRef.current = performance.now() + USER_PAUSE_MS;
        targetVelocityRef.current = 0;
      }}
    >
      <div
        ref={scrollRef}
        className="flex gap-0 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {Array.from({ length: REPEAT_COUNT }, (_, cycleIndex) => (
          <div
            key={`cycle-${cycleIndex}`}
            aria-hidden={cycleIndex !== BASE_CYCLE_INDEX}
            className={cn("flex shrink-0 gap-4", cycleIndex !== REPEAT_COUNT - 1 && "pr-4")}
          >
            {visibleProducts.map((product) => (
              <PublicHeroCard
                key={`${product.id}-cycle-${cycleIndex}`}
                product={product}
                onRequireLogin={onRequireLogin}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
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
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [categorySearch, setCategorySearch] = useState("");
  const [sort, setSort] = useState("Featured");
  const [priceFilter, setPriceFilter] = useState("all");
  const [quickFilters, setQuickFilters] = useState(INITIAL_PUBLIC_QUICK_FILTERS);
  const [showRegister, setShowRegister] = useState(false);
  const [roleTab, setRoleTab] = useState("client");
  const [showPublicShop, setShowPublicShop] = useState(true);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [visibleGridCounts, setVisibleGridCounts] = useState({});
  const [revealState, setRevealState] = useState(null);

  const categories = useMemo(() => [...new Set(store.activeProducts.map((product) => product.category))], [store.activeProducts]);
  const categoryChips = useMemo(() => ["All", ...categories], [categories]);
  const visibleCategoryOptions = useMemo(() => {
    const lower = categorySearch.trim().toLowerCase();
    if (!lower) {
      return categories;
    }
    return categories.filter((category) => category.toLowerCase().includes(lower));
  }, [categories, categorySearch]);

  const products = useMemo(() => {
    const lower = query.trim().toLowerCase();
    const filtered = store.activeProducts.filter((product) => {
      const discountedPrice = getDiscountedPrice(product);

      if (selectedCategories.length > 0 && !selectedCategories.includes(product.category)) {
        return false;
      }
      if (lower && ![product.name, product.description, product.category].some((value) => value.toLowerCase().includes(lower))) {
        return false;
      }

      if (quickFilters.inStock && product.stock <= 0) {
        return false;
      }
      if (quickFilters.onSale && product.discountPercent <= 0) {
        return false;
      }
      if (quickFilters.topRated && (product.rating || 0) < 4.7) {
        return false;
      }
      if (quickFilters.bulkBuy && product.stock < 20) {
        return false;
      }

      switch (priceFilter) {
        case "under-15":
          if (discountedPrice >= 15) {
            return false;
          }
          break;
        case "15-30":
          if (discountedPrice < 15 || discountedPrice > 30) {
            return false;
          }
          break;
        case "30-plus":
          if (discountedPrice < 30) {
            return false;
          }
          break;
        default:
          break;
      }

      return true;
    });

    const sorted = [...filtered];
    switch (sort) {
      case "Price: Low to High":
        return sorted.sort((a, b) => a.price * (1 - a.discountPercent / 100) - b.price * (1 - b.discountPercent / 100));
      case "Price: High to Low":
        return sorted.sort((a, b) => b.price * (1 - b.discountPercent / 100) - a.price * (1 - a.discountPercent / 100));
      case "Stock":
        return sorted.sort((a, b) => b.stock - a.stock);
      case "Name":
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case "Biggest discount":
        return sorted.sort((a, b) => b.discountPercent - a.discountPercent);
      default:
        return sorted.sort((a, b) => b.rating - a.rating);
    }
  }, [priceFilter, query, quickFilters, selectedCategories, sort, store.activeProducts]);

  const groupedProducts = useMemo(() => {
    const visibleCategories = selectedCategories.length ? selectedCategories : categories;

    return visibleCategories
      .map((category) => ({
        category,
        products: products.filter((product) => product.category === category),
      }))
      .filter((group) => group.products.length);
  }, [categories, products, selectedCategories]);

  const activeFilterCount = useMemo(
    () =>
      selectedCategories.length +
      Object.values(quickFilters).filter(Boolean).length +
      (priceFilter !== "all" ? 1 : 0) +
      (query ? 1 : 0),
    [priceFilter, query, quickFilters, selectedCategories],
  );

  useEffect(() => {
    setVisibleGridCounts((current) => {
      const next = {};

      for (const group of groupedProducts) {
        next[group.category] = current[group.category] ?? PUBLIC_INITIAL_VISIBLE_PRODUCTS;
      }

      return next;
    });
  }, [groupedProducts]);

  useEffect(() => {
    if (!revealState) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setRevealState(null);
    }, PUBLIC_REVEAL_DURATION_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [revealState]);

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
    const nextUrl = view ? `/?auth=${view}` : "/";

    if (typeof window !== "undefined" && pathname === "/") {
      window.history.replaceState(window.history.state, "", nextUrl);
      return;
    }

    router.replace(nextUrl);
  }

  function openClientLogin(nextNotice = "") {
    setRoleTab("client");
    setShowRegister(false);
    setShowPublicShop(false);
    setNotice(nextNotice);
    syncAuthView("login");
  }

  function chooseQuickCategory(category) {
    if (category === "All") {
      setSelectedCategories([]);
      return;
    }
    setSelectedCategories([category]);
  }

  function toggleSidebarCategory(category) {
    setSelectedCategories((current) =>
      current.includes(category)
        ? current.filter((entry) => entry !== category)
        : [...current, category],
    );
  }

  function toggleQuickFilter(filterId) {
    setQuickFilters((current) => ({
      ...current,
      [filterId]: !current[filterId],
    }));
  }

  function resetFilters() {
    setQuery("");
    setCategorySearch("");
    setSelectedCategories([]);
    setPriceFilter("all");
    setQuickFilters(INITIAL_PUBLIC_QUICK_FILTERS);
    setSort("Featured");
  }

  function showMoreProducts(category) {
    setVisibleGridCounts((current) => {
      const start = current[category] ?? PUBLIC_INITIAL_VISIBLE_PRODUCTS;
      setRevealState({ category, start });

      return {
        ...current,
        [category]: start + PUBLIC_SHOW_MORE_INCREMENT,
      };
    });
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
    <main className={cn("app-shell", showingPublicShop ? "app-shell-public" : "app-shell-auth")}>
      <AnimatePresence mode="sync" initial={false}>
        <motion.div
          key={viewKey}
          initial={{ opacity: 0, y: 8, scale: 0.995 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.995 }}
          transition={{ duration: 0.24, ease: easeInOutCubic }}
        >
          {showingPublicShop ? (
            <section className="public-home-screen w-full overflow-hidden">
              <div className="relative isolate overflow-hidden">
                <div className="pointer-events-none absolute -right-14 top-12 h-44 w-44 rounded-full bg-[color-mix(in_srgb,var(--action)_22%,transparent)] blur-2xl" />
                <div className="pointer-events-none absolute -left-18 bottom-[-5rem] h-52 w-52 rounded-full bg-[color-mix(in_srgb,var(--accent-secondary)_38%,transparent)] blur-2xl" />
                <div className="relative z-[1] mx-auto w-full max-w-[72rem] px-4 pb-6 pt-3.5 sm:px-5 sm:pb-8 lg:px-6">
                  <header className="relative z-[70] pb-2.5">
                    <div className="flex items-center justify-between gap-4">
                      <h1 className="text-[1.3rem] font-semibold tracking-[-0.03em] text-[var(--foreground)] sm:text-[1.42rem]">Shop</h1>
                      <div className="flex items-center gap-2">
                        <div className="relative z-[80] origin-center scale-[0.92] sm:scale-[0.96]">
                          <ThemeToggle />
                        </div>
                        <button type="button" onClick={() => openClientLogin("")} className="app-link-button !px-2.5 !py-1.5 text-[0.92rem] text-[var(--foreground)]">
                          Login
                        </button>
                      </div>
                    </div>
                  </header>

                  <div className="space-y-4">
                  <EntranceMotion delay={0.08}>
                    <div className="public-home-banner relative overflow-hidden rounded-[0.2rem] px-3.5 py-2.5 shadow-[0_12px_28px_rgba(2,10,18,0.16)] sm:px-4 sm:py-3">
                      <div className="pointer-events-none absolute -right-10 -top-10 h-24 w-32 rounded-full bg-[color-mix(in_srgb,var(--action)_18%,transparent)]" />
                      <div className="relative flex items-start justify-between gap-3">
                        <p className="min-w-0 flex-1 pr-1 text-[0.88rem] leading-6 text-[var(--foreground)] sm:text-[0.92rem] sm:leading-7">
                          Browse products freely. Login to add items and checkout.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setRoleTab("client");
                            setShowRegister(true);
                            setShowPublicShop(false);
                            setNotice("");
                            syncAuthView("register");
                          }}
                          className="shrink-0 rounded-xl px-0 py-1.5 text-[0.9rem] font-medium text-[var(--action)] sm:text-[0.94rem]"
                        >
                          Create account
                        </button>
                      </div>
                    </div>
                  </EntranceMotion>

                  {notice ? <AuthNotice>{notice}</AuthNotice> : null}

                  <EntranceMotion delay={0.16}>
                    <div className="lg:grid lg:grid-cols-[17.75rem_minmax(0,1fr)] lg:items-start lg:gap-6 xl:grid-cols-[18.5rem_minmax(0,1fr)]">
                      <aside className="hidden lg:block">
                        <div className="sticky top-6 rounded-[1.6rem] border border-[var(--border-soft)] bg-[color-mix(in_srgb,var(--surface)_92%,var(--background-start))] p-5 shadow-[var(--shadow-soft)]">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <h2 className="text-[1.4rem] font-semibold text-[var(--foreground)]">Filters</h2>
                              <p className="mt-1 text-sm text-[var(--muted-foreground)]">{products.length} grocery items</p>
                            </div>
                            <button
                              type="button"
                              onClick={resetFilters}
                              className="text-sm font-medium text-[var(--action)]"
                            >
                              Reset
                            </button>
                          </div>

                          <div className="mt-6 space-y-6">
                            <section className="space-y-3">
                              <h3 className="text-sm font-semibold text-[var(--foreground)]">Sort by</h3>
                              <div className="space-y-2">
                                {PUBLIC_SORT_OPTIONS.map((option) => (
                                  <label key={option} className="flex cursor-pointer items-center gap-3 text-sm text-[var(--foreground)]">
                                    <input
                                      type="radio"
                                      name="desktop-sort"
                                      checked={sort === option}
                                      onChange={() => setSort(option)}
                                      className="size-4 accent-[var(--action)]"
                                    />
                                    <span>{option}</span>
                                  </label>
                                ))}
                              </div>
                            </section>

                            <section className="space-y-3">
                              <h3 className="text-sm font-semibold text-[var(--foreground)]">Quick filters</h3>
                              <div className="flex flex-wrap gap-2">
                                {PUBLIC_QUICK_FILTER_OPTIONS.map((filter) => (
                                  <button
                                    key={filter.id}
                                    type="button"
                                    onClick={() => toggleQuickFilter(filter.id)}
                                    className={cn(
                                      "rounded-full border px-3.5 py-2 text-sm transition",
                                      quickFilters[filter.id]
                                        ? "border-transparent bg-[color-mix(in_srgb,var(--action)_16%,var(--surface))] text-[var(--foreground)]"
                                        : "border-[var(--border-soft)] bg-[var(--surface)] text-[var(--foreground)]",
                                    )}
                                  >
                                    {filter.label}
                                  </button>
                                ))}
                              </div>
                            </section>

                            <section className="space-y-3">
                              <h3 className="text-sm font-semibold text-[var(--foreground)]">Price</h3>
                              <div className="grid grid-cols-2 gap-2">
                                {PUBLIC_PRICE_OPTIONS.map((option) => (
                                  <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => setPriceFilter(option.value)}
                                    className={cn(
                                      "rounded-full border px-3 py-2 text-sm transition",
                                      priceFilter === option.value
                                        ? "border-transparent bg-[color-mix(in_srgb,var(--action)_16%,var(--surface))] text-[var(--foreground)]"
                                        : "border-[var(--border-soft)] bg-[var(--surface)] text-[var(--foreground)]",
                                    )}
                                  >
                                    {option.label}
                                  </button>
                                ))}
                              </div>
                            </section>

                            <section className="space-y-3">
                              <div className="flex items-center justify-between gap-3">
                                <h3 className="text-sm font-semibold text-[var(--foreground)]">Categories</h3>
                                <span className="text-xs text-[var(--muted-foreground)]">{selectedCategories.length || categories.length}</span>
                              </div>

                              <div className="rounded-[1rem] border border-[var(--border-soft)] bg-[var(--surface)] px-3 py-2.5">
                                <label className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
                                  <Search className="size-4" />
                                  <input
                                    value={categorySearch}
                                    onChange={(event) => setCategorySearch(event.target.value)}
                                    placeholder="Search categories"
                                    className="w-full bg-transparent outline-none placeholder:text-[var(--muted-foreground)]"
                                  />
                                </label>
                              </div>

                              <div className="max-h-[18rem] space-y-2 overflow-y-auto pr-1">
                                {visibleCategoryOptions.map((category) => (
                                  <label key={category} className="flex cursor-pointer items-center gap-3 text-sm text-[var(--foreground)]">
                                    <input
                                      type="checkbox"
                                      checked={selectedCategories.includes(category)}
                                      onChange={() => toggleSidebarCategory(category)}
                                      className="size-4 rounded accent-[var(--action)]"
                                    />
                                    <span>{category}</span>
                                  </label>
                                ))}
                              </div>
                            </section>
                          </div>
                        </div>
                      </aside>

                      <div className="space-y-4">
                        <div className="public-home-search-shell rounded-[1.1rem] p-1.5 shadow-[0_8px_22px_rgba(3,10,18,0.12)]">
                          <label className="flex items-center gap-3 rounded-[1.05rem] px-4 py-3">
                            <Search className="size-5 text-[var(--action)]" />
                            <input
                              value={query}
                              onChange={(event) => setQuery(event.target.value)}
                              placeholder="Search products, categories, deals"
                              className="w-full bg-transparent text-[1rem] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] outline-none"
                            />
                          </label>
                        </div>

                        <div className="space-y-3 lg:hidden">
                          <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                            {categoryChips.map((category) => {
                              const isActive = category === "All" ? selectedCategories.length === 0 : selectedCategories.includes(category);

                              return (
                                <button
                                  key={category}
                                  type="button"
                                  onClick={() => chooseQuickCategory(category)}
                                  className="public-home-chip inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm transition text-[var(--foreground)]"
                                  data-active={isActive}
                                >
                                  {isActive ? <Check className="size-3.5" /> : null}
                                  {category}
                                </button>
                              );
                            })}
                          </div>

                          <select
                            value={sort}
                            onChange={(event) => setSort(event.target.value)}
                            className="public-home-select w-full rounded-[1rem] border px-4 py-3 text-[1rem] text-[var(--foreground)] outline-none"
                          >
                            {PUBLIC_SORT_OPTIONS.map((option) => (
                              <option key={option}>{option}</option>
                            ))}
                          </select>
                        </div>

                        <div className="hidden items-center justify-between rounded-[1.2rem] border border-[var(--border-soft)] bg-[color-mix(in_srgb,var(--surface)_88%,var(--background-start))] px-4 py-3 lg:flex">
                          <div>
                            <p className="text-sm font-semibold text-[var(--foreground)]">{products.length} products ready to browse</p>
                            <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                              Filter by deals, stock, price range, and grocery category.
                            </p>
                          </div>
                          {activeFilterCount ? (
                            <button type="button" onClick={resetFilters} className="text-sm font-medium text-[var(--action)]">
                              Clear filters
                            </button>
                          ) : null}
                        </div>

                        {groupedProducts.length ? (
                          <div className="space-y-6">
                            {groupedProducts.map((group, groupIndex) => (
                              <EntranceMotion key={group.category} delay={0.24 + groupIndex * 0.1}>
                                <section className="space-y-4">
                                  <h2 className="px-1 text-[1.18rem] font-medium text-[var(--foreground)]">{group.category}</h2>

                                  <PublicHeroCarousel
                                    products={group.products.slice(0, 5)}
                                    onRequireLogin={openClientLogin}
                                    reverse={groupIndex % 2 === 1}
                                  />

                                  <div className="rounded-[1.55rem]">
                                    <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
                                      {group.products
                                        .slice(0, visibleGridCounts[group.category] ?? PUBLIC_INITIAL_VISIBLE_PRODUCTS)
                                        .map((product, index) => {
                                        const isRevealed =
                                          revealState?.category === group.category &&
                                          index >= revealState.start;

                                        return (
                                        <motion.div
                                          key={`${group.category}-${product.id}-grid`}
                                          initial={isRevealed ? { opacity: 0, x: 36 } : false}
                                          animate={{ opacity: 1, x: 0 }}
                                          transition={{
                                            duration: isRevealed ? 0.38 : 0.22,
                                            delay: isRevealed ? (index - revealState.start) * 0.055 : 0,
                                            ease: easeInOutCubic,
                                          }}
                                        >
                                          <PublicProductCard product={product} onRequireLogin={openClientLogin} />
                                        </motion.div>
                                      )})}
                                    </div>
                                  </div>

                                  {group.products.length > (visibleGridCounts[group.category] ?? PUBLIC_INITIAL_VISIBLE_PRODUCTS) ? (
                                    <div className="flex justify-center pt-1">
                                      <Button
                                        type="button"
                                        variant="secondary"
                                        className="rounded-full border-2 border-[color-mix(in_srgb,var(--foreground)_24%,transparent)] px-5 py-2.5 text-sm shadow-none hover:border-[color-mix(in_srgb,var(--foreground)_36%,transparent)]"
                                        onClick={() => showMoreProducts(group.category)}
                                      >
                                        Show more
                                      </Button>
                                    </div>
                                  ) : null}
                                </section>
                              </EntranceMotion>
                            ))}
                          </div>
                        ) : (
                          <div className="rounded-[1.25rem] border border-[var(--border-soft)] bg-[color-mix(in_srgb,var(--surface)_82%,var(--background-start))] px-4 py-8 text-center text-sm text-[var(--muted-foreground)]">
                            No matching products.
                          </div>
                        )}
                      </div>
                    </div>
                  </EntranceMotion>
                </div>
                </div>
              </div>
            </section>
          ) : (
            <section className="flex min-h-[100dvh] w-full items-center justify-center px-4 py-6 sm:px-6">
              <div className="w-full max-w-[28.75rem]">
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
