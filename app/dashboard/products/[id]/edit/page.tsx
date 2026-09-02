import { ProductForm } from "@/components/products/product-form";
import { requirePagePermission } from "@/lib/auth/guards";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePagePermission("products.update");
  const { id } = await params;

  return <ProductForm mode="edit" productId={id} />;
}
