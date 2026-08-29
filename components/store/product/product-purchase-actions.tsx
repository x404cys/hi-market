"use client";

import Link from "next/link";
import { Check, ShoppingBag } from "lucide-react";
import { useMemo, useState } from "react";
import { QuantitySelector } from "@/components/store/product/quantity-selector";
import type { StoreProduct } from "@/features/catalog/types";
import { addProductToCart } from "@/features/cart/store";
import { getInitialQuantity } from "@/features/catalog/utils";
import { formatIqd } from "@/lib/products/product-format";

export function ProductPurchaseActions({
  product,
  mode = "page",
  onAdded,
}: {
  product: StoreProduct;
  mode?: "page" | "sheet";
  onAdded?: () => void;
}) {
  const [quantity, setQuantity] = useState(() => getInitialQuantity(product));
  const [added, setAdded] = useState(false);
  const total = useMemo(() => Number(product.price) * quantity, [product.price, quantity]);
  const unavailable =
    product.trackInventory && !product.allowBackorder && Number(product.stock) <= 0;

  function addToCart() {
    if (unavailable) return;
    addProductToCart(product, quantity);
    setAdded(true);
    onAdded?.();
    window.setTimeout(() => setAdded(false), 1800);
  }

  const content = (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs text-[var(--store-text-muted)]">الكمية</p>
          <QuantitySelector product={product} quantity={quantity} onChange={setQuantity} />
        </div>
        <div className="text-left">
          <p className="text-xs text-[var(--store-text-muted)]">السعر الإجمالي</p>
          <p className="mt-1 text-base font-semibold text-[var(--store-text)]">
            {formatIqd(total)}
          </p>
        </div>
      </div>

      {added && (
        <div
          className="flex items-center justify-between gap-3 rounded-lg border border-emerald-100 bg-[var(--store-primary-soft)] px-3 py-2 text-xs text-[var(--store-primary-strong)]"
          aria-live="polite"
        >
          <span className="inline-flex items-center gap-1.5 font-medium">
            <Check className="size-4" />
            تمت إضافة المنتج إلى السلة
          </span>
          <Link href="/cart" className="font-semibold">
            عرض السلة
          </Link>
        </div>
      )}

      <button
        type="button"
        onClick={addToCart}
        disabled={unavailable}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[var(--store-primary)] text-sm font-semibold text-white transition hover:bg-[var(--store-primary-strong)] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-emerald-200 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
      >
        <ShoppingBag className="size-4" />
        {unavailable ? "غير متوفر حالياً" : "أضف إلى السلة"}
      </button>
    </div>
  );

  if (mode === "sheet") {
    return (
      <div className="sticky bottom-0 border-t border-[var(--store-border)] bg-white px-5 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-3">
        {content}
      </div>
    );
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--store-border)] bg-white px-5 pb-[calc(env(safe-area-inset-bottom)+0.8rem)] pt-3 md:static md:z-auto md:border md:p-4">
      <div className="mx-auto max-w-md md:max-w-none">{content}</div>
    </div>
  );
}
