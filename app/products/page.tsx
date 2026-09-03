import { connection } from "next/server";
import { BottomNavigation } from "@/components/store/layout/bottom-navigation";
import { StoreHeader } from "@/components/store/layout/store-header";
import { ProductGrid } from "@/components/store/product/product-grid";
import { EmptyState } from "@/components/store/shared/empty-state";
import { STORE_PRODUCT_PAGE_SIZE } from "@/features/catalog/constants";
import {
  hasStorefrontFilters,
  normalizeStorefrontFilters,
} from "@/features/catalog/filters";
import {
  listBrandOptions,
  listCategoryOptions,
} from "@/lib/services/catalog-options.service";
import { getStoreProducts } from "@/lib/services/product.service";
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
    getStoreProducts({
      search: filters.search,
      categorySlug: filters.category,
      brandSlug: filters.brand,
      minPrice: filters.minPrice,
      maxPrice: filters.maxPrice,
      inStock: filters.inStock,
      limit: STORE_PRODUCT_PAGE_SIZE,
    }),
  ]);
  const categories =
    categoriesResult.status === "fulfilled" ? categoriesResult.value : [];
  const brands = brandsResult.status === "fulfilled" ? brandsResult.value : [];
  const products =
    productsResult.status === "fulfilled" ? productsResult.value.items : [];
  const productPagination =
    productsResult.status === "fulfilled"
      ? {
          nextCursor: productsResult.value.nextCursor,
          hasMore: productsResult.value.hasMore,
        }
      : { nextCursor: null, hasMore: false };
  const hasError = productsResult.status === "rejected";

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[var(--store-background)] px-5 pb-24 pt-5 text-[var(--store-text)]"
    >
      <div className="mx-auto max-w-md space-y-5 md:max-w-6xl xl:max-w-7xl">
        <StoreHeader
          filters={filters}
          categories={categories}
          brands={brands}
          resultCount={products.length}
        />
        <h1 className="text-xl font-semibold">
          {filters.search ? `نتائج البحث عن "${filters.search}"` : "كل المنتجات"}
        </h1>
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
                  className="inline-flex h-11 items-center justify-center rounded-lg bg-[var(--store-primary)] px-4 text-sm font-semibold text-white transition hover:bg-[var(--store-primary-strong)] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-emerald-200"
                >
                  مسح الفلاتر
                </Link>
              </div>
            )}
          </div>
        ) : (
          <ProductGrid
            products={products}
            pagination={{
              nextCursor: productPagination.nextCursor,
              hasMore: productPagination.hasMore,
              query: {
                limit: STORE_PRODUCT_PAGE_SIZE,
                search: filters.search,
                category: filters.category,
                brand: filters.brand,
                minPrice: filters.minPrice,
                maxPrice: filters.maxPrice,
                inStock: filters.inStock,
              },
            }}
          />
        )}
      </div>
      <BottomNavigation />
    </main>
  );
}
