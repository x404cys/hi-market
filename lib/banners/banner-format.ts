import type { BannerDto, BannerDisplayStatus } from "@/lib/banners/banner-types";

export const bannerDisplayStatusLabels: Record<BannerDisplayStatus, string> = {
  ACTIVE: "نشط",
  INACTIVE: "غير نشط",
  SCHEDULED: "مجدول",
  EXPIRED: "منتهي",
};

export const bannerStatusTone: Record<BannerDisplayStatus, string> = {
  ACTIVE: "border-emerald-100 bg-emerald-50 text-emerald-700",
  INACTIVE: "border-slate-200 bg-slate-50 text-slate-600",
  SCHEDULED: "border-amber-100 bg-amber-50 text-amber-700",
  EXPIRED: "border-red-100 bg-red-50 text-red-700",
};

export function formatBannerDate(value: string | null) {
  if (!value) return "غير محدد";

  return new Intl.DateTimeFormat("ar-IQ", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function formatBannerPeriod(banner: Pick<BannerDto, "startsAt" | "endsAt">) {
  if (!banner.startsAt && !banner.endsAt) return "دائماً";
  if (banner.startsAt && banner.endsAt) {
    return `${formatBannerDate(banner.startsAt)} - ${formatBannerDate(banner.endsAt)}`;
  }

  if (banner.startsAt) return `من ${formatBannerDate(banner.startsAt)}`;

  return `حتى ${formatBannerDate(banner.endsAt)}`;
}
