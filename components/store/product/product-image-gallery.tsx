"use client";

import { useState } from "react";
import { StoreProductImage } from "@/components/store/shared/product-image";
import type { StoreProduct } from "@/features/catalog/types";
import { getProductImages } from "@/features/catalog/utils";

export function ProductImageGallery({ product }: { product: StoreProduct }) {
  const images = getProductImages(product);
  const [activeIndex, setActiveIndex] = useState(0);
  const activeImage = images[activeIndex] ?? product.image;

  return (
    <section className="rounded-b-[28px] bg-[#f7f7f7] px-5 pb-7 pt-3">
      <div className="relative mx-auto aspect-[1.25/1] max-w-[360px]">
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
