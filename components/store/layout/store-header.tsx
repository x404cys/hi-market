"use client";

import { StoreSearch } from "@/components/store/search/store-search";
import type { StoreBrand, StoreCategory } from "@/features/catalog/types";
import type { StorefrontFilters } from "@/features/catalog/filters";
import Image from "next/image";

export function StoreHeader({
  filters,
  categories,
  brands,
}: {
  filters: StorefrontFilters;
  categories: StoreCategory[];
  brands: StoreBrand[];
}) {
  return (
    <header className="space-y-4">
      <div className="flex items-center justify-center gap-4">
        <div>
          <Image
            src="/logo-hi-market.png"
            alt="logo Hi market"
            width={100}
            height={100}
          />
        </div>
      </div>
      <StoreSearch filters={filters} categories={categories} brands={brands} />
    </header>
  );
}
