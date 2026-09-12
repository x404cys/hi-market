import { BadgePercent } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { BottomNavigation } from "@/components/store/layout/bottom-navigation";
import { ProductGrid } from "@/components/store/product/product-grid";
import { EmptyState } from "@/components/store/shared/empty-state";
import { STORE_PRODUCT_PAGE_SIZE } from "@/features/catalog/constants";
import { getStoreProducts } from "@/lib/services/product.service";

export const metadata: Metadata = {
  title: "العروض | Hi Market",
  description: "اكتشف أفضل عروض وخصومات Hi Market",
};

type OffersPageProps = {
  searchParams: Promise<{
    filter?: string;
  }>;
};

const offerFilters = [
  { label: "الكل", href: "/offers", value: "all" },
  { label: "المتوفرة الآن", href: "/offers?filter=in-stock", value: "in-stock" },
] as const;

export default async function OffersPage({ searchParams }: OffersPageProps) {
  await connection();

  const params = await searchParams;
  const activeFilter = params.filter === "in-stock" ? "in-stock" : "all";
  const inStock = activeFilter === "in-stock";
  const productsPage = await getStoreProducts({
    limit: STORE_PRODUCT_PAGE_SIZE,
    onOffer: true,
    inStock,
  }).catch(() => ({
    items: [],
    nextCursor: null,
    hasMore: false,
    pageSize: STORE_PRODUCT_PAGE_SIZE,
  }));

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[var(--store-background)] px-5 pb-24 pt-5 text-[var(--store-text)]"
    >
      <div className="mx-auto max-w-md space-y-5 md:max-w-6xl xl:max-w-7xl">
        <header className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-lg bg-emerald-50 text-[var(--store-primary)] ring-1 ring-emerald-100">
              <BadgePercent className="size-5" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">العروض</h1>
              <p className="mt-1 text-xs leading-5 text-[var(--store-text-muted)]">
                أفضل العروض والخصومات المختارة لك
              </p>
            </div>
          </div>

          <div className="-mx-5 overflow-x-auto px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex min-w-max gap-2" aria-label="تصفية العروض">
              {offerFilters.map((filter) => {
                const active = activeFilter === filter.value;

                return (
                  <Link
                    key={filter.value}
                    href={filter.href}
                    aria-current={active ? "page" : undefined}
                    className={`inline-flex h-10 items-center justify-center rounded-lg border px-4 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-emerald-200 ${
                      active
                        ? "border-[var(--store-primary)] bg-[var(--store-primary)] text-white"
                        : "border-[var(--store-border)] bg-white text-[var(--store-text-muted)] hover:text-[var(--store-text)]"
                    }`}
                  >
                    {filter.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </header>

        {productsPage.items.length === 0 ? (
          <div className="space-y-3">
            <EmptyState
              title="لا توجد عروض حالياً"
              description="سنضيف الخصومات هنا بمجرد توفرها."
            />
            <div className="text-center">
              <Link
                href="/"
                className="inline-flex h-11 items-center justify-center rounded-lg bg-[var(--store-primary)] px-4 text-sm font-semibold text-white transition hover:bg-[var(--store-primary-strong)] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-emerald-200"
              >
                تصفح المنتجات
              </Link>
            </div>
          </div>
        ) : (
          <ProductGrid
            products={productsPage.items}
            pagination={{
              endpoint: "/api/store/products",
              nextCursor: productsPage.nextCursor,
              hasMore: productsPage.hasMore,
              query: {
                limit: STORE_PRODUCT_PAGE_SIZE,
                onOffer: true,
                inStock,
              },
            }}
          />
        )}
      </div>
      <BottomNavigation />
    </main>
  );
}
