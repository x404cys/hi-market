import { revalidatePath } from "next/cache";
import type { NextRequest } from "next/server";
import {
  deleteCategory,
  getCategoryById,
  updateCategory,
} from "@/lib/services/category.service";
import {
  handleRouteError,
  readJsonBody,
  successResponse,
} from "@/lib/api-response";
import {
  categoryIdSchema,
  updateCategorySchema,
} from "@/lib/validations/category";
import { requirePermission } from "@/lib/auth/guards";

type CategoryRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export const runtime = "nodejs";

export async function GET(_request: NextRequest, context: CategoryRouteContext) {
  try {
    await requirePermission("categories.read");
    const { id } = await context.params;
    const categoryId = categoryIdSchema.parse(id);
    const category = await getCategoryById(categoryId);

    return successResponse(category);
  } catch (error) {
    return handleRouteError(error, {
      route: "/api/categories/[id]",
      method: "GET",
    });
  }
}

export async function PATCH(request: NextRequest, context: CategoryRouteContext) {
  try {
    await requirePermission("categories.manage");
    const { id } = await context.params;
    const categoryId = categoryIdSchema.parse(id);
    const body = await readJsonBody(request);
    const input = updateCategorySchema.parse(body);
    const category = await updateCategory(categoryId, input);

    revalidatePath("/");
    revalidatePath("/categories");
    revalidatePath(`/categories/${category.slug}`);
    revalidatePath("/dashboard/categories");
    revalidatePath(`/dashboard/categories/${categoryId}/edit`);

    return successResponse(category);
  } catch (error) {
    return handleRouteError(error, {
      route: "/api/categories/[id]",
      method: "PATCH",
    });
  }
}

export async function DELETE(_request: NextRequest, context: CategoryRouteContext) {
  try {
    await requirePermission("categories.manage");
    const { id } = await context.params;
    const categoryId = categoryIdSchema.parse(id);
    const category = await deleteCategory(categoryId);

    revalidatePath("/");
    revalidatePath("/categories");
    revalidatePath("/dashboard/categories");

    return successResponse(category);
  } catch (error) {
    return handleRouteError(error, {
      route: "/api/categories/[id]",
      method: "DELETE",
    });
  }
}
