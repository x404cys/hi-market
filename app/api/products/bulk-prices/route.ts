import type { NextRequest } from "next/server";
import { requirePermission } from "@/lib/auth/guards";
import { handleRouteError, paginatedResponse, readJsonBody, successResponse } from "@/lib/api-response";
import { bulkPricesSchema, priceQuerySchema } from "@/lib/validations/product-prices";
import { listProductPrices, updateProductPrices } from "@/lib/services/product-prices.service";
import { revalidateStorefrontProducts } from "@/lib/services/storefront-cache.service";

export const runtime = "nodejs";
export async function GET(request: NextRequest) {
  try {
    await requirePermission("products.update");
    const query = priceQuerySchema.parse(Object.fromEntries(request.nextUrl.searchParams));
    const result = await listProductPrices(query);
    return paginatedResponse(result.data, result.pagination);
  } catch (error) { return handleRouteError(error); }
}
export async function PATCH(request: NextRequest) {
  try {
    await requirePermission("products.update");
    const input = bulkPricesSchema.parse(await readJsonBody(request));
    const { paths, ...result } = await updateProductPrices(input);
    revalidateStorefrontProducts(paths);
    return successResponse(result);
  } catch (error) { return handleRouteError(error); }
}
