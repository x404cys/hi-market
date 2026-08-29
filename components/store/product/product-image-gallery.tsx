"use client";

import { useState } from "react";
import { StoreProductImage } from "@/components/store/shared/product-image";
import type { StoreProduct } from "@/features/catalog/types";
import { getProductImages } from "@/features/catalog/utils";

export function ProductImageGallery({
  product,
  compact = false,
}: {
  product: StoreProduct;
  compact?: boolean;
}) {
  const images = getProductImages(product);
  const [activeIndex, setActiveIndex] = useState(0);
  const activeImage = images[activeIndex] ?? product.image;

  return (
    <section
      className={
        compact
          ? "bg-[#f7f8f8] px-5 pb-4 pt-2"
          : "rounded-b-xl bg-[#f7f8f8] px-5 pb-6 pt-3 md:rounded-xl md:border md:border-[var(--store-border)]"
      }
    >
      <div
        className={
          compact
            ? "relative mx-auto aspect-square max-w-[280px]"
            : "relative mx-auto aspect-square max-w-[380px]"
        }
      >
        <StoreProductImage
          src={activeImage}
          alt={product.name}
          sizes="(min-width: 768px) 360px, 90vw"
          priority
        />
      </div>
      <div className="mt-3 flex justify-center gap-1.5" aria-label="صور المنتج">
        {(images.length > 0 ? images : [null]).map((_, index) => (
          <button
            key={index}
            type="button"
            onClick={() => setActiveIndex(index)}
            className={
              index === activeIndex
                ? "h-1.5 w-5 rounded-full bg-[var(--store-primary)]"
                : "size-1.5 rounded-full bg-emerald-100"
            }
            aria-label={`عرض صورة ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
