"use client";

import { useEffect, useMemo, useState } from "react";

import { clearStore, getAll, put, remove } from "@/lib/db";

const ECOM_CART_KEY = "myshop-ecommerce-cart";

function readLocalStorageCart() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    return JSON.parse(window.localStorage.getItem(ECOM_CART_KEY) || "[]");
  } catch {
    return [];
  }
}

function writeLocalStorageCart(cart) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(ECOM_CART_KEY, JSON.stringify(cart));
}

export function useCart({ mode = "pos" } = {}) {
  const [items, setItems] = useState([]);
  const isPos = mode === "pos";

  useEffect(() => {
    let active = true;

    async function loadCart() {
      const nextItems = isPos ? await getAll("cart") : readLocalStorageCart();
      if (active) {
        setItems(nextItems);
      }
    }

    loadCart();

    return () => {
      active = false;
    };
  }, [isPos]);

  async function persist(nextItems) {
    setItems(nextItems);

    if (!isPos) {
      writeLocalStorageCart(nextItems);
      return;
    }

    await clearStore("cart");
    await Promise.all(nextItems.map((item) => put("cart", item)));
  }

  async function addItem(product, quantity = 1) {
    const existing = items.find((item) => item.productId === product.id);
    const nextItems = existing
      ? items.map((item) =>
          item.productId === product.id ? { ...item, quantity: item.quantity + quantity } : item,
        )
      : [
          ...items,
          {
            productId: product.id,
            name: product.name,
            price: product.price,
            quantity,
          },
        ];

    await persist(nextItems);
  }

  async function updateQuantity(productId, quantity) {
    const nextItems =
      quantity <= 0
        ? items.filter((item) => item.productId !== productId)
        : items.map((item) => (item.productId === productId ? { ...item, quantity } : item));

    if (isPos && quantity <= 0) {
      await remove("cart", productId);
    }

    await persist(nextItems);
  }

  async function clearCart() {
    setItems([]);

    if (isPos) {
      await clearStore("cart");
    } else {
      writeLocalStorageCart([]);
    }
  }

  const total = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0),
    [items],
  );

  return {
    items,
    total,
    addItem,
    updateQuantity,
    clearCart,
  };
}
