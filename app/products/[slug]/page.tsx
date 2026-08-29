import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { FavoriteButton } from "@/components/store/product/favorite-button";
import { ProductDescription } from "@/components/store/product/product-description";
import { ProductDetailActions } from "@/components/store/product/product-detail-actions";
import { ProductImageGallery } from "@/components/store/product/product-image-gallery";
import { RelatedProducts } from "@/components/store/product/related-products";
import { ProductPrice } from "@/components/store/product/product-price";
import type { StoreProduct } from "@/features/catalog/types";
import { getUnitText } from "@/features/catalog/utils";
import {
  getStoreProductBySlug,
  listRelatedStoreProducts,
} from "@/lib/services/product.service";

type ProductPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function ProductPage({ params }: ProductPageProps) {
  await connection();

  const { slug } = await params;
  let product: StoreProduct | null = null;
  let relatedProducts: StoreProduct[] = [];
  let hasDataError = false;

  try {
    product = await getStoreProductBySlug(slug);

    if (product) {
      relatedProducts = await listRelatedStoreProducts(product).catch(() => []);
    }
  } catch {
    hasDataError = true;
  }

  if (!product && !hasDataError) notFound();

  if (!product) {
    return (
      <main
        dir="rtl"
        className="min-h-screen bg-[var(--store-background)] px-5 py-6 text-[var(--store-text)]"
      >
        <div className="mx-auto max-w-md rounded-[18px] border border-[var(--store-border)] bg-white p-6 text-center">
          <p className="text-sm font-bold">تعذر تحميل المنتج</p>
          <p className="mt-1 text-xs text-[var(--store-text-muted)]">
            تحقق من اتصال قاعدة البيانات ثم أعد المحاولة.
          </p>
          <Link
            href="/"
            className="mt-5 inline-flex h-10 items-center justify-center rounded-[10px] bg-[var(--store-primary)] px-4 text-sm font-bold text-white"
          >
            العودة للرئيسية
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-white pb-28 text-[var(--store-text)]"
    >
      <div className="mx-auto max-w-md md:max-w-3xl">
        <header className="flex h-14 items-center justify-between px-5">
          <Link
            href="/"
            className="flex size-9 items-center justify-center rounded-full bg-white text-[var(--store-text)] shadow-[0_8px_18px_rgba(15,23,42,0.08)] ring-1 ring-[var(--store-border)]"
            aria-label="العودة"
          >
            <ArrowRight className="size-4" />
          </Link>
          <h1 className="text-sm font-bold">تفاصيل المنتج</h1>
          <FavoriteButton
            productId={product.id}
            className="size-9 text-[var(--store-text)] ring-1 ring-[var(--store-border)]"
          />
        </header>

        <ProductImageGallery product={product} />

        <div className="space-y-6 px-5 pt-5">
          <section className="grid grid-cols-[1fr_auto] items-start gap-4">
            <div className="min-w-0">
              <p className="text-xs text-[var(--store-text-muted)]">
                {product.category.name}
              </p>
              <h2 className="mt-1 text-xl font-bold leading-7 text-[var(--store-text)]">
                {product.name}
              </h2>
              <p className="mt-1 text-xs text-[var(--store-text-muted)]">
                {getUnitText(product)}
              </p>
              <div className="mt-3">
                <ProductPrice
                  price={product.price}
                  comparePrice={product.comparePrice}
                />
              </div>
            </div>
            <ProductDetailActions product={product} />
          </section>

          <ProductDescription description={product.description} />
          <RelatedProducts
            products={relatedProducts}
            categorySlug={product.category.slug}
          />
        </div>
      </div>
    </main>
  );
}
