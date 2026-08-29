import { Apple, Beef, CupSoda, Milk, Package, Sprout } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { SectionHeader } from "@/components/store/shared/section-header";
import type { StoreCategory } from "@/features/catalog/types";

const fallbackIcons = [Sprout, Apple, Milk, CupSoda, Beef, Package];

export function CategoriesSection({
  categories,
  activeSlug = "",
  linkMode = "page",
}: {
  categories: StoreCategory[];
  activeSlug?: string;
  linkMode?: "page" | "filter";
}) {
  return (
    <section className="space-y-3">
      <SectionHeader title="التصنيفات" href="/categories" />

      {categories.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[var(--store-border)] bg-white px-4 py-5 text-center text-xs text-[var(--store-text-muted)]">
          لا توجد تصنيفات متاحة حالياً.
        </div>
      ) : (
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {categories.slice(0, 12).map((category, index) => {
            const Icon = fallbackIcons[index % fallbackIcons.length];
            const active = category.slug === activeSlug;
            const href =
              linkMode === "filter"
                ? `/?category=${encodeURIComponent(category.slug)}`
                : `/categories/${category.slug}`;

            return (
              <Link
                key={category.id}
                href={href}
                className={`flex min-h-12 shrink-0 items-center gap-2 rounded-lg border px-3 transition focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-emerald-100 ${
                  active
                    ? "border-emerald-200 bg-[var(--store-primary-soft)] text-[var(--store-primary-strong)]"
                    : "border-[var(--store-border)] bg-white text-[var(--store-text)] hover:border-emerald-200"
                }`}
              >
                <span className="relative flex size-9 items-center justify-center overflow-hidden rounded-lg bg-[var(--store-primary-soft)] text-[var(--store-primary)]">
                  {category.image ? (
                    <Image
                      src={category.image}
                      alt={category.name}
                      fill
                      sizes="36px"
                      className="object-contain p-1.5"
                    />
                  ) : (
                    <Icon className="size-5" />
                  )}
                </span>
                <span className="max-w-24 truncate text-xs font-medium">
                  {category.name}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
