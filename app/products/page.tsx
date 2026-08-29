import { connection } from "next/server";
import { BottomNavigation } from "@/components/store/layout/bottom-navigation";
import { StoreHeader } from "@/components/store/layout/store-header";
import { ProductCard } from "@/components/store/product/product-card";
import { EmptyState } from "@/components/store/shared/empty-state";
import {
  hasStorefrontFilters,
  normalizeStorefrontFilters,
} from "@/features/catalog/filters";
import {
  listBrandOptions,
  listCategoryOptions,
} from "@/lib/services/catalog-options.service";
import { listStoreProducts } from "@/lib/services/product.service";
import Link from "next/link";

type ProductsPageProps = {
  searchParams: Promise<{
    search?: string;
    category?: string;
    brand?: string;
    minPrice?: string;
    maxPrice?: string;
    inStock?: string;
  }>;
};

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  await connection();

  const params = await searchParams;
  const filters = normalizeStorefrontFilters(params);
  const [categoriesResult, brandsResult, productsResult] = await Promise.allSettled([
    listCategoryOptions(),
    listBrandOptions(),
    listStoreProducts({
      search: filters.search,
      categorySlug: filters.category,
      brandSlug: filters.brand,
      minPrice: filters.minPrice,
      maxPrice: filters.maxPrice,
      inStock: filters.inStock,
      limit: 30,
    }),
  ]);
  const categories =
    categoriesResult.status === "fulfilled" ? categoriesResult.value : [];
  const brands = brandsResult.status === "fulfilled" ? brandsResult.value : [];
  const products = productsResult.status === "fulfilled" ? productsResult.value : [];
  const hasError = productsResult.status === "rejected";

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[var(--store-background)] px-5 pb-24 pt-5 text-[var(--store-text)]"
    >
      <div className="mx-auto max-w-md space-y-5 md:max-w-5xl">
        <StoreHeader filters={filters} categories={categories} brands={brands} />
        <h1 className="text-xl font-bold">كل المنتجات</h1>
        {hasError ? (
          <EmptyState
            title="تعذر تحميل المنتجات"
            description="تحقق من اتصال قاعدة البيانات ثم أعد المحاولة."
          />
        ) : products.length === 0 ? (
          <div className="space-y-3">
            <EmptyState
              title="لا توجد منتجات مطابقة"
              description="جرّب تغيير البحث أو الفلاتر."
            />
            {hasStorefrontFilters(filters) && (
              <div className="text-center">
                <Link
                  href="/products"
                  className="inline-flex h-10 items-center justify-center rounded-[10px] bg-[var(--store-primary)] px-4 text-sm font-bold text-white transition hover:bg-[var(--store-primary-strong)] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-emerald-200"
                >
                  مسح الفلاتر
                </Link>
              </div>
            )}
          </div>
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
