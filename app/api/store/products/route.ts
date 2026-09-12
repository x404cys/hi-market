import { z } from "zod";
import type { NextRequest } from "next/server";
import { handleRouteError, successResponse } from "@/lib/api-response";
import {
  STORE_PRODUCT_MAX_PAGE_SIZE,
  STORE_PRODUCT_PAGE_SIZE,
} from "@/features/catalog/constants";
import {
  getStoreProducts,
  type StoreProductSort,
} from "@/lib/services/product.service";

export const runtime = "nodejs";

const storeProductSortValues = ["newest", "price-asc", "price-desc"] as const;

const storeProductsQuerySchema = z
  .object({
    cursor: z.string().trim().uuid().optional(),
    limit: z.coerce
      .number()
      .int()
      .min(1)
      .max(STORE_PRODUCT_MAX_PAGE_SIZE)
      .default(STORE_PRODUCT_PAGE_SIZE),
    search: z
      .string()
      .trim()
      .optional()
      .transform((value) => value || undefined),
    category: z
      .string()
      .trim()
      .optional()
      .transform((value) => value || undefined),
    brand: z
      .string()
      .trim()
      .optional()
      .transform((value) => value || undefined),
    minPrice: z
      .string()
      .trim()
      .optional()
      .transform((value) => value || undefined),
    maxPrice: z
      .string()
      .trim()
      .optional()
      .transform((value) => value || undefined),
    inStock: z
      .enum(["true", "false"])
      .optional()
      .transform((value) => value === "true"),
    onOffer: z
      .enum(["true", "false"])
      .optional()
      .transform((value) => value === "true"),
    sort: z.enum(storeProductSortValues).default("newest"),
    ids: z
      .string()
      .trim()
      .optional()
      .transform((value) =>
        value
          ? Array.from(
              new Set(
                value
                  .split(",")
                  .map((id) => id.trim())
                  .filter(Boolean),
              ),
            ).slice(0, STORE_PRODUCT_MAX_PAGE_SIZE)
          : undefined,
      )
      .pipe(z.array(z.string().uuid()).optional()),
  })
  .strict();

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = storeProductsQuerySchema.parse({
      cursor: searchParams.get("cursor") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
      search: searchParams.get("search") ?? undefined,
      category: searchParams.get("category") ?? undefined,
      brand: searchParams.get("brand") ?? undefined,
      minPrice: searchParams.get("minPrice") ?? undefined,
      maxPrice: searchParams.get("maxPrice") ?? undefined,
      inStock: searchParams.get("inStock") ?? undefined,
      onOffer: searchParams.get("onOffer") ?? undefined,
      sort: searchParams.get("sort") ?? undefined,
      ids: searchParams.get("ids") ?? undefined,
    });
    const products = await getStoreProducts({
      cursor: query.cursor,
      limit: query.limit,
      search: query.search,
      categorySlug: query.category,
      brandSlug: query.brand,
      minPrice: query.minPrice,
      maxPrice: query.maxPrice,
      inStock: query.inStock,
      onOffer: query.onOffer,
      ids: query.ids,
      sort: query.sort as StoreProductSort,
    });

    return successResponse(products);
  } catch (error) {
    return handleRouteError(error, {
      route: "/api/store/products",
      method: "GET",
    });
  }
}
