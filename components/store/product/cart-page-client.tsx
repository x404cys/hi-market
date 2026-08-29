"use client";

import { ShoppingBag } from "lucide-react";
import Link from "next/link";
import { CartLineItems } from "@/components/store/cart/cart-line-items";
import { BottomNavigation } from "@/components/store/layout/bottom-navigation";
import {
  clearCart,
  useCartState,
  useCartSummary,
} from "@/features/cart/store";
import { formatIqd } from "@/lib/products/product-format";

export function CartPageClient() {
  const cart = useCartState();
  const { total } = useCartSummary();

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[var(--store-background)] px-5 pb-28 pt-5 text-[var(--store-text)]"
    >
      <div className="mx-auto max-w-md md:max-w-5xl">
        <header className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs text-[var(--store-text-muted)]">راجع المنتجات قبل الطلب</p>
            <h1 className="mt-1 text-xl font-semibold">السلة</h1>
          </div>
          {cart.items.length > 0 && (
            <button
              type="button"
              onClick={clearCart}
              className="h-10 rounded-lg px-3 text-xs font-semibold text-red-500 transition hover:bg-red-50 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-red-100"
            >
              تفريغ السلة
            </button>
          )}
        </header>

        {cart.items.length === 0 ? (
          <section className="mt-8 rounded-xl border border-[var(--store-border)] bg-white px-5 py-10 text-center">
            <ShoppingBag className="mx-auto size-9 text-[var(--store-muted)]" />
            <p className="mt-3 text-sm font-semibold">السلة فارغة</p>
            <p className="mx-auto mt-1 max-w-xs text-xs leading-5 text-[var(--store-text-muted)]">
              أضف بعض المنتجات لتبدأ طلبك.
            </p>
            <Link
              href="/"
              className="mt-5 inline-flex h-11 items-center justify-center rounded-lg bg-[var(--store-primary)] px-5 text-sm font-semibold text-white transition hover:bg-[var(--store-primary-strong)] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-emerald-200"
            >
              تصفح المنتجات
            </Link>
          </section>
        ) : (
          <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
            <CartLineItems items={cart.items} />

            <aside className="rounded-xl border border-[var(--store-border)] bg-white p-4 lg:sticky lg:top-5 lg:self-start">
              <p className="text-sm font-semibold">ملخص السلة</p>
              <div className="mt-4 flex items-center justify-between border-t border-[var(--store-border)] pt-4">
                <span className="text-sm text-[var(--store-text-muted)]">المجموع</span>
                <strong className="text-lg font-semibold">{formatIqd(total)}</strong>
              </div>
              <p className="mt-2 text-xs leading-5 text-[var(--store-text-muted)]">
                رسوم التوصيل والخصومات يتم احتسابها عند إتمام الطلب.
              </p>
              <Link
                href="/checkout"
                className="mt-4 flex h-12 w-full items-center justify-center rounded-lg bg-[var(--store-primary)] text-sm font-semibold text-white transition hover:bg-[var(--store-primary-strong)] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-emerald-200"
              >
                إتمام الطلب
              </Link>
            </aside>
          </div>
        )}
      </div>
      <BottomNavigation />
    </main>
  );
}
