import { connection } from "next/server";
import { BottomNavigation } from "@/components/store/layout/bottom-navigation";
import { StoreHeader } from "@/components/store/layout/store-header";
import { ProductCard } from "@/components/store/product/product-card";
import { EmptyState } from "@/components/store/shared/empty-state";
import { listStoreProducts } from "@/lib/services/product.service";

type ProductsPageProps = {
  searchParams: Promise<{
    search?: string;
  }>;
};

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  await connection();

  const params = await searchParams;
  const search = typeof params.search === "string" ? params.search.trim() : "";
  const productsResult = await Promise.allSettled([
    listStoreProducts({
      search,
      limit: 30,
    }),
  ]);
  const products =
    productsResult[0].status === "fulfilled" ? productsResult[0].value : [];
  const hasError = productsResult[0].status === "rejected";

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[var(--store-background)] px-5 pb-24 pt-5 text-[var(--store-text)]"
    >
      <div className="mx-auto max-w-md space-y-5 md:max-w-5xl">
        <StoreHeader search={search} />
        <h1 className="text-xl font-bold">كل المنتجات</h1>
        {hasError ? (
          <EmptyState
            title="تعذر تحميل المنتجات"
            description="تحقق من اتصال قاعدة البيانات ثم أعد المحاولة."
          />
        ) : products.length === 0 ? (
          <EmptyState title="لا توجد منتجات مطابقة" />
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
