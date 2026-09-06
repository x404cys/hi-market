import { requirePagePermission } from "@/lib/auth/guards";
import { QuickPriceEditor } from "@/components/products/quick-price-editor";

export default async function PricesPage() {
  await requirePagePermission("products.update");
  return <QuickPriceEditor />;
}
