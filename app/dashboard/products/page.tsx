import { ProductManagementClient } from "@/components/products/product-management-client";
import { requirePagePermission } from "@/lib/auth/guards";

export default async function ProductsPage() {
  const user = await requirePagePermission("products.read");

  return (
    <ProductManagementClient
      canCreate={user.permissions.includes("products.create")}
      canUpdate={user.permissions.includes("products.update")}
      canDelete={user.permissions.includes("products.delete")}
    />
  );
}
