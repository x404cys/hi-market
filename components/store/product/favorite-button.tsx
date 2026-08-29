"use client";

import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { toggleFavorite, useIsFavorite } from "@/features/favorites/store";

export function FavoriteButton({
  productId,
  className,
}: {
  productId: string;
  className?: string;
}) {
  const isFavorite = useIsFavorite(productId);

  return (
    <button
      type="button"
      onClick={() => toggleFavorite(productId)}
      className={cn(
        "flex items-center justify-center rounded-lg border border-[var(--store-border)] bg-white/90 text-[var(--store-primary)] transition hover:bg-white hover:text-[var(--store-primary-strong)] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-emerald-200",
        className,
      )}
      aria-pressed={isFavorite}
      aria-label={isFavorite ? "إزالة من المفضلة" : "إضافة إلى المفضلة"}
    >
      <Heart className={cn("size-4", isFavorite && "fill-current")} />
    </button>
  );
}
