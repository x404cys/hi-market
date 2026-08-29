import { ProductCard } from "@/components/store/product/product-card";
import { EmptyState } from "@/components/store/shared/empty-state";
import { SectionHeader } from "@/components/store/shared/section-header";
import type { StoreProduct } from "@/features/catalog/types";
import Link from "next/link";

export function BestDealsSection({
  products,
  title = "أفضل العروض",
  emptyTitle = "لا توجد منتجات متاحة",
  emptyDescription = "ستظهر المنتجات النشطة هنا عند إضافتها من لوحة الإدارة.",
  clearFiltersHref,
}: {
  products: StoreProduct[];
  title?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  clearFiltersHref?: string;
}) {
  return (
    <section id="best-deals" className="space-y-4 scroll-mt-6">
      <SectionHeader title={title} href="/products" />
      {products.length === 0 ? (
        <div className="space-y-3">
          <EmptyState title={emptyTitle} description={emptyDescription} />
          {clearFiltersHref && (
            <div className="text-center">
              <Link
                href={clearFiltersHref}
                className="inline-flex h-10 items-center justify-center rounded-[10px] bg-[var(--store-primary)] px-4 text-sm font-bold text-white transition hover:bg-[var(--store-primary-strong)] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-emerald-200"
              >
                مسح الفلاتر
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </section>
  );
}
