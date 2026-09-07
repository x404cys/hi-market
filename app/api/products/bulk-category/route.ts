import type { NextRequest } from "next/server";
import { requirePermission } from "@/lib/auth/guards";
import { handleRouteError, readJsonBody, successResponse } from "@/lib/api-response";
import { revalidateStorefrontProducts } from "@/lib/services/storefront-cache.service";
import { updateProductCategories } from "@/lib/services/product.service";
import { bulkCategorySchema } from "@/lib/validations/product";

export const runtime = "nodejs";

export async function PATCH(request: NextRequest) {
  try {
    await requirePermission("products.update");
    const input = bulkCategorySchema.parse(await readJsonBody(request));
    const { paths, ...result } = await updateProductCategories(input);

    revalidateStorefrontProducts(paths);

    return successResponse(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
