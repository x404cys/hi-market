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
import { requirePermission } from "@/lib/auth/guards";
import type { NextRequest } from "next/server";

type ProductRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export const runtime = "nodejs";

export async function GET(_request: NextRequest, context: ProductRouteContext) {
  try {
    await requirePermission("products.read");
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
    await requirePermission("products.update");
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
    await requirePermission("products.delete");
    const { id } = await context.params;
    const productId = productIdSchema.parse(id);
    const product = await archiveProduct(productId);

    return successResponse(product);
  } catch (error) {
    return handleRouteError(error);
  }
}
