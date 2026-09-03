"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ProductCard } from "@/components/store/product/product-card";
import { ProductDetailSheet } from "@/components/store/product/product-detail-sheet";
import type { StoreProduct } from "@/features/catalog/types";
import type { CursorPaginatedProducts } from "@/lib/products/product-types";

type ProductGridPagination = {
  endpoint?: string;
  query?: Record<string, string | number | boolean | undefined>;
  nextCursor: string | null;
  hasMore: boolean;
};

export function ProductGrid({
  products,
  compact = false,
  pagination,
}: {
  products: StoreProduct[];
  compact?: boolean;
  pagination?: ProductGridPagination;
}) {
  const resetKey = useMemo(
    () =>
      [
        compact ? "compact" : "grid",
        products.map((product) => product.id).join(","),
        pagination?.nextCursor ?? "",
        pagination?.hasMore ? "more" : "end",
        JSON.stringify(pagination?.query ?? {}),
      ].join("|"),
    [compact, pagination?.hasMore, pagination?.nextCursor, pagination?.query, products],
  );

  return (
    <ProductGridStateful
      key={resetKey}
      products={products}
      compact={compact}
      pagination={pagination}
    />
  );
}

function ProductGridStateful({
  products,
  compact = false,
  pagination,
}: {
  products: StoreProduct[];
  compact?: boolean;
  pagination?: ProductGridPagination;
}) {
  const [items, setItems] = useState(products);
  const [selectedProduct, setSelectedProduct] = useState<StoreProduct | null>(null);
  const [nextCursor, setNextCursor] = useState(pagination?.nextCursor ?? null);
  const [hasMore, setHasMore] = useState(pagination?.hasMore ?? false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const endpoint = pagination?.endpoint ?? "/api/store/products";
  const canLoadMore = !compact && Boolean(pagination);
  const baseQuery = useMemo(
    () => normalizeQuery(pagination?.query),
    [pagination?.query],
  );

  const loadMore = useCallback(async () => {
    if (!canLoadMore || !hasMore || !nextCursor || isLoadingMore) return;

    setIsLoadingMore(true);
    setLoadError(false);

    try {
      const url = new URL(endpoint, window.location.origin);

      for (const [key, value] of Object.entries(baseQuery)) {
        if (value !== undefined && value !== "") {
          url.searchParams.set(key, String(value));
        }
      }

      url.searchParams.set("cursor", nextCursor);

      const response = await fetch(url, {
        headers: { Accept: "application/json" },
      });

      if (!response.ok) throw new Error("Failed to load products");

      const payload = (await response.json()) as {
        success: boolean;
        data?: CursorPaginatedProducts<StoreProduct>;
      };

      if (!payload.success || !payload.data) {
        throw new Error("Invalid product response");
      }

      setItems((current) => appendUniqueProducts(current, payload.data?.items ?? []));
      setNextCursor(payload.data.nextCursor);
      setHasMore(payload.data.hasMore);
    } catch {
      setLoadError(true);
    } finally {
      setIsLoadingMore(false);
    }
  }, [baseQuery, canLoadMore, endpoint, hasMore, isLoadingMore, nextCursor]);

  useEffect(() => {
    if (!canLoadMore || !hasMore || loadError) return;

    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          void loadMore();
        }
      },
      { rootMargin: "640px 0px" },
    );

    observer.observe(sentinel);

    return () => observer.disconnect();
  }, [canLoadMore, hasMore, loadError, loadMore]);

  return (
    <>
      <div
        className={
          compact
            ? "-mx-1 flex gap-3 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            : "grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6"
        }
      >
        {items.map((product) => (
          <div key={product.id} className={compact ? "w-[144px] shrink-0 sm:w-[164px]" : ""}>
            <ProductCard product={product} onOpenProduct={setSelectedProduct} />
          </div>
        ))}
        {isLoadingMore &&
          Array.from({ length: 6 }).map((_, index) => (
            <ProductCardSkeleton
              key={`product-skeleton-${index}`}
              compact={compact}
            />
          ))}
      </div>

      {canLoadMore && (
        <div ref={sentinelRef} className="py-4 text-center">
          {loadError ? (
            <div className="space-y-2">
              <p className="text-xs text-[var(--store-danger)]">
                تعذر تحميل المزيد من المنتجات
              </p>
              <button
                type="button"
                onClick={() => void loadMore()}
                className="inline-flex h-9 items-center justify-center rounded-lg border border-[var(--store-border)] bg-white px-3 text-xs font-semibold text-[var(--store-primary)]"
              >
                إعادة المحاولة
              </button>
            </div>
          ) : hasMore ? (
            <button
              type="button"
              onClick={() => void loadMore()}
              disabled={isLoadingMore}
              className="inline-flex h-10 items-center justify-center rounded-lg border border-[var(--store-border)] bg-white px-4 text-xs font-semibold text-[var(--store-primary)] disabled:text-[var(--store-text-muted)]"
            >
              {isLoadingMore ? "جاري التحميل..." : "عرض المزيد"}
            </button>
          ) : (
            items.length > 0 && (
              <p className="text-xs text-[var(--store-text-muted)]">
                تم عرض جميع المنتجات
              </p>
            )
          )}
        </div>
      )}

      <ProductDetailSheet
        product={selectedProduct}
        open={Boolean(selectedProduct)}
        onOpenChange={(open) => {
          if (!open) setSelectedProduct(null);
        }}
      />
    </>
  );
}

function normalizeQuery(query: ProductGridPagination["query"]) {
  return Object.fromEntries(
    Object.entries(query ?? {}).filter(([, value]) => {
      if (typeof value === "boolean") return value;
      return value !== undefined && value !== "";
    }),
  );
}

function appendUniqueProducts(current: StoreProduct[], next: StoreProduct[]) {
  const seen = new Set(current.map((product) => product.id));
  const additions = next.filter((product) => {
    if (seen.has(product.id)) return false;
    seen.add(product.id);
    return true;
  });

  return [...current, ...additions];
}

function ProductCardSkeleton({ compact }: { compact: boolean }) {
  return (
    <div
      className={
        compact
          ? "w-[144px] shrink-0 sm:w-[164px]"
          : "rounded-lg border border-[var(--store-border)] bg-white p-2.5"
      }
    >
      <div className="mt-5 aspect-square animate-pulse rounded-lg bg-slate-100" />
      <div className="mt-3 h-3 w-4/5 animate-pulse rounded bg-slate-100" />
      <div className="mt-2 h-3 w-1/2 animate-pulse rounded bg-slate-100" />
      <div className="mt-4 flex items-end justify-between">
        <div className="h-4 w-16 animate-pulse rounded bg-slate-100" />
        <div className="size-10 animate-pulse rounded-lg bg-slate-100" />
      </div>
    </div>
  );
}
