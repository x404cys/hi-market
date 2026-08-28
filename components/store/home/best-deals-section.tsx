import { ProductCard } from "@/components/store/product/product-card";
import { EmptyState } from "@/components/store/shared/empty-state";
import { SectionHeader } from "@/components/store/shared/section-header";
import type { StoreProduct } from "@/features/catalog/types";

export function BestDealsSection({ products }: { products: StoreProduct[] }) {
  return (
    <section id="best-deals" className="space-y-4 scroll-mt-6">
      <SectionHeader title="أفضل العروض" href="/products" />
      {products.length === 0 ? (
        <EmptyState
          title="لا توجد منتجات متاحة"
          description="ستظهر المنتجات النشطة هنا عند إضافتها من لوحة الإدارة."
        />
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
