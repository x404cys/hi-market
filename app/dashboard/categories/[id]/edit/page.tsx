import { notFound } from "next/navigation";
import { ApiError } from "@/lib/api-response";
import { CategoryForm } from "@/components/dashboard/categories/category-form";
import { requirePagePermission } from "@/lib/auth/guards";
import {
  getCategoryById,
  listDashboardCategories,
} from "@/lib/services/category.service";
import { categoryIdSchema } from "@/lib/validations/category";

type EditCategoryPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function EditCategoryPage({ params }: EditCategoryPageProps) {
  await requirePagePermission("categories.manage");
  const { id } = await params;
  const categoryId = categoryIdSchema.parse(id);
  const [category, parentCategories] = await Promise.all([
    getCategoryById(categoryId).catch((error) => {
      if (error instanceof ApiError && error.status === 404) return null;
      throw error;
    }),
    listDashboardCategories()
      .then((result) => result.data)
      .catch(() => []),
  ]);

  if (!category) notFound();

  return (
    <CategoryForm
      mode="edit"
      initialData={category}
      parentCategories={parentCategories}
    />
  );
}
