import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { BottomNavigation } from "@/components/store/layout/bottom-navigation";
import { ProductCard } from "@/components/store/product/product-card";
import { EmptyState } from "@/components/store/shared/empty-state";
import { getCategoryOptionBySlug } from "@/lib/services/catalog-options.service";
import { listStoreProducts } from "@/lib/services/product.service";

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
        <div className="mx-auto max-w-md md:max-w-5xl">
          <EmptyState
            title="تعذر تحميل التصنيف"
            description="تحقق من اتصال قاعدة البيانات ثم أعد المحاولة."
          />
        </div>
        <BottomNavigation />
      </main>
    );
  }

  const products = await listStoreProducts({
    categoryId: category.id,
    limit: 24,
  }).catch(() => []);

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[var(--store-background)] px-5 pb-24 pt-5 text-[var(--store-text)]"
    >
      <div className="mx-auto max-w-md space-y-5 md:max-w-5xl">
        <header className="flex items-center gap-3">
          <Link
            href="/"
            className="flex size-9 items-center justify-center rounded-full bg-white text-[var(--store-text)] ring-1 ring-[var(--store-border)]"
            aria-label="العودة"
          >
            <ArrowRight className="size-4" />
          </Link>
          <div>
            <p className="text-xs text-[var(--store-text-muted)]">التصنيف</p>
            <h1 className="text-xl font-bold">{category.name}</h1>
          </div>
        </header>

        {products.length === 0 ? (
          <EmptyState title="لا توجد منتجات في هذا التصنيف حالياً" />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
      <BottomNavigation />
    </main>
  );
}
