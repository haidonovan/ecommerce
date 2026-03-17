"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

import { fallbackProducts } from "@/lib/fallback-data";

const STORAGE_KEY = "grocery-store-web-state-v1";
const AppStoreContext = createContext(null);

function createInitialProducts() {
  return fallbackProducts;
}

function createInitialState() {
  return {
    products: createInitialProducts(),
    favorites: [],
    cart: [],
    orders: [
      {
        id: "ORD-1001",
        createdAt: "2026-03-14T09:30:00.000Z",
        shippingAddress: "120 Riverside Ave, Bangkok",
        paymentMethod: "Cash on delivery",
        status: "delivered",
        trackingNumber: "TRK-9981",
        trackingCarrier: "Flash Express",
        trackingStatus: "Delivered",
        couponCode: "WELCOME10",
        couponDiscount: 4.2,
        lines: [
          {
            productId: "market-box",
            productName: "Weekend Market Box",
            quantity: 1,
            unitPrice: 42,
            discountPercent: 15,
          },
        ],
        total: 37.8,
      },
      {
        id: "ORD-1002",
        createdAt: "2026-03-16T13:15:00.000Z",
        shippingAddress: "22 Orchard Lane, Chiang Mai",
        paymentMethod: "Bank transfer",
        status: "processing",
        trackingNumber: null,
        trackingCarrier: null,
        trackingStatus: "Packing",
        couponCode: null,
        couponDiscount: 0,
        lines: [
          {
            productId: "berry-mix",
            productName: "Berry Energy Mix",
            quantity: 2,
            unitPrice: 12.75,
            discountPercent: 0,
          },
        ],
        total: 25.5,
      },
    ],
    supportTickets: [
      {
        id: "SUP-2001",
        subject: "Need delivery update",
        status: "answered",
        createdAt: "2026-03-15T08:45:00.000Z",
        messages: [
          {
            id: "SUP-2001-1",
            authorRole: "CLIENT",
            authorEmail: "client@example.com",
            message: "Can you check the delivery window for my order?",
            createdAt: "2026-03-15T08:45:00.000Z",
          },
          {
            id: "SUP-2001-2",
            authorRole: "ADMIN",
            authorEmail: "admin@example.com",
            message: "We checked the courier and your parcel is arriving tomorrow.",
            createdAt: "2026-03-15T09:10:00.000Z",
          },
        ],
      },
    ],
    coupons: [
      {
        id: "COUPON-1",
        code: "WELCOME10",
        type: "percent",
        value: 10,
        isActive: true,
        description: "Welcome discount for your first order.",
        audience: "everyone",
        userEmail: "",
      },
      {
        id: "COUPON-2",
        code: "VIPCLIENT",
        type: "fixed",
        value: 8,
        isActive: true,
        description: "Private reward coupon for returning shoppers.",
        audience: "user",
        userEmail: "client@example.com",
      },
    ],
  };
}

function readStoredState() {
  if (typeof window === "undefined") {
    return createInitialState();
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return createInitialState();
    }
    return {
      ...createInitialState(),
      ...JSON.parse(raw),
    };
  } catch {
    return createInitialState();
  }
}

function getDiscountedPrice(product) {
  return product.price * (1 - (product.discountPercent || 0) / 100);
}

function normalizeOrderTotals(order) {
  const subtotal = order.lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
  return {
    ...order,
    total: Number((subtotal - (order.couponDiscount || 0)).toFixed(2)),
  };
}

export function AppStoreProvider({ children }) {
  const [state, setState] = useState(createInitialState);

  async function readJson(endpoint, fallback) {
    try {
      const response = await fetch(endpoint, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok || !Array.isArray(data.data)) {
        return fallback;
      }
      return data.data;
    } catch {
      return fallback;
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setState(readStoredState());
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function syncStore() {
      try {
        const [products, favorites, orders, coupons, supportTickets] = await Promise.all([
          readJson("/api/products", fallbackProducts),
          readJson("/api/favorites", []),
          readJson("/api/orders", createInitialState().orders),
          readJson("/api/coupons", createInitialState().coupons),
          readJson("/api/support", createInitialState().supportTickets),
        ]);

        if (!active) {
          return;
        }

        setState((current) => ({
          ...current,
          products,
          favorites,
          orders,
          coupons,
          supportTickets,
        }));
      } catch {
        // Keep local fallback state when the API is unavailable.
      }
    }

    syncStore();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const value = useMemo(() => {
    const products = state.products;
    const activeProducts = products.filter((product) => product.isActive);
    const categories = ["All", ...new Set(products.map((product) => product.category))];
    const favoriteProducts = products.filter((product) => state.favorites.includes(product.id));
    const cartItems = state.cart
      .map((item) => {
        const product = products.find((entry) => entry.id === item.productId);
        if (!product) {
          return null;
        }
        return {
          ...item,
          product,
          subtotal: Number((getDiscountedPrice(product) * item.quantity).toFixed(2)),
        };
      })
      .filter(Boolean);
    const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const cartTotal = Number(cartItems.reduce((sum, item) => sum + item.subtotal, 0).toFixed(2));

    function patch(nextState) {
      setState((current) => {
        const resolved = typeof nextState === "function" ? nextState(current) : nextState;
        return resolved;
      });
    }

    async function syncPatchedProduct(productId, changes) {
      try {
        const response = await fetch(`/api/products/${productId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...changes,
            ...(changes.image !== undefined ? { imageUrl: changes.image } : {}),
          }),
        });
        const data = await response.json();
        if (!response.ok || !data.data) {
          return;
        }
        patch((current) => ({
          ...current,
          products: current.products.map((product) => (product.id === productId ? data.data : product)),
        }));
      } catch {
        // ignore update failures in the optimistic UI layer
      }
    }

    return {
      ...state,
      products,
      activeProducts,
      categories,
      favoriteProducts,
      cartItems,
      cartCount,
      cartTotal,
      getProduct(id) {
        return products.find((product) => product.id === id) || null;
      },
      isFavorite(id) {
        return state.favorites.includes(id);
      },
      cartQuantityFor(id) {
        return state.cart.find((item) => item.productId === id)?.quantity || 0;
      },
      toggleFavorite(productId) {
        fetch(`/api/favorites/${productId}`, { method: "POST" })
          .then((response) => response.json().then((data) => ({ ok: response.ok, data })))
          .then(({ ok, data }) => {
            if (!ok) {
              return;
            }
            patch((current) => ({
              ...current,
              favorites: data.isFavorite
                ? [...new Set([...current.favorites, productId])]
                : current.favorites.filter((id) => id !== productId),
            }));
          })
          .catch(() => {});
      },
      addToCart(productId, quantity = 1) {
        patch((current) => {
          const product = current.products.find((entry) => entry.id === productId);
          if (!product || !product.isActive || quantity <= 0) {
            return current;
          }
          const existing = current.cart.find((item) => item.productId === productId);
          const nextQuantity = (existing?.quantity || 0) + quantity;
          if (nextQuantity > product.stock) {
            return current;
          }
          const nextCart = existing
            ? current.cart.map((item) => (item.productId === productId ? { ...item, quantity: nextQuantity } : item))
            : [...current.cart, { productId, quantity }];
          return {
            ...current,
            cart: nextCart,
          };
        });
      },
      decreaseCart(productId) {
        patch((current) => ({
          ...current,
          cart: current.cart
            .map((item) => (item.productId === productId ? { ...item, quantity: item.quantity - 1 } : item))
            .filter((item) => item.quantity > 0),
        }));
      },
      removeFromCart(productId) {
        patch((current) => ({
          ...current,
          cart: current.cart.filter((item) => item.productId !== productId),
        }));
      },
      addComment(productId, message, authorEmail) {
        fetch("/api/comments", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            productId,
            message,
          }),
        })
          .then((response) => response.json().then((data) => ({ ok: response.ok, data })))
          .then(({ ok, data }) => {
            if (!ok || !data.data) {
              return;
            }
            patch((current) => ({
              ...current,
              products: current.products.map((product) =>
                product.id === productId
                  ? {
                      ...product,
                      comments: [...(product.comments || []), data.data],
                    }
                  : product,
              ),
            }));
          })
          .catch(() => {
            patch((current) => ({
              ...current,
              products: current.products.map((product) =>
                product.id === productId
                  ? {
                      ...product,
                      comments: [
                        ...(product.comments || []),
                        {
                          id: `COMMENT-${Date.now()}`,
                          userEmail: authorEmail,
                          message,
                          createdAt: new Date().toISOString(),
                          updatedAt: new Date().toISOString(),
                          isEdited: false,
                        },
                      ],
                    }
                  : product,
              ),
            }));
          });
      },
      updateComment(productId, commentId, message) {
        fetch(`/api/comments/${commentId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ message }),
        })
          .then((response) => response.json().then((data) => ({ ok: response.ok, data })))
          .then(({ ok, data }) => {
            if (!ok || !data.data) {
              return;
            }
            patch((current) => ({
              ...current,
              products: current.products.map((product) =>
                product.id === productId
                  ? {
                      ...product,
                      comments: (product.comments || []).map((entry) => (entry.id === commentId ? data.data : entry)),
                    }
                  : product,
              ),
            }));
          })
          .catch(() => {
            patch((current) => ({
              ...current,
              products: current.products.map((product) =>
                product.id === productId
                  ? {
                      ...product,
                      comments: (product.comments || []).map((entry) =>
                        entry.id === commentId
                          ? {
                              ...entry,
                              message,
                              updatedAt: new Date().toISOString(),
                              isEdited: true,
                            }
                          : entry,
                      ),
                    }
                  : product,
              ),
            }));
          });
      },
      deleteComment(productId, commentId) {
        fetch(`/api/comments/${commentId}`, {
          method: "DELETE",
        })
          .then((response) => {
            if (!response.ok) {
              return;
            }
            patch((current) => ({
              ...current,
              products: current.products.map((product) =>
                product.id === productId
                  ? {
                      ...product,
                      comments: (product.comments || []).filter((entry) => entry.id !== commentId),
                    }
                  : product,
              ),
            }));
          })
          .catch(() => {
            patch((current) => ({
              ...current,
              products: current.products.map((product) =>
                product.id === productId
                  ? {
                      ...product,
                      comments: (product.comments || []).filter((entry) => entry.id !== commentId),
                    }
                  : product,
              ),
            }));
          });
      },
      submitRating(productId, ratingValue) {
        const product = products.find((entry) => entry.id === productId);
        if (!product) {
          return;
        }

        const nextCount = (product.ratingCount || 0) + 1;
        const nextRating = Number((((product.rating || 0) * (product.ratingCount || 0) + ratingValue) / nextCount).toFixed(1));

        patch((current) => ({
          ...current,
          products: current.products.map((entry) =>
            entry.id === productId
              ? {
                  ...entry,
                  rating: nextRating,
                  ratingCount: nextCount,
                }
              : entry,
          ),
        }));

        syncPatchedProduct(productId, {
          ratingAvg: nextRating,
          ratingCount: nextCount,
        });
      },
      async placeOrder({ shippingAddress, paymentMethod, couponCode, userEmail }) {
        const currentCart = state.cart;
        if (!currentCart.length) {
          return null;
        }
        const response = await fetch("/api/orders", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            shippingAddress,
            paymentMethod,
            couponCode,
            lines: currentCart.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
            })),
          }),
        });
        const data = await response.json();
        if (!response.ok || !data.data) {
          const coupon = state.coupons.find(
            (entry) =>
              entry.isActive &&
              entry.code.toLowerCase() === (couponCode || "").trim().toLowerCase() &&
              (entry.audience === "everyone" || !entry.userEmail || entry.userEmail === userEmail),
          );
          const lines = currentCart
            .map((item) => {
              const product = state.products.find((entry) => entry.id === item.productId);
              if (!product) {
                return null;
              }
              return {
                productId: product.id,
                productName: product.name,
                quantity: item.quantity,
                unitPrice: Number(getDiscountedPrice(product).toFixed(2)),
                discountPercent: product.discountPercent || 0,
              };
            })
            .filter(Boolean);
          const subtotal = lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
          const couponDiscount = coupon
            ? coupon.type === "percent"
              ? Number(((subtotal * coupon.value) / 100).toFixed(2))
              : Number(Math.min(coupon.value, subtotal).toFixed(2))
            : 0;
          const createdOrder = normalizeOrderTotals({
            id: `ORD-${Math.floor(Date.now() / 1000)}`,
            createdAt: new Date().toISOString(),
            shippingAddress,
            paymentMethod,
            status: "pending",
            trackingNumber: null,
            trackingCarrier: null,
            trackingStatus: "Order received",
            couponCode: coupon?.code || null,
            couponDiscount,
            lines,
          });
          patch((current) => ({
            ...current,
            cart: [],
            orders: [createdOrder, ...current.orders],
            products: current.products.map((product) => {
              const line = lines.find((entry) => entry.productId === product.id);
              return line ? { ...product, stock: Math.max(0, product.stock - line.quantity) } : product;
            }),
          }));
          return createdOrder;
        }
        patch((current) => ({
          ...current,
          cart: [],
          orders: [data.data, ...current.orders],
          products: current.products.map((product) => {
            const line = data.data.lines.find((entry) => entry.productId === product.id);
            return line ? { ...product, stock: Math.max(0, product.stock - line.quantity) } : product;
          }),
        }));
        return data.data;
      },
      submitSupportTicket(subject, message, authorEmail) {
        fetch("/api/support", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ subject, message }),
        })
          .then((response) => response.json().then((data) => ({ ok: response.ok, data })))
          .then(({ ok, data }) => {
            if (!ok || !data.data) {
              return;
            }
            patch((current) => ({
              ...current,
              supportTickets: [data.data, ...current.supportTickets],
            }));
          })
          .catch(() => {
            patch((current) => ({
              ...current,
              supportTickets: [
                {
                  id: `SUP-${Math.floor(Date.now() / 1000)}`,
                  subject,
                  status: "open",
                  createdAt: new Date().toISOString(),
                  messages: [
                    {
                      id: `SUP-MSG-${Date.now()}`,
                      authorRole: "CLIENT",
                      authorEmail,
                      message,
                      createdAt: new Date().toISOString(),
                    },
                  ],
                },
                ...current.supportTickets,
              ],
            }));
          });
      },
      replySupport(ticketId, message, authorEmail, authorRole) {
        fetch(`/api/support/${ticketId}/messages`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ message }),
        })
          .then((response) => response.json().then((data) => ({ ok: response.ok, data })))
          .then(({ ok, data }) => {
            if (!ok || !data.data) {
              return;
            }
            patch((current) => ({
              ...current,
              supportTickets: current.supportTickets.map((ticket) => (ticket.id === ticketId ? data.data : ticket)),
            }));
          })
          .catch(() => {
            patch((current) => ({
              ...current,
              supportTickets: current.supportTickets.map((ticket) =>
                ticket.id === ticketId
                  ? {
                      ...ticket,
                      status: authorRole === "ADMIN" ? "answered" : "open",
                      messages: [
                        ...ticket.messages,
                        {
                          id: `SUP-MSG-${Date.now()}`,
                          authorRole,
                          authorEmail,
                          message,
                          createdAt: new Date().toISOString(),
                        },
                      ],
                    }
                  : ticket,
              ),
            }));
          });
      },
      closeSupport(ticketId) {
        fetch(`/api/support/${ticketId}/close`, { method: "PATCH" })
          .then((response) => response.json().then((data) => ({ ok: response.ok, data })))
          .then(({ ok, data }) => {
            if (!ok || !data.data) {
              return;
            }
            patch((current) => ({
              ...current,
              supportTickets: current.supportTickets.map((ticket) => (ticket.id === ticketId ? data.data : ticket)),
            }));
          })
          .catch(() => {
            patch((current) => ({
              ...current,
              supportTickets: current.supportTickets.map((ticket) =>
                ticket.id === ticketId ? { ...ticket, status: "closed" } : ticket,
              ),
            }));
          });
      },
      async addProduct(input) {
        try {
          const response = await fetch("/api/products", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              name: input.name,
              category: input.category,
              description: input.description,
              imageUrl: input.image,
              price: input.price,
              discountPercent: input.discountPercent,
              stock: input.stock,
            }),
          });
          const data = await response.json();
          if (!response.ok || !data.data) {
            return;
          }
          patch((current) => ({
            ...current,
            products: [data.data, ...current.products],
          }));
        } catch {
          // ignore create failures in the optimistic UI layer
        }
      },
      async uploadAsset(file) {
        try {
          const formData = new FormData();
          formData.append("file", file);

          const response = await fetch("/api/uploads", {
            method: "POST",
            body: formData,
          });
          const data = await response.json();
          if (!response.ok || !data.url) {
            return null;
          }
          return data.url;
        } catch {
          return null;
        }
      },
      async importProductsCsv(csv) {
        try {
          const response = await fetch("/api/products/import", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ csv }),
          });
          const data = await response.json();
          if (!response.ok) {
            return { success: false, message: data.error || "Import failed." };
          }

          const freshProducts = await readJson("/api/products", fallbackProducts);
          patch((current) => ({
            ...current,
            products: freshProducts,
          }));

          return { success: true, message: `Imported ${data.importedCount || 0} products.` };
        } catch {
          return { success: false, message: "Import failed." };
        }
      },
      async importInventoryCsv(csv) {
        try {
          const response = await fetch("/api/products/restock/import", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ csv }),
          });
          const data = await response.json();
          if (!response.ok) {
            return { success: false, message: data.error || "Import failed." };
          }

          const freshProducts = await readJson("/api/products", fallbackProducts);
          patch((current) => ({
            ...current,
            products: freshProducts,
          }));

          return { success: true, message: `Imported ${data.importedCount || 0} inventory rows.` };
        } catch {
          return { success: false, message: "Import failed." };
        }
      },
      async updateProduct(productId, changes) {
        await syncPatchedProduct(productId, changes);
      },
      async toggleProductStatus(productId) {
        const product = products.find((entry) => entry.id === productId);
        if (!product) {
          return;
        }
        await syncPatchedProduct(productId, { isActive: !product.isActive });
      },
      async restockProduct(productId, amount) {
        const product = products.find((entry) => entry.id === productId);
        if (!product) {
          return;
        }
        await syncPatchedProduct(productId, { stock: product.stock + amount });
      },
      updateOrder(orderId, changes) {
        fetch(`/api/orders/${orderId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(changes),
        })
          .then((response) => response.json().then((data) => ({ ok: response.ok, data })))
          .then(({ ok, data }) => {
            if (!ok || !data.data) {
              return;
            }
            patch((current) => ({
              ...current,
              orders: current.orders.map((order) => (order.id === orderId ? data.data : order)),
            }));
          })
          .catch(() => {
            patch((current) => ({
              ...current,
              orders: current.orders.map((order) =>
                order.id === orderId ? normalizeOrderTotals({ ...order, ...changes }) : order,
              ),
            }));
          });
      },
      createCoupon(input) {
        fetch("/api/coupons", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(input),
        })
          .then((response) => response.json().then((data) => ({ ok: response.ok, data })))
          .then(({ ok, data }) => {
            if (!ok || !data.data) {
              return;
            }
            patch((current) => ({
              ...current,
              coupons: [data.data, ...current.coupons],
            }));
          })
          .catch(() => {
            patch((current) => ({
              ...current,
              coupons: [
                {
                  id: `COUPON-${Math.floor(Date.now() / 1000)}`,
                  isActive: true,
                  ...input,
                },
                ...current.coupons,
              ],
            }));
          });
      },
      toggleCoupon(id) {
        const coupon = state.coupons.find((entry) => entry.id === id);
        if (!coupon) {
          return;
        }
        fetch(`/api/coupons/${id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ isActive: !coupon.isActive }),
        })
          .then((response) => response.json().then((data) => ({ ok: response.ok, data })))
          .then(({ ok, data }) => {
            if (!ok || !data.data) {
              return;
            }
            patch((current) => ({
              ...current,
              coupons: current.coupons.map((entry) => (entry.id === id ? data.data : entry)),
            }));
          })
          .catch(() => {
            patch((current) => ({
              ...current,
              coupons: current.coupons.map((entry) => (entry.id === id ? { ...entry, isActive: !entry.isActive } : entry)),
            }));
          });
      },
    };
  }, [state]);

  return <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>;
}

export function useAppStore() {
  const context = useContext(AppStoreContext);

  if (!context) {
    throw new Error("useAppStore must be used inside AppStoreProvider.");
  }

  return context;
}
