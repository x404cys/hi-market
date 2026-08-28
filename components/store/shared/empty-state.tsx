import { PackageSearch } from "lucide-react";

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="rounded-[18px] border border-[var(--store-border)] bg-white px-4 py-8 text-center">
      <PackageSearch className="mx-auto size-8 text-[var(--store-muted)]" />
      <p className="mt-3 text-sm font-semibold text-[var(--store-text)]">{title}</p>
      {description && (
        <p className="mt-1 text-xs leading-5 text-[var(--store-text-muted)]">
          {description}
        </p>
      )}
    </div>
  );
}
