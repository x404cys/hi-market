"use client";

import Image from "next/image";
import { Tags } from "lucide-react";
import { useState } from "react";

export function StoreCategoryImage({
  src,
  alt,
  sizes,
  className = "object-cover",
}: {
  src?: string | null;
  alt: string;
  sizes: string;
  className?: string;
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const hasFailed = Boolean(src && failedSrc === src);

  if (!src || hasFailed) {
    return (
      <div className="flex size-full items-center justify-center rounded-lg bg-[var(--store-primary-soft)] text-[var(--store-primary)]">
        <Tags className="size-5" aria-hidden="true" />
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      className={className}
      onError={() => setFailedSrc(src)}
    />
  );
}
