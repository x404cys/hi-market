import Image from "next/image";
import Link from "next/link";
import { ImageIcon, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CategoryQuickActiveToggle,
  CategoryRowActions,
} from "@/components/dashboard/categories/category-list-actions";
import {
  categoryStatusLabels,
  categoryStatusTone,
  formatCategoryDate,
  getCategoryStatus,
} from "@/lib/categories/category-format";
import type { CategoryDto } from "@/lib/categories/category-types";
import { requirePagePermission } from "@/lib/auth/guards";
import { listDashboardCategories } from "@/lib/services/category.service";
import { categoryQuerySchema } from "@/lib/validations/category";

export const dynamic = "force-dynamic";

type CategoriesPageProps = {
  searchParams: Promise<{
    search?: string;
  }>;
};

export default async function DashboardCategoriesPage({
  searchParams,
}: CategoriesPageProps) {
  const params = await searchParams;
  const query = categoryQuerySchema.parse({
    search: params.search ?? undefined,
  });
  const user = await requirePagePermission("categories.read");
  const canManage = user.permissions.includes("categories.manage");
  const result = await listDashboardCategories(query).catch(() => null);

  if (!result) {
    return (
      <main dir="rtl" className="min-h-screen bg-[#f8fafc] px-4 py-6 text-slate-950">
        <div className="mx-auto max-w-7xl">
          <Card className="items-center rounded-lg border-slate-200 px-5 py-10 text-center shadow-none">
            <h1 className="text-xl font-semibold">تعذر تحميل الأصناف</h1>
            <p className="mt-2 text-sm text-slate-500">
              حدث خطأ أثناء جلب البيانات.
            </p>
            <Button asChild className="mt-5">
              <Link href="/dashboard/categories">إعادة المحاولة</Link>
            </Button>
          </Card>
        </div>
      </main>
    );
  }

  const { data: categories, summary } = result;
  const hasSearch = Boolean(query.search);

  return (
    <main dir="rtl" className="min-h-screen bg-[#f8fafc] px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-5">
        <header className="flex flex-col gap-3 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs text-slate-500">الكتالوج</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">الأصناف</h1>
            <p className="mt-1 text-sm text-slate-500">
              إدارة أصناف المنتجات وطريقة ظهورها في المتجر.
            </p>
          </div>
          {canManage && (
            <Button asChild className="bg-slate-950 text-white hover:bg-slate-900">
              <Link href="/dashboard/categories/new">
                <Plus className="size-4" />
                إضافة صنف
              </Link>
            </Button>
          )}
        </header>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard label="إجمالي الأصناف" value={summary.total} />
          <SummaryCard label="النشطة" value={summary.active} />
          <SummaryCard label="الأصناف المستخدمة" value={summary.used} />
          <SummaryCard label="بدون منتجات" value={summary.empty} />
        </section>

        <form className="relative max-w-md">
          <Search className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            name="search"
            defaultValue={query.search}
            placeholder="ابحث عن صنف..."
            className="h-10 w-full rounded-lg border border-slate-200 bg-white pr-9 pl-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-3 focus:ring-slate-200"
          />
        </form>

        {categories.length === 0 ? (
          <EmptyCategoriesState hasSearch={hasSearch} canManage={canManage} />
        ) : (
          <>
            <div className="hidden overflow-hidden rounded-lg border border-slate-200 bg-white md:block">
              <table className="w-full text-right text-sm">
                <thead className="bg-slate-50 text-xs text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">الصورة</th>
                    <th className="px-4 py-3 font-medium">اسم الصنف</th>
                    <th className="px-4 py-3 font-medium">Slug</th>
                    <th className="px-4 py-3 font-medium">عدد المنتجات</th>
                    <th className="px-4 py-3 font-medium">الحالة</th>
                    <th className="px-4 py-3 font-medium">الترتيب</th>
                    <th className="px-4 py-3 font-medium">آخر تعديل</th>
                    <th className="px-4 py-3 font-medium">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {categories.map((category) => (
                    <tr key={category.id} className="align-middle">
                      <td className="px-4 py-3">
                        <CategoryThumb category={category} />
                      </td>
                      <td className="max-w-56 px-4 py-3">
                        <p className="truncate font-semibold text-slate-950">
                          {category.name}
                        </p>
                        <p className="mt-1 truncate text-xs text-slate-500">
                          {category.parent ? `ضمن ${category.parent.name}` : "صنف رئيسي"}
                        </p>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-500" dir="ltr">
                        {category.slug}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {category.productCount.toLocaleString("ar-IQ")} منتج
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-2">
                          <CategoryStatusBadge category={category} />
                          <CategoryQuickActiveToggle
                            categoryId={category.id}
                            isActive={category.isActive}
                            canManage={canManage}
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3 font-semibold">
                        {category.sortOrder.toLocaleString("ar-IQ")}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">
                        {formatCategoryDate(category.updatedAt)}
                      </td>
                      <td className="px-4 py-3">
                        <CategoryRowActions category={category} canManage={canManage} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-3 md:hidden">
              {categories.map((category) => (
                <article
                  key={category.id}
                  className="rounded-lg border border-slate-200 bg-white p-3"
                >
                  <div className="flex items-start gap-3">
                    <CategoryThumb category={category} mobile />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h2 className="truncate text-sm font-semibold text-slate-950">
                            {category.name}
                          </h2>
                          <p className="mt-1 text-xs text-slate-500">
                            {category.productCount.toLocaleString("ar-IQ")} منتج
                          </p>
                        </div>
                        <CategoryStatusBadge category={category} />
                      </div>
                      <p className="mt-2 truncate font-mono text-xs text-slate-400" dir="ltr">
                        {category.slug}
                      </p>
                      <div className="mt-3 flex items-center justify-between gap-3">
                        <CategoryQuickActiveToggle
                          categoryId={category.id}
                          isActive={category.isActive}
                          canManage={canManage}
                        />
                        <CategoryRowActions category={category} canManage={canManage} />
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <Card className="rounded-lg border-slate-200 px-4 py-3 shadow-none">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-950">
        {value.toLocaleString("ar-IQ")}
      </p>
    </Card>
  );
}

function CategoryThumb({
  category,
  mobile,
}: {
  category: CategoryDto;
  mobile?: boolean;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-lg bg-slate-100 ${
        mobile ? "size-14" : "size-12"
      }`}
    >
      {category.image ? (
        <Image
          src={category.image}
          alt={category.name}
          fill
          sizes={mobile ? "56px" : "48px"}
          className="object-cover"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-slate-400">
          <ImageIcon className="size-5" />
        </div>
      )}
    </div>
  );
}

function CategoryStatusBadge({ category }: { category: CategoryDto }) {
  const status = getCategoryStatus(category.isActive);

  return (
    <Badge variant="outline" className={categoryStatusTone[status]}>
      {categoryStatusLabels[status]}
    </Badge>
  );
}

function EmptyCategoriesState({
  hasSearch,
  canManage,
}: {
  hasSearch: boolean;
  canManage: boolean;
}) {
  return (
    <Card className="items-center rounded-lg border-slate-200 px-5 py-12 text-center shadow-none">
      <ImageIcon className="size-10 text-slate-400" />
      <h2 className="mt-3 text-lg font-semibold">
        {hasSearch ? "لا توجد نتائج مطابقة" : "لا توجد أصناف بعد"}
      </h2>
      <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
        {hasSearch
          ? "جرّب تغيير عبارة البحث."
          : "أضف أول صنف مع صورة واضحة ليظهر في واجهة المتجر."}
      </p>
      {!hasSearch && canManage && (
        <Button asChild className="mt-5 bg-slate-950 text-white hover:bg-slate-900">
          <Link href="/dashboard/categories/new">
            <Plus className="size-4" />
            إضافة صنف
          </Link>
        </Button>
      )}
    </Card>
  );
}
