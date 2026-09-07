import type { ProductStatus, ProductUnit } from "@/lib/prisma-client";

export function formatIqd(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") return "0 د.ع";

  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return `${value} د.ع`;

  return `${new Intl.NumberFormat("ar-IQ", {
    maximumFractionDigits: 0,
  }).format(numericValue)} د.ع`;
}

export function formatQuantity(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") return "0";

  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return String(value);

  return new Intl.NumberFormat("ar-IQ", {
    maximumFractionDigits: 3,
  }).format(numericValue);
}

export function createSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\u0621-\u064A]/g, (character) => arabicSlugMap[character] ?? "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const arabicSlugMap: Record<string, string> = {
  ء: "",
  آ: "a",
  أ: "a",
  إ: "i",
  ا: "a",
  ب: "b",
  ت: "t",
  ث: "th",
  ج: "j",
  ح: "h",
  خ: "kh",
  د: "d",
  ذ: "dh",
  ر: "r",
  ز: "z",
  س: "s",
  ش: "sh",
  ص: "s",
  ض: "d",
  ط: "t",
  ظ: "z",
  ع: "a",
  غ: "gh",
  ف: "f",
  ق: "q",
  ك: "k",
  ل: "l",
  م: "m",
  ن: "n",
  ه: "h",
  و: "w",
  ي: "y",
  ى: "a",
  ة: "h",
  ئ: "y",
  ؤ: "w",
};

export const productStatusLabels: Record<ProductStatus, string> = {
  ACTIVE: "نشط",
  DRAFT: "مسودة",
  INACTIVE: "مخفي",
  OUT_OF_STOCK: "نفد المخزون",
  ARCHIVED: "مؤرشف",
};

export const productUnitLabels: Record<ProductUnit, string> = {
  PIECE: "قطعة",
  KG: "كغم",
  GRAM: "غرام",
  LITER: "لتر",
  ML: "مل",
  PACK: "حزمة",
  BOX: "صندوق",
  BOTTLE: "قنينة",
  CAN: "علبة",
};

export function getStockLabel(stock: string, lowStockAt: string) {
  const stockValue = Number(stock);
  const lowStockValue = Number(lowStockAt);

  if (stockValue <= 0) {
    return {
      label: "نفد المخزون",
      tone: "danger" as const,
    };
  }

  if (lowStockValue > 0 && stockValue <= lowStockValue) {
    return {
      label: "مخزون منخفض",
      tone: "warning" as const,
    };
  }

  return {
    label: "متوفر",
    tone: "success" as const,
  };
}
