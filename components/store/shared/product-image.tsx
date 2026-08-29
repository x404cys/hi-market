"use client";

import { Package } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

export function StoreProductImage({
  src,
  alt,
  sizes,
  priority,
  className = "object-contain",
}: {
  src?: string | null;
  alt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const hasFailed = Boolean(src && failedSrc === src);

  if (!src || hasFailed) {
    return (
      <div className="flex size-full items-center justify-center rounded-lg bg-[var(--store-primary-soft)] text-[var(--store-primary)]">
        <Package className="size-8" aria-hidden="true" />
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      className={className}
      onError={() => setFailedSrc(src)}
    />
  );
}
