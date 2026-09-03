import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { FavoriteButton } from "@/components/store/product/favorite-button";
import { ProductDetailContent } from "@/components/store/product/product-detail-content";
import { RelatedProducts } from "@/components/store/product/related-products";
import type { StoreProduct, StoreProductDetail } from "@/features/catalog/types";
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
  let product: StoreProductDetail | null = null;
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
        <div className="mx-auto max-w-md rounded-xl border border-[var(--store-border)] bg-white p-6 text-center">
          <p className="text-sm font-semibold">تعذر تحميل المنتج</p>
          <p className="mt-1 text-xs text-[var(--store-text-muted)]">
            تحقق من اتصال قاعدة البيانات ثم أعد المحاولة.
          </p>
          <Link
            href="/"
            className="mt-5 inline-flex h-11 items-center justify-center rounded-lg bg-[var(--store-primary)] px-4 text-sm font-semibold text-white"
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
            className="flex size-10 items-center justify-center rounded-lg bg-white text-[var(--store-text)] ring-1 ring-[var(--store-border)]"
            aria-label="العودة"
          >
            <ArrowRight className="size-4" />
          </Link>
          <h1 className="text-sm font-semibold">تفاصيل المنتج</h1>
          <FavoriteButton
            productId={product.id}
            className="size-9 text-[var(--store-text)] ring-1 ring-[var(--store-border)]"
          />
        </header>

        <div className="md:rounded-xl md:border md:border-[var(--store-border)] md:bg-white md:p-5">
          <ProductDetailContent product={product} />
        </div>
        <div className="space-y-6 px-5 pt-6 md:px-0">
          <RelatedProducts
            products={relatedProducts}
            categorySlug={product.category.slug}
          />
        </div>
      </div>
    </main>
  );
}
