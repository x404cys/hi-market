import { ProductForm } from "@/components/products/product-form";
import { requirePagePermission } from "@/lib/auth/guards";

export default async function NewProductPage() {
  await requirePagePermission("products.create");

  return <ProductForm mode="create" />;
}
