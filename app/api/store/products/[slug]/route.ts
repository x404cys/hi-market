import { z } from "zod";
import type { NextRequest } from "next/server";
import { ApiError, handleRouteError, successResponse } from "@/lib/api-response";
import { getStoreProductBySlug } from "@/lib/services/product.service";

type StoreProductRouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

export const runtime = "nodejs";

const productSlugSchema = z.string().trim().min(1).max(200);

export async function GET(
  _request: NextRequest,
  context: StoreProductRouteContext,
) {
  try {
    const { slug } = await context.params;
    const product = await getStoreProductBySlug(productSlugSchema.parse(slug));

    if (!product) throw new ApiError("Product not found", 404);

    return successResponse(product);
  } catch (error) {
    return handleRouteError(error, {
      route: "/api/store/products/[slug]",
      method: "GET",
    });
  }
}
