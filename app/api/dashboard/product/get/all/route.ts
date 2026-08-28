import { handleRouteError, paginatedResponse } from "@/lib/api-response";
import { listProducts } from "@/lib/services/product.service";

export const runtime = "nodejs";

export async function GET() {
  try {
    const result = await listProducts({
      page: 1,
      limit: 20,
      search: undefined,
      sortBy: "createdAt",
      order: "desc",
    });

    return paginatedResponse(result.data, result.pagination);
  } catch (error) {
    return handleRouteError(error);
  }
}
