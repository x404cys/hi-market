import { connection } from "next/server";
import { BottomNavigation } from "@/components/store/layout/bottom-navigation";
import { CategoriesSection } from "@/components/store/home/categories-section";
import { EmptyState } from "@/components/store/shared/empty-state";
import { listCategoryOptions } from "@/lib/services/catalog-options.service";

export default async function CategoriesPage() {
  await connection();

  const categoriesResult = await Promise.allSettled([listCategoryOptions()]);
  const categories =
    categoriesResult[0].status === "fulfilled" ? categoriesResult[0].value : [];
  const hasError = categoriesResult[0].status === "rejected";

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[var(--store-background)] px-5 pb-24 pt-5 text-[var(--store-text)]"
    >
      <div className="mx-auto max-w-md space-y-5 md:max-w-6xl xl:max-w-7xl">
        <h1 className="text-xl font-semibold">التصنيفات</h1>
        {hasError ? (
          <EmptyState
            title="تعذر تحميل التصنيفات"
            description="تحقق من اتصال قاعدة البيانات ثم أعد المحاولة."
          />
        ) : categories.length === 0 ? (
          <EmptyState title="لا توجد تصنيفات متاحة حالياً" />
        ) : (
          <CategoriesSection categories={categories} maxItems={null} />
        )}
      </div>
      <BottomNavigation />
    </main>
  );
}
