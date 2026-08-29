import { ProductGrid } from "@/components/store/product/product-grid";
import { SectionHeader } from "@/components/store/shared/section-header";
import type { StoreProduct } from "@/features/catalog/types";

export function RelatedProducts({
  products,
  categorySlug,
}: {
  products: StoreProduct[];
  categorySlug?: string;
}) {
  if (products.length === 0) return null;

  return (
    <section className="space-y-3">
      <SectionHeader
        title="منتجات مشابهة"
        href={categorySlug ? `/categories/${categorySlug}` : undefined}
      />
      <ProductGrid products={products} compact />
    </section>
  );
}
