import { handleRouteError, readJsonBody, successResponse } from "@/lib/api-response";
import { createProduct } from "@/lib/services/product.service";
import { createProductSchema } from "@/lib/validations/product";
import type { NextRequest } from "next/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await readJsonBody(request);
    const input = createProductSchema.parse(body);
    const product = await createProduct(input);

    return successResponse(product, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
