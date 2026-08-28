import { connection } from "next/server";
import { BottomNavigation } from "@/components/store/layout/bottom-navigation";
import { StoreHeader } from "@/components/store/layout/store-header";
import { BestDealsSection } from "@/components/store/home/best-deals-section";
import { CategoriesSection } from "@/components/store/home/categories-section";
import { HomeHeroBanner } from "@/components/store/home/home-hero-banner";
import { EmptyState } from "@/components/store/shared/empty-state";
import type { StoreCategory, StoreProduct } from "@/features/catalog/types";
import { listCategoryOptions } from "@/lib/services/catalog-options.service";
import { listStoreProducts } from "@/lib/services/product.service";

type HomePageProps = {
  searchParams: Promise<{
    search?: string;
  }>;
};

export default async function Page({ searchParams }: HomePageProps) {
  await connection();

  const params = await searchParams;
  const search = typeof params.search === "string" ? params.search.trim() : "";
  const [categoriesResult, productsResult] = await Promise.allSettled([
    listCategoryOptions(),
    listStoreProducts({
      limit: 10,
      search,
    }),
  ]);
  const categories: StoreCategory[] =
    categoriesResult.status === "fulfilled" ? categoriesResult.value : [];
  const products: StoreProduct[] =
    productsResult.status === "fulfilled" ? productsResult.value : [];
  const hasCatalogError =
    categoriesResult.status === "rejected" || productsResult.status === "rejected";

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[var(--store-background)] px-5 pb-24 pt-5 text-[var(--store-text)]"
    >
      <div className="mx-auto max-w-md space-y-7 md:max-w-5xl">
        <StoreHeader search={search} />
        <HomeHeroBanner />
        {hasCatalogError && (
          <EmptyState
            title="تعذر تحميل بعض بيانات المتجر"
            description="تحقق من اتصال قاعدة البيانات ثم أعد المحاولة."
          />
        )}
        <CategoriesSection categories={categories} />
        <BestDealsSection products={products} />
      </div>
      <BottomNavigation />
    </main>
  );
}
