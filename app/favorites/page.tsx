import { connection } from "next/server";
import { FavoritesPageClient } from "@/components/store/favorites/favorites-page-client";
import { listStoreProducts } from "@/lib/services/product.service";

export default async function FavoritesPage() {
  await connection();

  const productsResult = await listStoreProducts({ limit: 300 })
    .then((products) => ({ products, hasError: false }))
    .catch(() => ({ products: [], hasError: true }));

  return (
    <FavoritesPageClient
      products={productsResult.products}
      hasError={productsResult.hasError}
    />
  );
}
