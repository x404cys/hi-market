"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { CartLineItems } from "@/components/store/cart/cart-line-items";
import { useCartState, useCartSummary } from "@/features/cart/store";
import { formatIqd } from "@/lib/products/product-format";

export function CartSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const cart = useCartState();
  const { total, itemCount } = useCartSummary();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        dir="rtl"
        className="max-h-[88svh] gap-0 rounded-t-xl border-[var(--store-border)] bg-[var(--store-background)] p-0 md:hidden"
      >
        <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-slate-300" />
        <SheetHeader className="border-b border-[var(--store-border)] px-5 pb-4 pt-4">
          <SheetTitle className="flex items-center justify-between pl-9 text-base font-semibold">
            <span>السلة</span>
            {itemCount > 0 && (
              <span className="rounded-md bg-[var(--store-primary-soft)] px-2 py-1 text-xs text-[var(--store-primary-strong)]">
                {itemCount.toLocaleString("ar-IQ")} منتج
              </span>
            )}
          </SheetTitle>
        </SheetHeader>

        {cart.items.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <ShoppingBag className="mx-auto size-9 text-[var(--store-muted)]" />
            <p className="mt-3 text-sm font-semibold">السلة فارغة</p>
            <p className="mx-auto mt-1 max-w-xs text-xs leading-5 text-[var(--store-text-muted)]">
              أضف بعض المنتجات لتبدأ طلبك.
            </p>
            <Button
              asChild
              className="mt-5 h-11 rounded-lg bg-[var(--store-primary)] px-5 text-white hover:bg-[var(--store-primary-strong)]"
            >
              <Link href="/" onClick={() => onOpenChange(false)}>
                تصفح المنتجات
              </Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="overflow-y-auto px-5 py-4">
              <CartLineItems items={cart.items} compact />
            </div>
            <SheetFooter className="grid grid-cols-[1fr_1.5fr] items-center gap-3 border-t border-[var(--store-border)] bg-white px-5 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-3 sm:grid-cols-[1fr_1.5fr] sm:justify-normal">
              <div>
                <p className="text-xs text-[var(--store-text-muted)]">المجموع</p>
                <p className="mt-0.5 text-base font-semibold text-[var(--store-text)]">
                  {formatIqd(total)}
                </p>
              </div>
              <Button
                asChild
                className="h-12 rounded-lg bg-[var(--store-primary)] text-white hover:bg-[var(--store-primary-strong)]"
              >
                <Link href="/checkout" onClick={() => onOpenChange(false)}>
                  إتمام الطلب
                </Link>
              </Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
