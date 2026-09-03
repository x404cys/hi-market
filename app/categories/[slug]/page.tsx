import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { BottomNavigation } from "@/components/store/layout/bottom-navigation";
import { ProductGrid } from "@/components/store/product/product-grid";
import { EmptyState } from "@/components/store/shared/empty-state";
import { StoreCategoryImage } from "@/components/store/shared/category-image";
import { STORE_PRODUCT_PAGE_SIZE } from "@/features/catalog/constants";
import { getCategoryOptionBySlug } from "@/lib/services/catalog-options.service";
import { getStoreProducts } from "@/lib/services/product.service";

type CategoryPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function CategoryPage({ params }: CategoryPageProps) {
  await connection();

  const { slug } = await params;
  const categoryResult = await getCategoryOptionBySlug(slug)
    .then((category) => ({ category, hasError: false }))
    .catch(() => ({ category: null, hasError: true }));
  const { category, hasError } = categoryResult;

  if (!category && !hasError) notFound();

  if (!category) {
    return (
      <main
        dir="rtl"
        className="min-h-screen bg-[var(--store-background)] px-5 pb-24 pt-5 text-[var(--store-text)]"
      >
        <div className="mx-auto max-w-md md:max-w-6xl xl:max-w-7xl">
          <EmptyState
            title="تعذر تحميل التصنيف"
            description="تحقق من اتصال قاعدة البيانات ثم أعد المحاولة."
          />
        </div>
        <BottomNavigation />
      </main>
    );
  }

  const productsPage = await getStoreProducts({
    categoryId: category.id,
    limit: STORE_PRODUCT_PAGE_SIZE,
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
        <header className="flex items-center gap-3">
          <Link
            href="/"
            className="flex size-10 items-center justify-center rounded-lg bg-white text-[var(--store-text)] ring-1 ring-[var(--store-border)]"
            aria-label="العودة"
          >
            <ArrowRight className="size-4" />
          </Link>
          {category.image && (
            <div className="relative size-12 overflow-hidden rounded-lg border border-[var(--store-border)] bg-white">
              <StoreCategoryImage
                src={category.image}
                alt={category.name}
                sizes="48px"
                className="object-cover"
              />
            </div>
          )}
          <div>
            <p className="text-xs text-[var(--store-text-muted)]">التصنيف</p>
            <h1 className="text-xl font-semibold">{category.name}</h1>
          </div>
        </header>

        {productsPage.items.length === 0 ? (
          <EmptyState title="لا توجد منتجات في هذا التصنيف حالياً" />
        ) : (
          <ProductGrid
            products={productsPage.items}
            pagination={{
              nextCursor: productsPage.nextCursor,
              hasMore: productsPage.hasMore,
              query: {
                limit: STORE_PRODUCT_PAGE_SIZE,
                category: category.slug,
              },
            }}
          />
        )}
      </div>
      <BottomNavigation />
    </main>
  );
}
