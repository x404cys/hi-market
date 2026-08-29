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
    <div className="flex h-10 items-center gap-2">
      <button
        type="button"
        className="flex size-10 items-center justify-center rounded-lg border border-[var(--store-border)] bg-white text-[var(--store-text)] transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-emerald-100"
        onClick={() => update(quantity - step)}
        aria-label="تقليل الكمية"
      >
        <Minus className="size-4" />
      </button>
      <span className="min-w-14 text-center text-sm font-semibold text-[var(--store-text)]">
        {formatQuantityLabel(product, quantity)}
      </span>
      <button
        type="button"
        className="flex size-10 items-center justify-center rounded-lg bg-[var(--store-primary)] text-white transition hover:bg-[var(--store-primary-strong)] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-emerald-100"
        onClick={() => update(quantity + step)}
        aria-label="زيادة الكمية"
      >
        <Plus className="size-4" />
      </button>
    </div>
  );
}
