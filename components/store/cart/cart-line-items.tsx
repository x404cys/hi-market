"use client";

import { Minus, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { StoreProductImage } from "@/components/store/shared/product-image";
import type { CartItem } from "@/features/cart/types";
import { setCartItemQuantity } from "@/features/cart/store";
import {
  formatIqd,
  formatQuantity,
  productUnitLabels,
} from "@/lib/products/product-format";

export function CartLineItems({
  items,
  compact = false,
}: {
  items: CartItem[];
  compact?: boolean;
}) {
  return (
    <div className={compact ? "space-y-2" : "space-y-3"}>
      {items.map((item) => (
        <CartLineItem key={item.productId} item={item} compact={compact} />
      ))}
    </div>
  );
}

export function CartLineItem({
  item,
  compact = false,
}: {
  item: CartItem;
  compact?: boolean;
}) {
  const step = Number(item.orderStep || item.minOrderQty || 1);

  return (
    <article className="grid grid-cols-[64px_minmax(0,1fr)_auto] gap-3 rounded-lg border border-[var(--store-border)] bg-white p-3">
      <Link
        href={`/products/${item.slug}`}
        className="relative size-16 overflow-hidden rounded-lg bg-[var(--store-primary-soft)]"
      >
        <StoreProductImage src={item.image} alt={item.name} sizes="64px" />
      </Link>

      <div className="min-w-0">
        <Link
          href={`/products/${item.slug}`}
          className="block truncate text-sm font-semibold text-[var(--store-text)]"
        >
          {item.name}
        </Link>
        <p className="mt-1 text-xs text-[var(--store-text-muted)]">
          {item.unitValue
            ? `${item.unitValue} ${productUnitLabels[item.unit]}`
            : productUnitLabels[item.unit]}
        </p>
        <p className="mt-2 text-sm font-semibold text-[var(--store-text)]">
          {formatIqd(item.price)}
        </p>
      </div>

      <div className="flex flex-col items-end justify-between gap-3">
        <button
          type="button"
          onClick={() => setCartItemQuantity(item.productId, 0)}
          className="flex size-10 items-center justify-center rounded-lg text-[var(--store-muted)] transition hover:bg-red-50 hover:text-red-500 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-red-100"
          aria-label={`حذف ${item.name} من السلة`}
        >
          <Trash2 className="size-4" />
        </button>

        <CartQuantityControls
          productId={item.productId}
          quantity={item.quantity}
          step={Number.isFinite(step) && step > 0 ? step : 1}
          compact={compact}
        />
      </div>
    </article>
  );
}

export function CartQuantityControls({
  productId,
  quantity,
  step,
  compact = false,
}: {
  productId: string;
  quantity: number;
  step: number;
  compact?: boolean;
}) {
  return (
    <div className="flex items-center rounded-lg border border-[var(--store-border)] bg-white">
      <button
        type="button"
        onClick={() => setCartItemQuantity(productId, quantity - step)}
        className={`${compact ? "size-9" : "size-10"} flex items-center justify-center rounded-r-lg text-[var(--store-text)] transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-emerald-100`}
        aria-label="تقليل الكمية"
      >
        <Minus className="size-4" />
      </button>
      <span
        className={`${compact ? "min-w-8 text-xs" : "min-w-10 text-sm"} text-center font-semibold text-[var(--store-text)]`}
      >
        {formatQuantity(quantity)}
      </span>
      <button
        type="button"
        onClick={() => setCartItemQuantity(productId, quantity + step)}
        className={`${compact ? "size-9" : "size-10"} flex items-center justify-center rounded-l-lg bg-[var(--store-primary)] text-white transition hover:bg-[var(--store-primary-strong)] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-emerald-100`}
        aria-label="زيادة الكمية"
      >
        <Plus className="size-4" />
      </button>
    </div>
  );
}
