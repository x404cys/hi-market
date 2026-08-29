import type { CategoryStatus } from "@/lib/categories/category-types";

export const categoryStatusLabels: Record<CategoryStatus, string> = {
  ACTIVE: "نشط",
  INACTIVE: "غير نشط",
};

export const categoryStatusTone: Record<CategoryStatus, string> = {
  ACTIVE: "border-emerald-100 bg-emerald-50 text-emerald-700",
  INACTIVE: "border-slate-200 bg-slate-50 text-slate-600",
};

export function getCategoryStatus(isActive: boolean): CategoryStatus {
  return isActive ? "ACTIVE" : "INACTIVE";
}

export function formatCategoryDate(value: string | null) {
  if (!value) return "غير محدد";

  return new Intl.DateTimeFormat("ar-IQ", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
