"use client";

import { ShoppingBag } from "lucide-react";
import { useState } from "react";
import { QuantitySelector } from "@/components/store/product/quantity-selector";
import type { StoreProduct } from "@/features/catalog/types";
import { addProductToCart } from "@/features/cart/store";
import { formatIqd } from "@/lib/products/product-format";
import { getInitialQuantity } from "@/features/catalog/utils";

export function ProductDetailActions({ product }: { product: StoreProduct }) {
  const [quantity, setQuantity] = useState(() => getInitialQuantity(product));
  const total = Number(product.price) * quantity;

  function addToCart() {
    addProductToCart(product, quantity);
  }

  return (
    <>
      <QuantitySelector
        product={product}
        quantity={quantity}
        onChange={setQuantity}
      />
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--store-border)] bg-white px-5 pb-[calc(env(safe-area-inset-bottom)+0.8rem)] pt-3 shadow-[0_-10px_24px_rgba(15,23,42,0.08)]">
        <div className="mx-auto flex max-w-md items-center gap-4 md:max-w-3xl">
          <div className="min-w-[86px]">
            <p className="text-[11px] text-[var(--store-text-muted)]">السعر الإجمالي</p>
            <p className="mt-0.5 text-sm font-bold text-[var(--store-text)]">
              {formatIqd(total)}
            </p>
          </div>
          <button
            type="button"
            onClick={addToCart}
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-[12px] bg-[var(--store-primary)] text-sm font-bold text-white shadow-[0_10px_22px_rgba(16,185,129,0.22)] transition hover:bg-[var(--store-primary-strong)] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-emerald-200"
          >
            <ShoppingBag className="size-4" />
            إضافة إلى السلة
          </button>
        </div>
      </div>
    </>
  );
}
