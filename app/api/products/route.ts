import {
  createProduct,
  listProducts,
} from "@/lib/services/product.service";
import {
  handleRouteError,
  paginatedResponse,
  readJsonBody,
  successResponse,
} from "@/lib/api-response";
import {
  createProductSchema,
  productQuerySchema,
} from "@/lib/validations/product";
import { requirePermission } from "@/lib/auth/guards";
import type { NextRequest } from "next/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    await requirePermission("products.create");
    const body = await readJsonBody(request);
    const input = createProductSchema.parse(body);
    const product = await createProduct(input);

    return successResponse(product, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function GET(request: NextRequest) {
  try {
    await requirePermission("products.read");
    const searchParams = request.nextUrl.searchParams;
    const query = productQuerySchema.parse({
      page: searchParams.get("page") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
      search: searchParams.get("search") ?? undefined,
      categoryId: searchParams.get("categoryId") ?? undefined,
      brandId: searchParams.get("brandId") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      stockStatus: searchParams.get("stockStatus") ?? undefined,
      sortBy: searchParams.get("sortBy") ?? undefined,
      order: searchParams.get("order") ?? undefined,
    });
    const result = await listProducts(query);

    return paginatedResponse(result.data, result.pagination, 200, {
      summary: result.summary,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
