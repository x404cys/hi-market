export type StorefrontFilters = {
  search: string;
  category: string;
  brand: string;
  minPrice: string;
  maxPrice: string;
  inStock: boolean;
};

export function normalizeStorefrontFilters(
  params: Record<string, string | string[] | undefined>,
): StorefrontFilters {
  return {
    search: getStringParam(params.search),
    category: getStringParam(params.category),
    brand: getStringParam(params.brand),
    minPrice: normalizePriceParam(params.minPrice),
    maxPrice: normalizePriceParam(params.maxPrice),
    inStock: getStringParam(params.inStock) === "true",
  };
}

export function hasStorefrontFilters(filters: StorefrontFilters) {
  return Boolean(
    filters.search ||
      filters.category ||
      filters.brand ||
      filters.minPrice ||
      filters.maxPrice ||
      filters.inStock,
  );
}

function getStringParam(value: string | string[] | undefined) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizePriceParam(value: string | string[] | undefined) {
  const rawValue = getStringParam(value);
  if (!rawValue) return "";

  const numericValue = Number(rawValue);
  if (!Number.isFinite(numericValue) || numericValue < 0) return "";

  return numericValue.toString();
}
