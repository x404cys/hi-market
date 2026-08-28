import { Package } from "lucide-react";
import Image from "next/image";

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
  if (!src) {
    return (
      <div className="flex size-full items-center justify-center rounded-[16px] bg-[var(--store-primary-soft)] text-[var(--store-primary)]">
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
    />
  );
}
