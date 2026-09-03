"use client";

import { Plus, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { CartQuantityControls } from "@/components/store/cart/cart-line-items";
import { FavoriteButton } from "@/components/store/product/favorite-button";
import { ProductPrice } from "@/components/store/product/product-price";
import { StoreProductImage } from "@/components/store/shared/product-image";
import type { StoreProduct } from "@/features/catalog/types";
import { getDiscountPercent, getUnitText, isNewProduct } from "@/features/catalog/utils";
import {
  addProductToCart,
  getCartStepForProduct,
  useCartState,
} from "@/features/cart/store";

export function ProductCard({
  product,
  onOpenProduct,
}: {
  product: StoreProduct;
  onOpenProduct?: (product: StoreProduct) => void;
}) {
  const discount = getDiscountPercent(product);
  const isNew = isNewProduct(product);
  const [added, setAdded] = useState(false);
  const cart = useCartState();
  const inCartQuantity =
    cart.items.find((item) => item.productId === product.id)?.quantity ?? 0;
  const unavailable =
    product.trackInventory && !product.allowBackorder && Number(product.stock) <= 0;
  const step = getCartStepForProduct(product);

  function handleAddToCart() {
    if (unavailable) return;
    addProductToCart(product);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 900);
  }

  function handleProductClick(event: React.MouseEvent<HTMLAnchorElement>) {
    if (!onOpenProduct) return;
    if (!window.matchMedia("(max-width: 767px)").matches) return;

    event.preventDefault();
    onOpenProduct(product);
  }

  return (
    <article className="relative overflow-hidden rounded-lg border border-[var(--store-border)] bg-white p-2.5 transition hover:border-emerald-200 hover:bg-slate-50/40">
      <div className="absolute right-2 top-2 z-10 flex max-w-[calc(100%-3.5rem)] flex-wrap gap-1">
        {isNew ? (
          <span className="rounded-md bg-emerald-50 px-2 py-1 text-[10px] font-semibold leading-none text-[var(--store-primary-strong)] ring-1 ring-emerald-100">
            جديد
          </span>
        ) : null}
        {discount ? (
          <span className="rounded-md bg-[var(--store-primary)] px-2 py-1 text-[10px] font-semibold leading-none text-white">
            خصم {discount.toLocaleString("ar-IQ")}%
          </span>
        ) : null}
      </div>
      <FavoriteButton
        productId={product.id}
        className="absolute left-2 top-2 z-10 size-10"
      />

      <Link href={`/products/${product.slug}`} onClick={handleProductClick} className="block">
        <div className="relative mt-5 aspect-square rounded-lg bg-[#f7f8f8]">
          <StoreProductImage
            src={product.image}
            alt={product.name}
            sizes="(min-width: 1280px) 220px, (min-width: 768px) 30vw, 45vw"
            className="object-cover"
          />
        </div>
        <h3 className="mt-2 line-clamp-2 min-h-9 text-[13px] font-semibold leading-[18px] text-[var(--store-text)]">
          {product.name}
        </h3>
        <p className="mt-0.5 text-[11px] text-[var(--store-text-muted)]">
          {getUnitText(product)}
        </p>
      </Link>

      <div className="mt-2 flex min-h-10 items-end justify-between gap-2">
        <ProductPrice
          price={product.price}
          comparePrice={product.comparePrice}
          compact
        />
        {inCartQuantity > 0 ? (
          <CartQuantityControls
            productId={product.id}
            quantity={inCartQuantity}
            step={step}
            compact
          />
        ) : (
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={unavailable}
            className="flex size-10 items-center justify-center rounded-lg bg-[var(--store-primary)] text-white transition hover:bg-[var(--store-primary-strong)] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-emerald-200 disabled:bg-slate-200 disabled:text-slate-500"
            aria-label={unavailable ? "المنتج غير متوفر" : "إضافة إلى السلة"}
          >
            {added ? <ShoppingBag className="size-4" /> : <Plus className="size-4" />}
          </button>
        )}
      </div>
      {added && (
        <p className="mt-2 text-center text-[11px] font-medium text-[var(--store-primary-strong)]" aria-live="polite">
          تمت الإضافة
        </p>
      )}
    </article>
  );
}
