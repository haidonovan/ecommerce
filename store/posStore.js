"use client";

import { create } from "zustand";

export const usePosStore = create((set, get) => ({
  cart: [],
  heldSales: [],
  cashierName: "",
  pendingSyncCount: 0,
  addToCart(product) {
    const currentCart = get().cart;
    const stock = Number(product.stock || 0);
    const existing = currentCart.find((item) => item.productId === product.id);

    if (stock <= 0) {
      return;
    }

    if (existing) {
      if (existing.qty >= existing.stock) {
        return;
      }

      set({
        cart: currentCart.map((item) =>
          item.productId === product.id ? { ...item, qty: Math.min(item.qty + 1, item.stock) } : item,
        ),
      });
      return;
    }

    set({
      cart: [
        ...currentCart,
        {
          productId: product.id,
          name: product.name,
          price: Number(product.price || 0),
          qty: 1,
          stock,
          sku: product.sku || product.id,
          image: product.image || product.imageUrl || "",
          note: "",
        },
      ],
    });
  },
  removeFromCart(productId) {
    set({
      cart: get().cart.filter((item) => item.productId !== productId),
    });
  },
  updateQty(productId, qty) {
    const nextQty = Number(qty || 0);

    if (nextQty <= 0) {
      get().removeFromCart(productId);
      return;
    }

    set({
      cart: get().cart.map((item) =>
        item.productId === productId ? { ...item, qty: Math.min(nextQty, item.stock) } : item,
      ),
    });
  },
  clearCart() {
    set({ cart: [] });
  },
  setCart(cart) {
    set({ cart });
  },
  updateItemNote(productId, note) {
    set({
      cart: get().cart.map((item) => (item.productId === productId ? { ...item, note } : item)),
    });
  },
  holdCurrentSale() {
    const cart = get().cart;
    if (!cart.length) {
      return;
    }

    set({
      heldSales: [
        ...get().heldSales,
        {
          id: `held-${Date.now()}`,
          label: `Sale ${get().heldSales.length + 1}`,
          cart,
          createdAt: new Date().toISOString(),
        },
      ],
      cart: [],
    });
  },
  restoreHeldSale(id) {
    const heldSale = get().heldSales.find((sale) => sale.id === id);
    if (!heldSale) {
      return;
    }

    set({
      cart: heldSale.cart,
      heldSales: get().heldSales.filter((sale) => sale.id !== id),
    });
  },
  setCashierName(name) {
    set({ cashierName: name });
  },
  setPendingSyncCount(n) {
    set({ pendingSyncCount: Number(n || 0) });
  },
}));
