"use client";

import { Search, SlidersHorizontal, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { StoreBrand, StoreCategory } from "@/features/catalog/types";
import {
  hasStorefrontFilters,
  type StorefrontFilters,
} from "@/features/catalog/filters";

const allValue = "__all__";

export function StoreSearch({
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
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentParams = searchParams.toString();
  const currentSearch = searchParams.get("search")?.trim() ?? "";
  const [isPending, startTransition] = useTransition();
  const [value, setValue] = useState(filters.search);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [draftFilters, setDraftFilters] = useState(filters);
  const activeFilters = useMemo(
    () => buildActiveFilters(filters, categories, brands),
    [filters, categories, brands],
  );

  const navigateWithParams = useCallback(
    (params: URLSearchParams, replace: boolean) => {
      const href = params.size > 0 ? `${pathname}?${params.toString()}` : pathname;

      startTransition(() => {
        if (replace) {
          router.replace(href, { scroll: false });
        } else {
          router.push(href, { scroll: false });
        }
      });
    },
    [pathname, router, startTransition],
  );

  useEffect(() => {
    const nextSearch = value.trim();

    if (nextSearch === currentSearch) return;

    const timeout = window.setTimeout(() => {
      const params = new URLSearchParams(currentParams);

      if (nextSearch) {
        params.set("search", nextSearch);
      } else {
        params.delete("search");
      }

      navigateWithParams(params, true);
    }, 350);

    return () => window.clearTimeout(timeout);
  }, [currentParams, currentSearch, navigateWithParams, value]);

  function submitSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    const search = value.trim();

    if (search) {
      params.set("search", search);
    } else {
      params.delete("search");
    }

    navigateWithParams(params, false);
  }

  function setFilterParam(key: keyof StorefrontFilters, rawValue: string | boolean) {
    const params = new URLSearchParams(searchParams.toString());

    if (key === "inStock") {
      if (rawValue === true) {
        params.set("inStock", "true");
      } else {
        params.delete("inStock");
      }
    } else {
      const nextValue = String(rawValue).trim();
      if (nextValue && nextValue !== allValue) {
        params.set(key, nextValue);
      } else {
        params.delete(key);
      }
    }

    navigateWithParams(params, false);
  }

  function applyDraftFilters() {
    const params = new URLSearchParams(searchParams.toString());

    setParam(params, "category", draftFilters.category);
    setParam(params, "brand", draftFilters.brand);
    setParam(params, "minPrice", draftFilters.minPrice);
    setParam(params, "maxPrice", draftFilters.maxPrice);

    if (draftFilters.inStock) {
      params.set("inStock", "true");
    } else {
      params.delete("inStock");
    }

    navigateWithParams(params, false);
    setSheetOpen(false);
  }

  function clearFilters(includeSearch = false) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("category");
    params.delete("brand");
    params.delete("minPrice");
    params.delete("maxPrice");
    params.delete("inStock");

    if (includeSearch) {
      params.delete("search");
      setValue("");
    }

    setDraftFilters({
      search: includeSearch ? "" : filters.search,
      category: "",
      brand: "",
      minPrice: "",
      maxPrice: "",
      inStock: false,
    });
    navigateWithParams(params, false);
    setSheetOpen(false);
  }

  function removeFilter(key: keyof StorefrontFilters) {
    if (key === "search") {
      setValue("");
    }

    if (key === "minPrice" || key === "maxPrice") {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("minPrice");
      params.delete("maxPrice");
      setDraftFilters((current) => ({ ...current, minPrice: "", maxPrice: "" }));
      navigateWithParams(params, false);
      return;
    }

    setFilterParam(key, key === "inStock" ? false : "");
  }

  return (
    <div className="space-y-3">
      <form onSubmit={submitSearch} className="flex h-11 items-center gap-2">
        <label className="relative h-full flex-1">
          <span className="sr-only">ابحث عن المنتجات</span>
          <Search className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[var(--store-muted)]" />
          <input
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="ابحث عن المنتجات..."
            className="h-full w-full rounded-lg border border-[var(--store-border)] bg-white pr-10 pl-10 text-sm text-[var(--store-text)] outline-none transition placeholder:text-[var(--store-muted)] focus:border-[var(--store-primary)] focus:ring-3 focus:ring-emerald-100"
          />
          {value && (
            <button
              type="button"
              onClick={() => {
                setValue("");
                removeFilter("search");
              }}
              className="absolute left-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-[var(--store-muted)] transition hover:bg-slate-50 hover:text-[var(--store-text)] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-emerald-100"
              aria-label="مسح البحث"
            >
              <X className="size-4" />
            </button>
          )}
        </label>

  {/* Mobile Filter */}
  <Sheet
    open={sheetOpen}
    onOpenChange={(open) => {
      setSheetOpen(open);

      if (open) {
        setDraftFilters(filters);
      }
    }}
  >
    <SheetTrigger asChild>
      <button
        type="button"
        className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-[var(--store-primary)] text-white transition hover:bg-[var(--store-primary-strong)] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-emerald-200 md:hidden"
        aria-label="فتح الفلاتر"
      >
        <SlidersHorizontal className="size-4" />
      </button>
    </SheetTrigger>

    <SheetContent
      side="bottom"
      dir="rtl"
      className="max-h-[88svh] gap-0 rounded-t-xl border-[var(--store-border)] bg-[var(--store-background)] p-0"
    >
      <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-slate-300" />
      <SheetHeader className="border-b border-[var(--store-border)] bg-white pb-4">
        <SheetTitle className="text-base font-semibold">فلاتر المنتجات</SheetTitle>
      </SheetHeader>

      <div className="overflow-y-auto px-5 py-4">
        <FilterFields
          categories={categories}
          brands={brands}
          filters={draftFilters}
          onChange={setDraftFilters}
        />
      </div>

      <SheetFooter className="grid grid-cols-2 border-t border-[var(--store-border)] bg-white">
        <Button
          type="button"
          variant="outline"
          onClick={() => clearFilters(false)}
          className="h-11 rounded-lg"
        >
          مسح الفلاتر
        </Button>

        <Button
          type="button"
          onClick={applyDraftFilters}
          className="h-11 rounded-lg bg-[var(--store-primary)] text-white hover:bg-[var(--store-primary-strong)]"
        >
          {typeof resultCount === "number"
            ? `عرض ${resultCount.toLocaleString("ar-IQ")} منتج`
            : "عرض النتائج"}
        </Button>
      </SheetFooter>
    </SheetContent>
  </Sheet>

   <Popover
    onOpenChange={(open) => {
      if (open) {
        setDraftFilters(filters);
      }
    }}
  >
    <PopoverTrigger asChild>
      <Button
        type="button"
        className="hidden h-11 gap-2 rounded-lg bg-[var(--store-primary)] px-4 text-white hover:bg-[var(--store-primary-strong)] md:flex"
      >
        <SlidersHorizontal className="size-4" />

        <span>فلترة</span>

        {activeFilters.filter((filter) => filter.key !== "search").length > 0 && (
          <span className="flex size-5 items-center justify-center rounded-full bg-white text-[10px] font-semibold text-[var(--store-primary)]">
            {
              activeFilters.filter((filter) => filter.key !== "search")
                .length
            }
          </span>
        )}
      </Button>
    </PopoverTrigger>

    <PopoverContent
      align="end"
      sideOffset={8}
      dir="rtl"
      className="w-[380px] rounded-lg border-[var(--store-border)] p-0 shadow-none"
    >
      <div className="border-b border-[var(--store-border)] px-5 py-4">
        <h3 className="text-sm font-semibold text-[var(--store-text)]">
          فلترة المنتجات
        </h3>

        <p className="mt-1 text-xs text-[var(--store-muted)]">
          اختر الخيارات المناسبة لعرض المنتجات
        </p>
      </div>

      <div className="max-h-[60vh] overflow-y-auto px-5">
        <FilterFields
          categories={categories}
          brands={brands}
          filters={draftFilters}
          onChange={setDraftFilters}
        />
      </div>

      <div className="grid grid-cols-2 gap-2 border-t border-[var(--store-border)] p-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => clearFilters(false)}
          className="h-10 rounded-lg"
        >
          مسح
        </Button>

        <Button
          type="button"
          disabled={isPending}
          onClick={applyDraftFilters}
          className="h-10 rounded-lg bg-[var(--store-primary)] text-white hover:bg-[var(--store-primary-strong)]"
        >
          {typeof resultCount === "number"
            ? `عرض ${resultCount.toLocaleString("ar-IQ")} منتج`
            : "عرض النتائج"}
        </Button>
      </div>
    </PopoverContent>
  </Popover>
</form>
      {activeFilters.length > 0 && (
        <div className="-mx-1 flex items-center gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:flex-wrap md:overflow-visible">
          {activeFilters.map((filter) => (
            <Badge
              key={filter.key}
              variant="outline"
              className="h-8 shrink-0 gap-1 rounded-lg border-[var(--store-border)] bg-white px-2 text-[11px] font-medium"
            >
              {filter.label}
              <button
                type="button"
                onClick={() => removeFilter(filter.key)}
                className="rounded-full text-[var(--store-muted)] hover:text-[var(--store-danger)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200"
                aria-label={`إزالة فلتر ${filter.label}`}
              >
                <X className="size-3" />
              </button>
            </Badge>
          ))}
          {hasStorefrontFilters(filters) && (
            <button
              type="button"
              onClick={() => clearFilters(true)}
              className="text-[11px] font-semibold text-[var(--store-primary)]"
            >
              مسح الكل
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function FilterFields({
  categories,
  brands,
  filters,
  onChange,
}: {
  categories: StoreCategory[];
  brands: StoreBrand[];
  filters: StorefrontFilters;
  onChange: React.Dispatch<React.SetStateAction<StorefrontFilters>>;
}) {
  return (
    <div className="space-y-5">
      <FilterSection title="التصنيف">
        <Select
          value={filters.category || allValue}
          onValueChange={(category) =>
            onChange((current) => ({
              ...current,
              category: category === allValue ? "" : category,
            }))
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="جميع التصنيفات" />
          </SelectTrigger>
          <SelectContent dir="rtl">
            <SelectItem value={allValue}>جميع التصنيفات</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.slug}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {categories.length === 0 && (
          <p className="text-xs text-[var(--store-text-muted)]">
            لا توجد تصنيفات متاحة حالياً.
          </p>
        )}
      </FilterSection>

      <Separator />

      <FilterSection title="الماركة">
        <Select
          value={filters.brand || allValue}
          onValueChange={(brand) =>
            onChange((current) => ({
              ...current,
              brand: brand === allValue ? "" : brand,
            }))
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="جميع الماركات" />
          </SelectTrigger>
          <SelectContent dir="rtl">
            <SelectItem value={allValue}>جميع الماركات</SelectItem>
            {brands.map((brand) => (
              <SelectItem key={brand.id} value={brand.slug}>
                {brand.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {brands.length === 0 && (
          <p className="text-xs text-[var(--store-text-muted)]">
            لا توجد ماركات متاحة حالياً.
          </p>
        )}
      </FilterSection>

      <Separator />

      <FilterSection title="السعر">
        <div className="grid grid-cols-2 gap-3">
          <PriceInput
            label="من"
            value={filters.minPrice}
            onChange={(minPrice) =>
              onChange((current) => ({ ...current, minPrice }))
            }
          />
          <PriceInput
            label="إلى"
            value={filters.maxPrice}
            onChange={(maxPrice) =>
              onChange((current) => ({ ...current, maxPrice }))
            }
          />
        </div>
      </FilterSection>

      <Separator />

      <label className="flex min-h-11 items-center gap-2 rounded-lg border border-[var(--store-border)] bg-white px-3 py-3 text-sm font-medium">
        <Checkbox
          checked={filters.inStock}
          onCheckedChange={(checked) =>
            onChange((current) => ({ ...current, inStock: checked === true }))
          }
        />
        متوفر فقط
      </label>
    </div>
  );
}

function FilterSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2">
      <h2 className="text-sm font-semibold text-[var(--store-text)]">{title}</h2>
      {children}
    </section>
  );
}

function PriceInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="relative block">
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--store-text-muted)]">
        {label}
      </span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        inputMode="decimal"
        className="h-11 w-full rounded-lg border border-[var(--store-border)] bg-white pr-9 pl-3 text-sm outline-none transition placeholder:text-[var(--store-muted)] focus:border-[var(--store-primary)] focus:ring-3 focus:ring-emerald-100"
      />
    </label>
  );
}

function buildActiveFilters(
  filters: StorefrontFilters,
  categories: StoreCategory[],
  brands: StoreBrand[],
) {
  const activeFilters: Array<{ key: keyof StorefrontFilters; label: string }> = [];
  const category = categories.find((item) => item.slug === filters.category);
  const brand = brands.find((item) => item.slug === filters.brand);

  if (filters.search) activeFilters.push({ key: "search", label: filters.search });
  if (category) activeFilters.push({ key: "category", label: category.name });
  if (brand) activeFilters.push({ key: "brand", label: brand.name });
  if (filters.minPrice || filters.maxPrice) {
    activeFilters.push({
      key: "minPrice",
      label: `السعر ${filters.minPrice || "0"} - ${filters.maxPrice || "∞"}`,
    });
  }
  if (filters.inStock) activeFilters.push({ key: "inStock", label: "متوفر فقط" });

  return activeFilters;
}

function setParam(params: URLSearchParams, key: string, value: string) {
  if (value.trim()) {
    params.set(key, value.trim());
  } else {
    params.delete(key);
  }
}
