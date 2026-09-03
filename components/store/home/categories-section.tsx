import Link from "next/link";
import { SectionHeader } from "@/components/store/shared/section-header";
import { StoreCategoryImage } from "@/components/store/shared/category-image";
import type { StoreCategory } from "@/features/catalog/types";

export function CategoriesSection({
  categories,
  activeSlug = "",
  linkMode = "page",
  maxItems = 12,
}: {
  categories: StoreCategory[];
  activeSlug?: string;
  linkMode?: "page" | "filter";
  maxItems?: number | null;
}) {
  const visibleCategories =
    typeof maxItems === "number" ? categories.slice(0, maxItems) : categories;

  return (
    <section className="space-y-3">
      <SectionHeader title="التصنيفات" href="/categories" />

      {categories.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[var(--store-border)] bg-white px-4 py-5 text-center text-xs text-[var(--store-text-muted)]">
          لا توجد تصنيفات متاحة حالياً.
        </div>
      ) : (
        <div className="-mx-1 flex gap-4 overflow-x-auto px-1 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {visibleCategories.map((category) => {
            const active = category.slug === activeSlug;

            const href =
              linkMode === "filter"
                ? `/?category=${encodeURIComponent(category.slug)}`
                : `/categories/${category.slug}`;

            return (
              <Link
                key={category.id}
                href={href}
                className="group flex w-[72px] shrink-0 flex-col items-center gap-2 text-center focus-visible:outline-none"
              >
                  <span
                  className={`relative flex size-16 items-center justify-center overflow-hidden rounded-full border transition ${
                    active
                      ? "border-emerald-500 ring-2 ring-emerald-100"
                      : "border-[var(--store-border)] group-hover:border-emerald-300"
                  }`}
                >
                  <StoreCategoryImage
                    src={category.image}
                    alt={category.name}
                    sizes="64px"
                    className="object-cover"
                  />
                </span>

                 <span
                  className={`w-full truncate text-xs font-medium transition ${
                    active
                      ? "text-[var(--store-primary-strong)]"
                      : "text-[var(--store-text)]"
                  }`}
                >
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
