"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ProductGrid } from "@/components/store/product/product-grid";
import { BottomNavigation } from "@/components/store/layout/bottom-navigation";
import type { StoreProduct } from "@/features/catalog/types";
import { STORE_PRODUCT_MAX_PAGE_SIZE } from "@/features/catalog/constants";
import { useFavoritesState } from "@/features/favorites/store";

export function FavoritesPageClient() {
  const favorites = useFavoritesState();
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const favoriteIds = useMemo(
    () => favorites.productIds.filter(isUuid).slice(0, 500),
    [favorites.productIds],
  );
  const favoriteProducts = useMemo(() => {
    const productsById = new Map(products.map((product) => [product.id, product]));

    return favoriteIds
      .map((productId) => productsById.get(productId))
      .filter((product): product is StoreProduct => Boolean(product));
  }, [favoriteIds, products]);

  useEffect(() => {
    if (favoriteIds.length === 0) return;

    let ignore = false;

    async function loadFavoriteProducts() {
      setIsLoading(true);
      setHasError(false);

      try {
        const chunks = chunkIds(favoriteIds, STORE_PRODUCT_MAX_PAGE_SIZE);
        const pages = await Promise.all(
          chunks.map(async (ids) => {
            const params = new URLSearchParams({
              ids: ids.join(","),
              limit: String(ids.length),
            });
            const response = await fetch(`/api/store/products?${params}`, {
              headers: { Accept: "application/json" },
            });

            if (!response.ok) throw new Error("Failed to load favorites");

            const payload = (await response.json()) as {
              success: boolean;
              data?: { items?: StoreProduct[] };
            };

            if (!payload.success) throw new Error("Invalid favorites response");

            return payload.data?.items ?? [];
          }),
        );

        if (!ignore) setProducts(pages.flat());
      } catch {
        if (!ignore) setHasError(true);
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }

    void loadFavoriteProducts();

    return () => {
      ignore = true;
    };
  }, [favoriteIds]);

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[var(--store-background)] px-5 pb-28 pt-5 text-[var(--store-text)]"
    >
      <div className="mx-auto max-w-md space-y-5 md:max-w-6xl xl:max-w-7xl">
        <header>
          <p className="text-xs text-[var(--store-text-muted)]">
            المنتجات المحفوظة محلياً على هذا الجهاز
          </p>
          <h1 className="mt-1 text-xl font-semibold">المفضلة</h1>
        </header>

        {favoriteIds.length > 0 && hasError ? (
          <EmptyFavoritesState
            title="تعذر تحميل المنتجات المفضلة"
            description="تحقق من اتصال المتجر ثم أعد المحاولة."
          />
        ) : favoriteIds.length > 0 && isLoading ? (
          <FavoritesLoadingState />
        ) : favoriteProducts.length === 0 ? (
          <EmptyFavoritesState
            title="لا توجد منتجات في المفضلة"
            description="أضف المنتجات التي تعجبك لتجدها هنا بسهولة."
          />
        ) : (
          <ProductGrid products={favoriteProducts} />
        )}
      </div>
      <BottomNavigation />
    </main>
  );
}

function FavoritesLoadingState() {
  return (
    <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="rounded-lg border border-[var(--store-border)] bg-white p-2.5"
        >
          <div className="mt-5 aspect-square animate-pulse rounded-lg bg-slate-100" />
          <div className="mt-3 h-3 w-4/5 animate-pulse rounded bg-slate-100" />
          <div className="mt-2 h-3 w-1/2 animate-pulse rounded bg-slate-100" />
          <div className="mt-4 h-8 animate-pulse rounded bg-slate-100" />
        </div>
      ))}
    </section>
  );
}

function chunkIds(ids: string[], size: number) {
  const chunks: string[][] = [];

  for (let index = 0; index < ids.length; index += size) {
    chunks.push(ids.slice(index, index + size));
  }

  return chunks;
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function EmptyFavoritesState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <section className="rounded-xl border border-[var(--store-border)] bg-white px-5 py-10 text-center">
      <p className="text-sm font-semibold">{title}</p>
      <p className="mx-auto mt-1 max-w-xs text-xs leading-5 text-[var(--store-text-muted)]">
        {description}
      </p>
      <Link
        href="/"
        className="mt-5 inline-flex h-11 items-center justify-center rounded-lg bg-[var(--store-primary)] px-4 text-sm font-semibold text-white transition hover:bg-[var(--store-primary-strong)] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-emerald-200"
      >
        تصفح المنتجات
      </Link>
    </section>
  );
}
