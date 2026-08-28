import { Apple, Beef, CupSoda, Milk, Package, Sprout } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { SectionHeader } from "@/components/store/shared/section-header";
import type { StoreCategory } from "@/features/catalog/types";

const fallbackIcons = [Sprout, Apple, Milk, CupSoda, Beef, Package];

export function CategoriesSection({ categories }: { categories: StoreCategory[] }) {
  return (
    <section className="space-y-4">
      <SectionHeader title="التصنيفات" href="/categories" />

      {categories.length === 0 ? (
        <div className="rounded-[14px] border border-dashed border-[var(--store-border)] bg-white px-4 py-5 text-center text-xs text-[var(--store-text-muted)]">
          لا توجد تصنيفات متاحة حالياً.
        </div>
      ) : (
        <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {categories.slice(0, 12).map((category, index) => {
            const Icon = fallbackIcons[index % fallbackIcons.length];

            return (
              <Link
                key={category.id}
                href={`/categories/${category.slug}`}
                className="w-[68px] shrink-0 text-center"
              >
                <span className="relative mx-auto flex size-[58px] items-center justify-center overflow-hidden rounded-full bg-[var(--store-primary-soft)] text-[var(--store-primary)]">
                  {category.image ? (
                    <Image
                      src={category.image}
                      alt={category.name}
                      fill
                      sizes="58px"
                      className="object-contain p-2"
                    />
                  ) : (
                    <Icon className="size-7" />
                  )}
                </span>
                <span className="mt-2 block truncate text-[11px] font-semibold text-[var(--store-text)]">
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
