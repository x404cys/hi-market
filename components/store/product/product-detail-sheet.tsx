"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ProductDetailContent } from "@/components/store/product/product-detail-content";
import type { StoreProduct } from "@/features/catalog/types";

export function ProductDetailSheet({
  product,
  open,
  onOpenChange,
}: {
  product: StoreProduct | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Sheet open={open && Boolean(product)} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        dir="rtl"
        className="h-[92svh] max-h-[92svh] gap-0 overflow-hidden rounded-t-xl border-[var(--store-border)] bg-[var(--store-background)] p-0 md:hidden"
      >
        <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-slate-300" />
        <SheetHeader className="border-b border-[var(--store-border)] bg-white px-5 pb-3 pt-4">
          <SheetTitle className="pl-10 text-center text-sm font-semibold">
            تفاصيل المنتج
          </SheetTitle>
          {product && (
            <Link
              href={`/products/${product.slug}`}
              onClick={() => onOpenChange(false)}
              className="absolute right-5 top-4 inline-flex h-10 items-center gap-1 text-xs font-medium text-[var(--store-primary)]"
            >
              <ExternalLink className="size-3.5" />
              رابط المنتج
            </Link>
          )}
        </SheetHeader>
        {product && <ProductDetailContent product={product} mode="sheet" />}
      </SheetContent>
    </Sheet>
  );
}
