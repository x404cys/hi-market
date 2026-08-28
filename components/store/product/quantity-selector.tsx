"use client";

import { Minus, Plus } from "lucide-react";
import type { StoreProduct } from "@/features/catalog/types";
import {
  formatQuantityLabel,
  getInitialQuantity,
  getQuantityStep,
} from "@/features/catalog/utils";

export function QuantitySelector({
  product,
  quantity,
  onChange,
}: {
  product: StoreProduct;
  quantity: number;
  onChange: (quantity: number) => void;
}) {
  const step = getQuantityStep(product);
  const min = getInitialQuantity(product);

  function update(nextQuantity: number) {
    onChange(Math.max(min, Math.round(nextQuantity * 1000) / 1000));
  }

  return (
    <div className="flex h-8 items-center gap-2">
      <button
        type="button"
        className="flex size-7 items-center justify-center rounded-[8px] bg-slate-100 text-[var(--store-text)]"
        onClick={() => update(quantity - step)}
        aria-label="تقليل الكمية"
      >
        <Minus className="size-3.5" />
      </button>
      <span className="min-w-12 text-center text-sm font-semibold text-[var(--store-text)]">
        {formatQuantityLabel(product, quantity)}
      </span>
      <button
        type="button"
        className="flex size-7 items-center justify-center rounded-[8px] bg-[var(--store-primary)] text-white"
        onClick={() => update(quantity + step)}
        aria-label="زيادة الكمية"
      >
        <Plus className="size-3.5" />
      </button>
    </div>
  );
}
