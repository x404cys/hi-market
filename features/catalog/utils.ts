import { productUnitLabels } from "@/lib/products/product-format";
import { NEW_PRODUCT_DAYS } from "@/features/catalog/constants";
import type { StoreProduct, StoreProductDetail } from "@/features/catalog/types";

export function getProductImages(product: StoreProductDetail) {
  return [
    ...(product.image ? [product.image] : []),
    ...product.images
      .map((image) => image.url)
      .filter((url) => url && url !== product.image),
  ];
}

export function getDiscountPercent(product: StoreProduct) {
  if (!product.comparePrice) return null;

  const price = Number(product.price);
  const comparePrice = Number(product.comparePrice);

  if (!Number.isFinite(price) || !Number.isFinite(comparePrice)) return null;
  if (comparePrice <= price || comparePrice <= 0) return null;

  return Math.round(((comparePrice - price) / comparePrice) * 100);
}

export function isNewProduct(product: Pick<StoreProduct, "createdAt">) {
  const createdAt = new Date(product.createdAt).getTime();

  if (!Number.isFinite(createdAt)) return false;

  const newThresholdMs = NEW_PRODUCT_DAYS * 24 * 60 * 60 * 1000;

  return createdAt >= Date.now() - newThresholdMs;
}

export function getUnitText(product: StoreProduct) {
  const unitLabel = productUnitLabels[product.unit];

  if (product.unitValue) {
    return `${formatCompactNumber(product.unitValue)} ${unitLabel}`;
  }

  if (product.isWeighted) {
    return unitLabel;
  }

  return unitLabel;
}

export function getQuantityStep(product: StoreProduct) {
  const parsed = Number(product.orderStep || product.minOrderQty || "1");

  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

export function getInitialQuantity(product: StoreProduct) {
  const parsed = Number(product.minOrderQty || "1");

  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

export function formatQuantityLabel(product: StoreProduct, quantity: number) {
  const formattedQuantity = formatCompactNumber(quantity.toString());
  const unitLabel = productUnitLabels[product.unit];

  if (product.unit === "PIECE") {
    return formattedQuantity;
  }

  return `${formattedQuantity} ${unitLabel}`;
}

export function getStorefrontStockState(
  product: Pick<
    StoreProduct,
    "allowBackorder" | "lowStockAt" | "stock" | "trackInventory"
  >,
) {
  if (!product.trackInventory || product.allowBackorder) {
    return {
      purchasable: true,
      showLowStock: false,
      showOutOfStock: false,
      label: undefined,
    };
  }

  const stockValue = Number(product.stock);
  const lowStockValue = Number(product.lowStockAt);
  const stock = Number.isFinite(stockValue) ? stockValue : 0;
  const lowStockAt = Number.isFinite(lowStockValue) ? lowStockValue : 0;

  if (stock <= 0) {
    return {
      purchasable: false,
      showLowStock: false,
      showOutOfStock: true,
      label: "نفد من المخزون",
    };
  }

  if (lowStockAt > 0 && stock <= lowStockAt) {
    return {
      purchasable: true,
      showLowStock: true,
      showOutOfStock: false,
      label: "مخزون منخفض",
    };
  }

  return {
    purchasable: true,
    showLowStock: false,
    showOutOfStock: false,
    label: undefined,
  };
}

function formatCompactNumber(value: string) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) return value;

  return new Intl.NumberFormat("ar-IQ", {
    maximumFractionDigits: 3,
  }).format(numericValue);
}
