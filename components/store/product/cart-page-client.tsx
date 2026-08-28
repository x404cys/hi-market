"use client";

import { Minus, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { BottomNavigation } from "@/components/store/layout/bottom-navigation";
import { StoreProductImage } from "@/components/store/shared/product-image";
import {
  clearCart,
  setCartItemQuantity,
  useCartState,
  useCartSummary,
} from "@/features/cart/store";
import { formatIqd, productUnitLabels } from "@/lib/products/product-format";

export function CartPageClient() {
  const cart = useCartState();
  const { total } = useCartSummary();

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[var(--store-background)] px-5 pb-28 pt-5 text-[var(--store-text)]"
    >
      <div className="mx-auto max-w-md md:max-w-3xl">
        <header className="flex items-center justify-between">
          <h1 className="text-xl font-bold">السلة</h1>
          {cart.items.length > 0 && (
            <button
              type="button"
              onClick={clearCart}
              className="text-xs font-semibold text-red-500"
            >
              تفريغ السلة
            </button>
          )}
        </header>

        {cart.items.length === 0 ? (
          <section className="mt-8 rounded-[18px] border border-[var(--store-border)] bg-white px-5 py-10 text-center">
            <p className="text-sm font-bold">السلة فارغة</p>
            <p className="mt-1 text-xs text-[var(--store-text-muted)]">
              أضف المنتجات من الصفحة الرئيسية أو صفحة المنتج.
            </p>
            <Link
              href="/"
              className="mt-5 inline-flex h-10 items-center justify-center rounded-[10px] bg-[var(--store-primary)] px-4 text-sm font-bold text-white"
            >
              العودة للتسوق
            </Link>
          </section>
        ) : (
          <>
            <div className="mt-5 space-y-3">
              {cart.items.map((item) => (
                <article
                  key={item.productId}
                  className="flex gap-3 rounded-[16px] border border-[var(--store-border)] bg-white p-3"
                >
                  <Link
                    href={`/products/${item.slug}`}
                    className="relative size-20 shrink-0 overflow-hidden rounded-[14px] bg-[var(--store-primary-soft)]"
                  >
                    <StoreProductImage
                      src={item.image}
                      alt={item.name}
                      sizes="80px"
                    />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/products/${item.slug}`}
                      className="block truncate text-sm font-bold"
                    >
                      {item.name}
                    </Link>
                    <p className="mt-1 text-xs text-[var(--store-text-muted)]">
                      {item.unitValue
                        ? `${item.unitValue} ${productUnitLabels[item.unit]}`
                        : productUnitLabels[item.unit]}
                    </p>
                    <p className="mt-2 text-sm font-bold">{formatIqd(item.price)}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end justify-between">
                    <button
                      type="button"
                      onClick={() => setCartItemQuantity(item.productId, 0)}
                      className="text-[var(--store-muted)]"
                      aria-label="حذف المنتج من السلة"
                    >
                      <Trash2 className="size-4" />
                    </button>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setCartItemQuantity(
                            item.productId,
                            item.quantity - Number(item.orderStep || item.minOrderQty || 1),
                          )
                        }
                        className="flex size-7 items-center justify-center rounded-[8px] bg-slate-100"
                        aria-label="تقليل الكمية"
                      >
                        <Minus className="size-3.5" />
                      </button>
                      <span className="min-w-6 text-center text-sm font-bold">
                        {item.quantity.toLocaleString("ar-IQ")}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setCartItemQuantity(
                            item.productId,
                            item.quantity + Number(item.orderStep || item.minOrderQty || 1),
                          )
                        }
                        className="flex size-7 items-center justify-center rounded-[8px] bg-[var(--store-primary)] text-white"
                        aria-label="زيادة الكمية"
                      >
                        <Plus className="size-3.5" />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <div className="mt-5 rounded-[16px] border border-[var(--store-border)] bg-white px-4 py-3">
              <div className="mx-auto flex max-w-md items-center gap-4 md:max-w-3xl">
                <div className="min-w-[96px]">
                  <p className="text-[11px] text-[var(--store-text-muted)]">
                    الإجمالي
                  </p>
                  <p className="mt-0.5 text-sm font-bold">{formatIqd(total)}</p>
                </div>
                <Link
                  href="/checkout"
                  className="flex h-12 flex-1 items-center justify-center rounded-[12px] bg-[var(--store-primary)] text-sm font-bold text-white"
                >
                  متابعة إتمام الطلب
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
      <BottomNavigation />
    </main>
  );
}
