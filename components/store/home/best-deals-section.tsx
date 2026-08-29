import { ProductGrid } from "@/components/store/product/product-grid";
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
                className="inline-flex h-11 items-center justify-center rounded-lg bg-[var(--store-primary)] px-4 text-sm font-semibold text-white transition hover:bg-[var(--store-primary-strong)] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-emerald-200"
              >
                مسح الفلاتر
              </Link>
            </div>
          )}
        </div>
      ) : (
        <ProductGrid products={products} />
      )}
    </section>
  );
}
