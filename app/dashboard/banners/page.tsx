import Image from "next/image";
import Link from "next/link";
import { ImageIcon, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  BannerQuickActiveToggle,
  BannerRowActions,
} from "@/components/dashboard/banners/banner-list-actions";
import { BannerStatusBadge } from "@/components/dashboard/banners/banner-status-badge";
import { formatBannerDate, formatBannerPeriod } from "@/lib/banners/banner-format";
import type { BannerDto } from "@/lib/banners/banner-types";
import { listBanners } from "@/lib/services/banner.service";

export const dynamic = "force-dynamic";

export default async function BannersPage() {
  const result = await listBanners().catch(() => null);

  if (!result) {
    return (
      <main dir="rtl" className="min-h-screen bg-[#f8fafc] px-4 py-6 text-slate-950">
        <div className="mx-auto max-w-7xl">
          <Card className="items-center rounded-lg border-slate-200 px-5 py-10 text-center shadow-none">
            <h1 className="text-xl font-semibold">تعذر تحميل البنرات</h1>
            <p className="mt-2 text-sm text-slate-500">
              حدث خطأ أثناء جلب البيانات.
            </p>
            <Button asChild className="mt-5">
              <Link href="/dashboard/banners">إعادة المحاولة</Link>
            </Button>
          </Card>
        </div>
      </main>
    );
  }

  const { data: banners, summary } = result;

  return (
    <main dir="rtl" className="min-h-screen bg-[#f8fafc] px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-5">
        <header className="flex flex-col gap-3 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs text-slate-500">واجهة المتجر</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">البنرات</h1>
            <p className="mt-1 text-sm text-slate-500">
              إدارة البنرات والعروض الظاهرة في واجهة المتجر.
            </p>
          </div>
          <Button asChild className="bg-slate-950 text-white hover:bg-slate-900">
            <Link href="/dashboard/banners/new">
              <Plus className="size-4" />
              إضافة بنر
            </Link>
          </Button>
        </header>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard label="إجمالي البنرات" value={summary.total} />
          <SummaryCard label="النشطة" value={summary.active} />
          <SummaryCard label="المجدولة" value={summary.scheduled} />
          <SummaryCard label="غير النشطة" value={summary.inactive} />
        </section>

        {banners.length === 0 ? (
          <EmptyBannersState />
        ) : (
          <>
            <div className="hidden overflow-hidden rounded-lg border border-slate-200 bg-white md:block">
              <table className="w-full text-right text-sm">
                <thead className="bg-slate-50 text-xs text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">المعاينة</th>
                    <th className="px-4 py-3 font-medium">العنوان</th>
                    <th className="px-4 py-3 font-medium">الحالة</th>
                    <th className="px-4 py-3 font-medium">الفترة</th>
                    <th className="px-4 py-3 font-medium">الترتيب</th>
                    <th className="px-4 py-3 font-medium">آخر تعديل</th>
                    <th className="px-4 py-3 font-medium">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {banners.map((banner) => (
                    <tr key={banner.id} className="align-middle">
                      <td className="px-4 py-3">
                        <BannerThumb banner={banner} />
                      </td>
                      <td className="max-w-64 px-4 py-3">
                        <p className="truncate font-semibold text-slate-950">
                          {banner.title || "بدون عنوان"}
                        </p>
                        <p className="mt-1 truncate text-xs text-slate-500">
                          {banner.description || "لا يوجد وصف"}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-2">
                          <BannerStatusBadge status={banner.displayStatus} />
                          <BannerQuickActiveToggle
                            bannerId={banner.id}
                            isActive={banner.isActive}
                          />
                        </div>
                      </td>
                      <td className="max-w-72 px-4 py-3 text-xs text-slate-600">
                        {formatBannerPeriod(banner)}
                      </td>
                      <td className="px-4 py-3 font-semibold">
                        {banner.sortOrder.toLocaleString("ar-IQ")}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">
                        {formatBannerDate(banner.updatedAt)}
                      </td>
                      <td className="px-4 py-3">
                        <BannerRowActions banner={banner} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-3 md:hidden">
              {banners.map((banner) => (
                <article
                  key={banner.id}
                  className="rounded-lg border border-slate-200 bg-white p-3"
                >
                  <BannerThumb banner={banner} mobile />
                  <div className="mt-3 space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="truncate text-sm font-semibold text-slate-950">
                          {banner.title || "بدون عنوان"}
                        </h2>
                        <p className="mt-1 text-xs text-slate-500">
                          ترتيب: {banner.sortOrder.toLocaleString("ar-IQ")}
                        </p>
                      </div>
                      <BannerStatusBadge status={banner.displayStatus} />
                    </div>
                    <p className="text-xs text-slate-500">{formatBannerPeriod(banner)}</p>
                    <BannerQuickActiveToggle
                      bannerId={banner.id}
                      isActive={banner.isActive}
                    />
                    <BannerRowActions banner={banner} />
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

function BannerThumb({ banner, mobile }: { banner: BannerDto; mobile?: boolean }) {
  return (
    <div
      className={`relative overflow-hidden rounded-md bg-slate-100 ${
        mobile ? "aspect-[16/7] w-full" : "h-14 w-28"
      }`}
    >
      {banner.image ? (
        <Image
          src={banner.image}
          alt={banner.title || "بنر"}
          fill
          sizes={mobile ? "100vw" : "112px"}
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

function EmptyBannersState() {
  return (
    <Card className="items-center rounded-lg border-slate-200 px-5 py-12 text-center shadow-none">
      <ImageIcon className="size-10 text-slate-400" />
      <h2 className="mt-3 text-lg font-semibold">لا توجد بنرات بعد</h2>
      <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
        أضف أول بنر لعرض العروض والإعلانات في واجهة المتجر.
      </p>
      <Button asChild className="mt-5 bg-slate-950 text-white hover:bg-slate-900">
        <Link href="/dashboard/banners/new">
          <Plus className="size-4" />
          إضافة بنر
        </Link>
      </Button>
    </Card>
  );
}
