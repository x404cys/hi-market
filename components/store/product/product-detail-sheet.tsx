"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ProductDetailContent } from "@/components/store/product/product-detail-content";
import type { StoreProduct, StoreProductDetail } from "@/features/catalog/types";

export function ProductDetailSheet({
  product,
  open,
  onOpenChange,
}: {
  product: StoreProduct | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [detailProduct, setDetailProduct] = useState<StoreProductDetail | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!open || !product) return;

    let ignore = false;
    const productSlug = product.slug;

    async function loadProductDetails() {
      setDetailProduct(null);
      setIsLoading(true);
      setHasError(false);

      try {
        const response = await fetch(
          `/api/store/products/${encodeURIComponent(productSlug)}`,
          {
            headers: { Accept: "application/json" },
          },
        );

        if (!response.ok) throw new Error("Failed to load product");

        const payload = (await response.json()) as {
          success: boolean;
          data?: StoreProductDetail;
        };

        if (!payload.success || !payload.data) {
          throw new Error("Invalid product response");
        }

        if (!ignore) setDetailProduct(payload.data);
      } catch {
        if (!ignore) setHasError(true);
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }

    void loadProductDetails();

    return () => {
      ignore = true;
    };
  }, [open, product]);

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
        {isLoading && <ProductDetailSheetSkeleton />}
        {!isLoading && hasError && product && (
          <div className="space-y-3 px-5 py-8 text-center">
            <p className="text-sm font-semibold text-[var(--store-text)]">
              تعذر تحميل تفاصيل المنتج
            </p>
            <p className="text-xs text-[var(--store-text-muted)]">
              افتح صفحة المنتج أو حاول مرة أخرى.
            </p>
            <Link
              href={`/products/${product.slug}`}
              onClick={() => onOpenChange(false)}
              className="inline-flex h-10 items-center justify-center rounded-lg bg-[var(--store-primary)] px-4 text-xs font-semibold text-white"
            >
              فتح صفحة المنتج
            </Link>
          </div>
        )}
        {!isLoading && !hasError && detailProduct && (
          <ProductDetailContent product={detailProduct} mode="sheet" />
        )}
      </SheetContent>
    </Sheet>
  );
}

function ProductDetailSheetSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="bg-[#f7f8f8] px-5 pb-4 pt-2">
        <div className="mx-auto aspect-square max-w-[280px] animate-pulse rounded-lg bg-slate-100" />
      </div>
      <div className="space-y-4 px-5 py-5">
        <div className="h-3 w-24 animate-pulse rounded bg-slate-100" />
        <div className="h-6 w-48 animate-pulse rounded bg-slate-100" />
        <div className="h-5 w-28 animate-pulse rounded bg-slate-100" />
        <div className="grid grid-cols-2 gap-2">
          <div className="h-14 animate-pulse rounded-lg bg-slate-100" />
          <div className="h-14 animate-pulse rounded-lg bg-slate-100" />
        </div>
        <div className="h-20 animate-pulse rounded-lg bg-slate-100" />
      </div>
    </div>
  );
}
