"use client";

import Link from "next/link";
import { ProductCard } from "@/components/store/product/product-card";
import { BottomNavigation } from "@/components/store/layout/bottom-navigation";
import type { StoreProduct } from "@/features/catalog/types";
import { useFavoritesState } from "@/features/favorites/store";

export function FavoritesPageClient({
  products,
  hasError = false,
}: {
  products: StoreProduct[];
  hasError?: boolean;
}) {
  const favorites = useFavoritesState();
  const favoriteProducts = favorites.productIds
    .map((productId) => products.find((product) => product.id === productId))
    .filter((product): product is StoreProduct => Boolean(product));

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[var(--store-background)] px-5 pb-28 pt-5 text-[var(--store-text)]"
    >
      <div className="mx-auto max-w-md space-y-5 md:max-w-5xl">
        <header>
          <p className="text-xs text-[var(--store-text-muted)]">
            المنتجات المحفوظة محلياً على هذا الجهاز
          </p>
          <h1 className="mt-1 text-xl font-bold">المفضلة</h1>
        </header>

        {hasError ? (
          <EmptyFavoritesState
            title="تعذر تحميل المنتجات المفضلة"
            description="تحقق من اتصال المتجر ثم أعد المحاولة."
          />
        ) : favoriteProducts.length === 0 ? (
          <EmptyFavoritesState
            title="لا توجد منتجات في المفضلة"
            description="أضف المنتجات التي تعجبك لتجدها هنا بسهولة."
          />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {favoriteProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
      <BottomNavigation />
    </main>
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
    <section className="rounded-[18px] border border-[var(--store-border)] bg-white px-5 py-10 text-center">
      <p className="text-sm font-bold">{title}</p>
      <p className="mx-auto mt-1 max-w-xs text-xs leading-5 text-[var(--store-text-muted)]">
        {description}
      </p>
      <Link
        href="/"
        className="mt-5 inline-flex h-10 items-center justify-center rounded-[10px] bg-[var(--store-primary)] px-4 text-sm font-bold text-white transition hover:bg-[var(--store-primary-strong)] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-emerald-200"
      >
        تصفح المنتجات
      </Link>
    </section>
  );
}
