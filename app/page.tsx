import { connection } from "next/server";
import { BottomNavigation } from "@/components/store/layout/bottom-navigation";
import { StoreHeader } from "@/components/store/layout/store-header";
import { BestDealsSection } from "@/components/store/home/best-deals-section";
import { CategoriesSection } from "@/components/store/home/categories-section";
import { HomeHeroBanner } from "@/components/store/home/home-hero-banner";
import { EmptyState } from "@/components/store/shared/empty-state";
import type { StoreCategory, StoreProduct } from "@/features/catalog/types";
import {
  hasStorefrontFilters,
  normalizeStorefrontFilters,
} from "@/features/catalog/filters";
import {
  listBrandOptions,
  listCategoryOptions,
} from "@/lib/services/catalog-options.service";
import { listStoreProducts } from "@/lib/services/product.service";

type HomePageProps = {
  searchParams: Promise<{
    search?: string;
    category?: string;
    brand?: string;
    minPrice?: string;
    maxPrice?: string;
    inStock?: string;
  }>;
};

export default async function Page({ searchParams }: HomePageProps) {
  await connection();

  const params = await searchParams;
  const filters = normalizeStorefrontFilters(params);
  const [categoriesResult, brandsResult, productsResult] = await Promise.allSettled([
    listCategoryOptions(),
    listBrandOptions(),
    listStoreProducts({
      limit: hasStorefrontFilters(filters) ? 30 : 10,
      search: filters.search,
      categorySlug: filters.category,
      brandSlug: filters.brand,
      minPrice: filters.minPrice,
      maxPrice: filters.maxPrice,
      inStock: filters.inStock,
    }),
  ]);
  const categories: StoreCategory[] =
    categoriesResult.status === "fulfilled" ? categoriesResult.value : [];
  const brands = brandsResult.status === "fulfilled" ? brandsResult.value : [];
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
        <StoreHeader filters={filters} categories={categories} brands={brands} />
        <HomeHeroBanner />
        {hasCatalogError && (
          <EmptyState
            title="تعذر تحميل بعض بيانات المتجر"
            description="تحقق من اتصال قاعدة البيانات ثم أعد المحاولة."
          />
        )}
        <CategoriesSection categories={categories} />
        <BestDealsSection
          products={products}
          title={hasStorefrontFilters(filters) ? "نتائج المنتجات" : "أفضل العروض"}
          emptyTitle={
            hasStorefrontFilters(filters)
              ? "لا توجد منتجات مطابقة"
              : "لا توجد منتجات متاحة"
          }
          emptyDescription={
            hasStorefrontFilters(filters)
              ? "جرّب تغيير البحث أو الفلاتر."
              : "ستظهر المنتجات النشطة هنا عند إضافتها من لوحة الإدارة."
          }
          clearFiltersHref={hasStorefrontFilters(filters) ? "/" : undefined}
        />
      </div>
      <BottomNavigation />
    </main>
  );
}
