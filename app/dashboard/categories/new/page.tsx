import { CategoryForm } from "@/components/dashboard/categories/category-form";
import { listDashboardCategories } from "@/lib/services/category.service";

export const dynamic = "force-dynamic";

export default async function NewCategoryPage() {
  const parentCategories = await listDashboardCategories()
    .then((result) => result.data)
    .catch(() => []);

  return <CategoryForm mode="create" parentCategories={parentCategories} />;
}
