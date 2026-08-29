import { BadgeCheck, PackageCheck } from "lucide-react";
import { ProductDescription } from "@/components/store/product/product-description";
import { ProductImageGallery } from "@/components/store/product/product-image-gallery";
import { ProductPrice } from "@/components/store/product/product-price";
import { ProductPurchaseActions } from "@/components/store/product/product-purchase-actions";
import type { StoreProduct } from "@/features/catalog/types";
import { getDiscountPercent, getUnitText } from "@/features/catalog/utils";
import { getStockLabel } from "@/lib/products/product-format";

export function ProductDetailContent({
  product,
  mode = "page",
}: {
  product: StoreProduct;
  mode?: "page" | "sheet";
}) {
  const discount = getDiscountPercent(product);
  const stock = getStockLabel(product.stock, product.lowStockAt);
  const brandOrCategory = product.brand?.name ?? product.category.name;

  return (
    <div className={mode === "sheet" ? "flex min-h-0 flex-1 flex-col" : ""}>
      <div
        className={
          mode === "sheet"
            ? "min-h-0 flex-1 overflow-y-auto"
            : "md:grid md:grid-cols-[minmax(0,1fr)_minmax(320px,420px)] md:gap-8"
        }
      >
        <ProductImageGallery product={product} compact={mode === "sheet"} />

        <div
          className={
            mode === "sheet"
              ? "space-y-5 px-5 pb-5 pt-4"
              : "space-y-6 px-5 pt-5 md:px-0 md:pt-2"
          }
        >
          <section className="space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--store-text-muted)]">
              <span>{brandOrCategory}</span>
              <span aria-hidden="true">•</span>
              <span>{getUnitText(product)}</span>
            </div>
            <div className="space-y-2">
              <h1 className="text-xl font-semibold leading-8 text-[var(--store-text)] md:text-2xl">
                {product.name}
              </h1>
              <div className="flex flex-wrap items-center gap-2">
                <ProductPrice
                  price={product.price}
                  comparePrice={product.comparePrice}
                />
                {discount && (
                  <span className="rounded-md bg-[var(--store-primary-soft)] px-2 py-1 text-xs font-medium text-[var(--store-primary-strong)]">
                    وفر {discount.toLocaleString("ar-IQ")}%
                  </span>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <InfoPill
                icon={<PackageCheck className="size-4" />}
                label="التوفر"
                value={stock.label}
              />
              <InfoPill
                icon={<BadgeCheck className="size-4" />}
                label="النوع"
                value={product.isWeighted ? "يباع بالوزن" : "منتج عادي"}
              />
            </div>
          </section>

          <ProductDescription description={product.description} />

          {mode === "page" && <ProductPurchaseActions product={product} />}
        </div>
      </div>

      {mode === "sheet" && (
        <ProductPurchaseActions product={product} mode="sheet" />
      )}
    </div>
  );
}

function InfoPill({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-[var(--store-border)] bg-white px-3 py-2">
      <span className="text-[var(--store-primary)]">{icon}</span>
      <span className="min-w-0">
        <span className="block text-[11px] text-[var(--store-text-muted)]">
          {label}
        </span>
        <span className="block truncate text-xs font-medium text-[var(--store-text)]">
          {value}
        </span>
      </span>
    </div>
  );
}
