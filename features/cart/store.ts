"use client";

import { useEffect, useMemo, useSyncExternalStore } from "react";
import type { CartItem, CartState } from "@/features/cart/types";
import type { StoreProduct } from "@/features/catalog/types";
import { getInitialQuantity, getQuantityStep } from "@/features/catalog/utils";

const cartStorageKey = "supermarket-cart";
const cartChangedEvent = "supermarket-cart-changed";
const emptyCartState: CartState = { items: [] };
let cachedRawCart: string | null = null;
let cachedCartState: CartState = emptyCartState;

export function addProductToCart(product: StoreProduct, quantity?: number) {
  const nextQuantity = quantity ?? getInitialQuantity(product);
  const state = readCartState();
  const existingItem = state.items.find((item) => item.productId === product.id);

  const nextItems = existingItem
    ? state.items.map((item) =>
        item.productId === product.id
          ? {
              ...item,
              quantity: roundQuantity(item.quantity + nextQuantity),
            }
          : item,
      )
    : [
        ...state.items,
        {
          productId: product.id,
          slug: product.slug,
          name: product.name,
          image: product.image,
          price: product.price,
          unit: product.unit,
          unitValue: product.unitValue,
          minOrderQty: product.minOrderQty,
          orderStep: product.orderStep,
          quantity: nextQuantity,
        },
      ];

  writeCartState({ items: nextItems });
}

export function setCartItemQuantity(productId: string, quantity: number) {
  const state = readCartState();
  const nextItems = state.items
    .map((item) =>
      item.productId === productId
        ? {
            ...item,
            quantity: roundQuantity(quantity),
          }
        : item,
    )
    .filter((item) => item.quantity > 0);

  writeCartState({ items: nextItems });
}

export function clearCart() {
  writeCartState(emptyCartState);
}

export function useCartSummary() {
  const state = useCartState();

  return useMemo(() => {
    const itemCount = state.items.reduce((total, item) => total + item.quantity, 0);
    const total = state.items.reduce(
      (sum, item) => sum + Number(item.price) * item.quantity,
      0,
    );

    return {
      itemCount,
      total,
    };
  }, [state.items]);
}

export function useCartState() {
  useEffect(() => {
    emitCartChanged();
  }, []);

  return useSyncExternalStore(subscribeToCart, getCartSnapshot, getServerSnapshot);
}

export function getCartItemQuantity(productId: string) {
  return readCartState().items.find((item) => item.productId === productId)?.quantity ?? 0;
}

export function getCartStepForProduct(product: StoreProduct) {
  return getQuantityStep(product);
}

function subscribeToCart(onStoreChange: () => void) {
  window.addEventListener(cartChangedEvent, onStoreChange);
  window.addEventListener("storage", onStoreChange);

  return () => {
    window.removeEventListener(cartChangedEvent, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

function getCartSnapshot() {
  return readCartState();
}

function getServerSnapshot() {
  return emptyCartState;
}

function readCartState(): CartState {
  if (typeof window === "undefined") return emptyCartState;

  try {
    const raw = window.localStorage.getItem(cartStorageKey);
    if (!raw) {
      cachedRawCart = null;
      cachedCartState = emptyCartState;
      return cachedCartState;
    }

    if (raw === cachedRawCart) return cachedCartState;

    const parsed = JSON.parse(raw) as CartState;
    if (!Array.isArray(parsed.items)) return emptyCartState;

    cachedRawCart = raw;
    cachedCartState = {
      items: parsed.items.map(normalizeCartItem).filter((item) => item !== null),
    };

    return cachedCartState;
  } catch {
    return emptyCartState;
  }
}

function writeCartState(state: CartState) {
  const raw = JSON.stringify(state);
  cachedRawCart = raw;
  cachedCartState = state;
  window.localStorage.setItem(cartStorageKey, raw);
  emitCartChanged();
}

function emitCartChanged() {
  window.dispatchEvent(new Event(cartChangedEvent));
}

function normalizeCartItem(value: unknown): CartItem | null {
  if (typeof value !== "object" || value === null) return null;

  const item = value as Partial<CartItem>;

  if (
    typeof item.productId === "string" &&
    typeof item.slug === "string" &&
    typeof item.name === "string" &&
    typeof item.price === "string" &&
    typeof item.quantity === "number"
  ) {
    return {
      productId: item.productId,
      slug: item.slug,
      name: item.name,
      image: item.image ?? null,
      price: item.price,
      unit: item.unit ?? "PIECE",
      unitValue: item.unitValue ?? null,
      minOrderQty: item.minOrderQty ?? "1",
      orderStep: item.orderStep ?? "1",
      quantity: item.quantity,
    };
  }

  return null;
}

function roundQuantity(value: number) {
  if (!Number.isFinite(value)) return 0;

  return Math.max(0, Math.round(value * 1000) / 1000);
}
