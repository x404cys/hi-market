import {
  archiveProduct,
  getProduct,
  updateProduct,
} from "@/lib/services/product.service";
import { handleRouteError, readJsonBody, successResponse } from "@/lib/api-response";
import {
  productIdSchema,
  updateProductSchema,
} from "@/lib/validations/product";
import type { NextRequest } from "next/server";

type ProductRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export const runtime = "nodejs";

export async function GET(_request: NextRequest, context: ProductRouteContext) {
  try {
    const { id } = await context.params;
    const productId = productIdSchema.parse(id);
    const product = await getProduct(productId);

    return successResponse(product);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: NextRequest, context: ProductRouteContext) {
  try {
    const { id } = await context.params;
    const productId = productIdSchema.parse(id);
    const body = await readJsonBody(request);
    const input = updateProductSchema.parse(body);
    const product = await updateProduct(productId, input);

    return successResponse(product);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  context: ProductRouteContext,
) {
  try {
    const { id } = await context.params;
    const productId = productIdSchema.parse(id);
    const product = await archiveProduct(productId);

    return successResponse(product);
  } catch (error) {
    return handleRouteError(error);
  }
}
