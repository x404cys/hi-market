import {
  handleRouteError,
  readJsonBody,
  successResponse,
} from "@/lib/api-response";
import { revalidatePath } from "next/cache";
import {
  listCategoryOptions,
} from "@/lib/services/catalog-options.service";
import {
  createCategory,
  listDashboardCategories,
} from "@/lib/services/category.service";
import {
  categoryQuerySchema,
  createCategorySchema,
} from "@/lib/validations/category";
import { requirePermission } from "@/lib/auth/guards";
import type { NextRequest } from "next/server";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    if (request.nextUrl.searchParams.get("scope") === "dashboard") {
      await requirePermission("categories.read");
      const query = categoryQuerySchema.parse({
        search: request.nextUrl.searchParams.get("search") ?? undefined,
      });
      const result = await listDashboardCategories(query);

      return successResponse(result);
    }

    const categories = await listCategoryOptions();

    return successResponse(categories);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requirePermission("categories.manage");
    const body = await readJsonBody(request);
    const input = createCategorySchema.parse(body);
    const category = await createCategory(input);

    revalidatePath("/");
    revalidatePath("/categories");
    revalidatePath("/dashboard/categories");

    return successResponse(category, 201);
  } catch (error) {
    console.error("POST /api/categories failed:", error);
    return handleRouteError(error);
  }
}
