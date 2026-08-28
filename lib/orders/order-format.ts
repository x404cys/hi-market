import type { OrderStatus } from "@/app/generated/prisma";

export const orderStatusLabels: Record<OrderStatus, string> = {
  PENDING: "جديد",
  CONFIRMED: "مؤكد",
  PREPARING: "قيد التجهيز",
  READY: "جاهز",
  OUT_FOR_DELIVERY: "قيد التوصيل",
  DELIVERED: "تم التوصيل",
  CANCELLED: "ملغي",
};

export const orderStatusDescriptions: Record<OrderStatus, string> = {
  PENDING: "بانتظار التأكيد",
  CONFIRMED: "تم تأكيد الطلب",
  PREPARING: "يتم تجهيز الطلب",
  READY: "جاهز للتسليم",
  OUT_FOR_DELIVERY: "في الطريق للعميل",
  DELIVERED: "مكتمل",
  CANCELLED: "ملغي",
};

export const operationalOrderStatuses = [
  "PENDING",
  "CONFIRMED",
  "PREPARING",
  "READY",
  "OUT_FOR_DELIVERY",
] as const satisfies readonly OrderStatus[];

export const revenueOrderStatuses = [
  "DELIVERED",
] as const satisfies readonly OrderStatus[];

export const orderStatusOptions = [
  "PENDING",
  "CONFIRMED",
  "PREPARING",
  "READY",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
] as const satisfies readonly OrderStatus[];

export const orderStatusTone: Record<OrderStatus, string> = {
  PENDING: "border-sky-200 bg-sky-50 text-sky-700",
  CONFIRMED: "border-indigo-200 bg-indigo-50 text-indigo-700",
  PREPARING: "border-amber-200 bg-amber-50 text-amber-700",
  READY: "border-emerald-200 bg-emerald-50 text-emerald-700",
  OUT_FOR_DELIVERY: "border-violet-200 bg-violet-50 text-violet-700",
  DELIVERED: "border-slate-200 bg-slate-50 text-slate-700",
  CANCELLED: "border-red-200 bg-red-50 text-red-700",
};

export function formatOrderDate(value: string | Date) {
  return new Intl.DateTimeFormat("ar-IQ", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

export function formatOrderTime(value: string | Date) {
  return new Intl.DateTimeFormat("ar-IQ", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function formatRelativeTime(value: string | Date) {
  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (!Number.isFinite(diffMs)) return formatOrderDate(value);
  if (diffMs < minute) return "الآن";
  if (diffMs < hour) {
    return `منذ ${Math.floor(diffMs / minute).toLocaleString("ar-IQ")} دقيقة`;
  }
  if (diffMs < day) {
    return `منذ ${Math.floor(diffMs / hour).toLocaleString("ar-IQ")} ساعة`;
  }
  if (diffMs < 7 * day) {
    return `منذ ${Math.floor(diffMs / day).toLocaleString("ar-IQ")} يوم`;
  }

  return formatOrderDate(value);
}

export function formatOrderAddress(order: {
  governorate: string | null;
  city: string | null;
  area: string | null;
  deliveryZoneName?: string | null;
  address: string;
}) {
  return [
    order.governorate,
    order.city,
    order.area ?? order.deliveryZoneName,
    order.address,
  ]
    .filter(Boolean)
    .join(" - ");
}
