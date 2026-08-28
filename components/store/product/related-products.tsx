import { ProductCard } from "@/components/store/product/product-card";
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
      <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {products.map((product) => (
          <div key={product.id} className="w-[142px] shrink-0 sm:w-[160px]">
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </section>
  );
}
