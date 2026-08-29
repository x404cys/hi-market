"use client";

import { useEffect, useMemo, useSyncExternalStore } from "react";

type FavoritesState = {
  productIds: string[];
};

const favoritesStorageKey = "supermarket-favorites";
const favoritesChangedEvent = "supermarket-favorites-changed";
const emptyFavoritesState: FavoritesState = { productIds: [] };
let cachedRawFavorites: string | null = null;
let cachedFavoritesState: FavoritesState = emptyFavoritesState;

export function toggleFavorite(productId: string) {
  const state = readFavoritesState();
  const exists = state.productIds.includes(productId);
  const nextIds = exists
    ? state.productIds.filter((id) => id !== productId)
    : [productId, ...state.productIds];

  writeFavoritesState({ productIds: nextIds });
}

export function removeFavorite(productId: string) {
  const state = readFavoritesState();
  writeFavoritesState({
    productIds: state.productIds.filter((id) => id !== productId),
  });
}

export function clearFavorites() {
  writeFavoritesState(emptyFavoritesState);
}

export function useFavoritesState() {
  useEffect(() => {
    emitFavoritesChanged();
  }, []);

  return useSyncExternalStore(
    subscribeToFavorites,
    getFavoritesSnapshot,
    getServerSnapshot,
  );
}

export function useFavoritesSummary() {
  const state = useFavoritesState();

  return useMemo(
    () => ({
      count: state.productIds.length,
    }),
    [state.productIds.length],
  );
}

export function useIsFavorite(productId: string) {
  const state = useFavoritesState();

  return state.productIds.includes(productId);
}

function subscribeToFavorites(onStoreChange: () => void) {
  window.addEventListener(favoritesChangedEvent, onStoreChange);
  window.addEventListener("storage", onStoreChange);

  return () => {
    window.removeEventListener(favoritesChangedEvent, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

function getFavoritesSnapshot() {
  return readFavoritesState();
}

function getServerSnapshot() {
  return emptyFavoritesState;
}

function readFavoritesState(): FavoritesState {
  if (typeof window === "undefined") return emptyFavoritesState;

  try {
    const raw = window.localStorage.getItem(favoritesStorageKey);
    if (!raw) {
      cachedRawFavorites = null;
      cachedFavoritesState = emptyFavoritesState;
      return cachedFavoritesState;
    }

    if (raw === cachedRawFavorites) return cachedFavoritesState;

    const parsed = JSON.parse(raw) as Partial<FavoritesState>;
    if (!Array.isArray(parsed.productIds)) return emptyFavoritesState;

    const uniqueIds = Array.from(
      new Set(
        parsed.productIds.filter(
          (productId): productId is string =>
            typeof productId === "string" && productId.length > 0,
        ),
      ),
    );

    cachedRawFavorites = raw;
    cachedFavoritesState = { productIds: uniqueIds };

    return cachedFavoritesState;
  } catch {
    return emptyFavoritesState;
  }
}

function writeFavoritesState(state: FavoritesState) {
  const normalizedState = {
    productIds: Array.from(new Set(state.productIds)),
  };
  const raw = JSON.stringify(normalizedState);
  cachedRawFavorites = raw;
  cachedFavoritesState = normalizedState;
  window.localStorage.setItem(favoritesStorageKey, raw);
  emitFavoritesChanged();
}

function emitFavoritesChanged() {
  window.dispatchEvent(new Event(favoritesChangedEvent));
}
