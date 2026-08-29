"use client";

import { StoreSearch } from "@/components/store/search/store-search";
import type { StoreBrand, StoreCategory } from "@/features/catalog/types";
import type { StorefrontFilters } from "@/features/catalog/filters";
import { useCartSummary } from "@/features/cart/store";
import { useFavoritesSummary } from "@/features/favorites/store";
import { Heart, MapPin, ShoppingBag } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export function StoreHeader({
  filters,
  categories,
  brands,
  resultCount,
}: {
  filters: StorefrontFilters;
  categories: StoreCategory[];
  brands: StoreBrand[];
  resultCount?: number;
}) {
  const { itemCount } = useCartSummary();
  const { count: favoriteCount } = useFavoritesSummary();

  return (
    <header className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2" aria-label="HiMarket الرئيسية">
          <Image
            src="/logo-hi-market.png"
            alt="logo Hi market"
            width={92}
            height={92}
            priority
            className="h-auto w-[86px]"
            style={{ height: "auto" }}
          />
        </Link>

        
        <div className="flex items-center gap-2 md:hidden">
           <HeaderIconLink href="/cart" label="السلة" count={itemCount} icon={<ShoppingBag className="size-4" />} />
        </div>
        <div className="hidden items-center gap-2 md:flex">
          <HeaderIconLink href="/favorites" label="المفضلة" count={favoriteCount} icon={<Heart className="size-4" />} />
          <HeaderIconLink href="/cart" label="السلة" count={itemCount} icon={<ShoppingBag className="size-4" />} />
        </div>
      </div>
      <StoreSearch
        filters={filters}
        categories={categories}
        brands={brands}
        resultCount={resultCount}
      />
    </header>
  );
}

function HeaderIconLink({
  href,
  label,
  count,
  icon,
}: {
  href: string;
  label: string;
  count: number;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="relative flex h-10 min-w-10 items-center justify-center rounded-lg border border-[var(--store-border)] bg-white px-3 text-[var(--store-text)] transition hover:border-emerald-200 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-emerald-100"
      aria-label={label}
    >
      {icon}
      {count > 0 && (
        <span className="absolute -left-1 -top-1 flex min-w-4 items-center justify-center rounded-full bg-[var(--store-primary)] px-1 text-[10px] leading-4 text-white">
          {count > 99 ? "99+" : count.toLocaleString("ar-IQ")}
        </span>
      )}
    </Link>
  );
}
