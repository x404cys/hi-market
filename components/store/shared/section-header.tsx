"use client"
import Link from "next/link";

export function SectionHeader({
  title,
  href,
}: {
  title: string;
  href?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-[17px] font-semibold text-[var(--store-text)]">{title}</h2>
      {href && (
        <Link
          href={href}
          className="text-xs font-semibold text-[var(--store-primary)]"
        >
          عرض الكل
        </Link>
      )}
    </div>
  );
}
