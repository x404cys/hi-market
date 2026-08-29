export const PRODUCT_IMAGE_PREFIX = "products/";
export const BANNER_IMAGE_PREFIX = "banners/";

export const MAX_PRODUCT_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
export const MAX_PRODUCT_IMAGE_ORIGINAL_SIZE_BYTES = 10 * 1024 * 1024;
export const PRODUCT_IMAGE_MAX_DIMENSION = 1600;
export const PRODUCT_IMAGE_WEBP_QUALITY = 0.82;
export const MAX_BANNER_IMAGE_SIZE_BYTES = MAX_PRODUCT_IMAGE_SIZE_BYTES;
export const MAX_BANNER_IMAGE_ORIGINAL_SIZE_BYTES =
  MAX_PRODUCT_IMAGE_ORIGINAL_SIZE_BYTES;
export const BANNER_IMAGE_MAX_DIMENSION = 1920;
export const BANNER_IMAGE_WEBP_QUALITY = 0.82;

export const productImageMimeTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
] as const;

const productImageKeyPattern =
  /^products\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(?:jpg|jpeg|png|webp|avif)$/i;
const bannerImageKeyPattern =
  /^banners\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(?:jpg|jpeg|png|webp|avif)$/i;

export type ProductImageMimeType =
  (typeof productImageMimeTypes)[number];

export function isProductImageMimeType(
  value: string,
): value is ProductImageMimeType {
  return productImageMimeTypes.includes(
    value as ProductImageMimeType,
  );
}

export function getExtensionForProductImageMimeType(
  fileType: ProductImageMimeType,
) {
  const extensions: Record<ProductImageMimeType, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/avif": "avif",
  };

  return extensions[fileType];
}

export function isValidProductImageKey(key: string) {
  return productImageKeyPattern.test(key);
}

export function isValidBannerImageKey(key: string) {
  return bannerImageKeyPattern.test(key);
}
 
export function getR2PublicBaseUrl() {
  return "https://pub-d3f32ffc98ac49418a360ec5172510f4.r2.dev";
}

export function getR2PublicUrl(key: string) {
  const baseUrl = getR2PublicBaseUrl();

  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_R2_PUBLIC_URL is not configured");
  }

  const normalizedKey = key.replace(/^\/+/, "");

  return `${baseUrl}/${normalizedKey}`;
}

export function getOwnedR2ObjectKeyFromUrl(value: string) {
  return getOwnedProductImageKeyFromUrl(value);
}

export function getR2KeyFromPublicUrl(value: string) {
  return getOwnedProductImageKeyFromUrl(value) ?? getOwnedBannerImageKeyFromUrl(value);
}

export function getOwnedProductImageKeyFromUrl(value: string) {
  const key = getOwnedR2KeyFromPublicUrl(value);

  return key && isValidProductImageKey(key) ? key : null;
}

export function getOwnedBannerImageKeyFromUrl(value: string) {
  const key = getOwnedR2KeyFromPublicUrl(value);

  return key && isValidBannerImageKey(key) ? key : null;
}

function getOwnedR2KeyFromPublicUrl(value: string) {
  const baseUrl = getR2PublicBaseUrl();

  if (!baseUrl) return null;

  try {
    const url = new URL(value);
    const base = new URL(baseUrl);

    if (
      url.origin !== base.origin ||
      url.search ||
      url.hash
    ) {
      return null;
    }

    const basePath = base.pathname.replace(/\/$/, "");
    const pathname = decodeURIComponent(url.pathname);

    if (basePath && pathname !== basePath && !pathname.startsWith(`${basePath}/`)) {
      return null;
    }

    const keyPath = basePath && pathname.startsWith(`${basePath}/`)
      ? pathname.slice(basePath.length + 1)
      : pathname.slice(1);

    return keyPath || null;
  } catch {
    return null;
  }
}

export function isOwnedR2PublicUrl(value: string) {
  return getOwnedR2ObjectKeyFromUrl(value) !== null;
}

export function isOwnedBannerR2PublicUrl(value: string) {
  return getOwnedBannerImageKeyFromUrl(value) !== null;
}
