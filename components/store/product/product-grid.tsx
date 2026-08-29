"use client";

import { useState } from "react";
import { ProductCard } from "@/components/store/product/product-card";
import { ProductDetailSheet } from "@/components/store/product/product-detail-sheet";
import type { StoreProduct } from "@/features/catalog/types";

export function ProductGrid({
  products,
  compact = false,
}: {
  products: StoreProduct[];
  compact?: boolean;
}) {
  const [selectedProduct, setSelectedProduct] = useState<StoreProduct | null>(null);

  return (
    <>
      <div
        className={
          compact
            ? "-mx-1 flex gap-3 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            : "grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6"
        }
      >
        {products.map((product) => (
          <div key={product.id} className={compact ? "w-[144px] shrink-0 sm:w-[164px]" : ""}>
            <ProductCard product={product} onOpenProduct={setSelectedProduct} />
          </div>
        ))}
      </div>
      <ProductDetailSheet
        product={selectedProduct}
        open={Boolean(selectedProduct)}
        onOpenChange={(open) => {
          if (!open) setSelectedProduct(null);
        }}
      />
    </>
  );
}
