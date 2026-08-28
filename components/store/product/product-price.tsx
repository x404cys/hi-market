import { formatIqd } from "@/lib/products/product-format";

export function ProductPrice({
  price,
  comparePrice,
  compact,
}: {
  price: string;
  comparePrice?: string | null;
  compact?: boolean;
}) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span
        className={
          compact
            ? "text-[13px] font-bold text-[var(--store-text)]"
            : "text-lg font-bold text-[var(--store-text)]"
        }
      >
        {formatIqd(price)}
      </span>
      {comparePrice && Number(comparePrice) > Number(price) && (
        <span className="text-[11px] font-medium text-[var(--store-muted)] line-through">
          {formatIqd(comparePrice)}
        </span>
      )}
    </div>
  );
}
