import { handleRouteError, readJsonBody, successResponse } from "@/lib/api-response";
import { requirePermission } from "@/lib/auth/guards";
import { createProduct } from "@/lib/services/product.service";
import { revalidateStorefrontProducts } from "@/lib/services/storefront-cache.service";
import { createProductSchema } from "@/lib/validations/product";
import type { NextRequest } from "next/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    await requirePermission("products.create");
    const body = await readJsonBody(request);
    const input = createProductSchema.parse(body);
    const product = await createProduct(input);
    revalidateStorefrontProducts([
      `/products/${product.slug}`,
      `/categories/${product.category.slug}`,
    ]);

    return successResponse(product, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
