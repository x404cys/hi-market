import { revalidatePath, revalidateTag } from "next/cache";
import {
  STORE_BRANDS_CACHE_TAG,
  STORE_CATEGORIES_CACHE_TAG,
  STORE_PRODUCTS_CACHE_TAG,
} from "@/features/catalog/constants";

export function revalidateStorefrontProducts(paths: string[] = []) {
  revalidateTag(STORE_PRODUCTS_CACHE_TAG, { expire: 0 });
  revalidatePath("/");
  revalidatePath("/products");

  for (const path of paths) {
    revalidatePath(path);
  }
}

export function revalidateStorefrontCategories(paths: string[] = []) {
  revalidateTag(STORE_CATEGORIES_CACHE_TAG, { expire: 0 });
  revalidateStorefrontProducts(paths);
  revalidatePath("/categories");
}

export function revalidateStorefrontBrands() {
  revalidateTag(STORE_BRANDS_CACHE_TAG, { expire: 0 });
  revalidateStorefrontProducts();
}
