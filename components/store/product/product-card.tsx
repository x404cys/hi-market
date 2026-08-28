"use client";

import { Heart, Plus, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ProductPrice } from "@/components/store/product/product-price";
import { StoreProductImage } from "@/components/store/shared/product-image";
import type { StoreProduct } from "@/features/catalog/types";
import { getDiscountPercent, getUnitText } from "@/features/catalog/utils";
import { addProductToCart } from "@/features/cart/store";

export function ProductCard({ product }: { product: StoreProduct }) {
  const discount = getDiscountPercent(product);
  const [isFavorite, setIsFavorite] = useState(false);
  const [added, setAdded] = useState(false);

  function handleAddToCart() {
    addProductToCart(product);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 900);
  }

  return (
    <article className="relative overflow-hidden rounded-[14px] border border-[var(--store-border)] bg-white p-2.5 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
      <div className="absolute right-2 top-2 z-10">
        {discount ? (
          <span className="rounded-[5px] bg-[var(--store-primary)] px-2 py-1 text-[10px] font-bold leading-none text-white">
            {discount.toLocaleString("ar-IQ")}% خصم
          </span>
        ) : null}
      </div>
      <button
        type="button"
        onClick={() => setIsFavorite((current) => !current)}
        className="absolute left-2 top-2 z-10 flex size-7 items-center justify-center rounded-full bg-white/90 text-[var(--store-primary)] shadow-sm"
        aria-label={isFavorite ? "إزالة من المفضلة" : "إضافة إلى المفضلة"}
      >
        <Heart className={`size-4 ${isFavorite ? "fill-current" : ""}`} />
      </button>

      <Link href={`/products/${product.slug}`} className="block">
        <div className="relative mt-5 aspect-[1.08/1]">
          <StoreProductImage
            src={product.image}
            alt={product.name}
            sizes="(min-width: 1280px) 220px, (min-width: 768px) 30vw, 45vw"
          />
        </div>
        <h3 className="mt-2 truncate text-[13px] font-bold text-[var(--store-text)]">
          {product.name}
        </h3>
        <p className="mt-0.5 text-[11px] text-[var(--store-text-muted)]">
          {getUnitText(product)}
        </p>
      </Link>

      <div className="mt-2 flex items-end justify-between gap-2">
        <ProductPrice
          price={product.price}
          comparePrice={product.comparePrice}
          compact
        />
        <button
          type="button"
          onClick={handleAddToCart}
          className="flex h-8 min-w-8 items-center justify-center rounded-[8px] bg-[var(--store-primary)] px-2 text-white shadow-[0_8px_18px_rgba(16,185,129,0.18)]"
          aria-label="إضافة إلى السلة"
        >
          {added ? <ShoppingBag className="size-4" /> : <Plus className="size-4" />}
        </button>
      </div>
    </article>
  );
}
