"use client";

import { Search, SlidersHorizontal, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
}: {
  filters: StorefrontFilters;
  categories: StoreCategory[];
  brands: StoreBrand[];
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
      <form onSubmit={submitSearch} className="flex h-10 items-center gap-2">
        <label className="relative h-full flex-1">
          <span className="sr-only">ابحث عن المنتجات</span>
          <Search className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[var(--store-muted)]" />
          <input
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="ابحث عن منتجات، مشروبات، أطعمة..."
            className="h-full w-full rounded-[10px] border border-[var(--store-border)] bg-white pr-10 pl-3 text-xs text-[var(--store-text)] outline-none transition placeholder:text-[var(--store-muted)] focus:border-[var(--store-primary)] focus:ring-3 focus:ring-emerald-100"
          />
        </label>
        <Sheet
          open={sheetOpen}
          onOpenChange={(open) => {
            setSheetOpen(open);
            if (open) setDraftFilters(filters);
          }}
        >
          <SheetTrigger asChild>
            <button
              type="button"
              className="flex size-10 items-center justify-center rounded-[10px] bg-[var(--store-primary)] text-white transition hover:bg-[var(--store-primary-strong)] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-emerald-200 md:hidden"
              aria-label="فتح الفلاتر"
            >
              <SlidersHorizontal className="size-4" />
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" dir="rtl" className="bg-[var(--store-background)]">
            <SheetHeader>
              <SheetTitle>فلاتر المنتجات</SheetTitle>
            </SheetHeader>
            <div className="overflow-y-auto px-5 pb-2">
              <FilterFields
                categories={categories}
                brands={brands}
                filters={draftFilters}
                onChange={setDraftFilters}
              />
            </div>
            <SheetFooter className="grid grid-cols-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => clearFilters(false)}
                className="h-11 rounded-[10px]"
              >
                مسح الفلاتر
              </Button>
              <Button
                type="button"
                onClick={applyDraftFilters}
                className="h-11 rounded-[10px] bg-[var(--store-primary)] text-white hover:bg-[var(--store-primary-strong)]"
              >
                عرض النتائج
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </form>

      <div className="hidden rounded-[14px] border border-[var(--store-border)] bg-white p-3 md:block">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-[1fr_1fr_0.7fr_0.7fr_auto_auto]">
          <Select
            value={filters.category || allValue}
            onValueChange={(nextValue) => setFilterParam("category", nextValue)}
          >
            <SelectTrigger aria-label="التصنيف">
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

          <Select
            value={filters.brand || allValue}
            onValueChange={(nextValue) => setFilterParam("brand", nextValue)}
          >
            <SelectTrigger aria-label="الماركة">
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

          <PriceInput
            label="من"
            value={draftFilters.minPrice}
            onChange={(minPrice) =>
              setDraftFilters((current) => ({ ...current, minPrice }))
            }
          />
          <PriceInput
            label="إلى"
            value={draftFilters.maxPrice}
            onChange={(maxPrice) =>
              setDraftFilters((current) => ({ ...current, maxPrice }))
            }
          />
          <label className="flex h-10 items-center gap-2 rounded-[10px] border border-[var(--store-border)] px-3 text-xs font-semibold text-[var(--store-text)]">
            <Checkbox
              checked={filters.inStock}
              onCheckedChange={(checked) => setFilterParam("inStock", checked === true)}
            />
            متوفر فقط
          </label>
          <Button
            type="button"
            variant="outline"
            onClick={applyDraftFilters}
            disabled={isPending}
            className="h-10 rounded-[10px]"
          >
            تطبيق
          </Button>
        </div>
      </div>

      {activeFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {activeFilters.map((filter) => (
            <Badge
              key={filter.key}
              variant="outline"
              className="h-7 gap-1 rounded-full border-[var(--store-border)] bg-white px-2 text-[11px]"
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
    <div className="space-y-5 py-2">
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

      <label className="flex items-center gap-2 rounded-[12px] border border-[var(--store-border)] bg-white px-3 py-3 text-sm font-semibold">
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
      <h2 className="text-sm font-bold text-[var(--store-text)]">{title}</h2>
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
        className="h-10 w-full rounded-[10px] border border-[var(--store-border)] bg-white pr-9 pl-3 text-sm outline-none transition placeholder:text-[var(--store-muted)] focus:border-[var(--store-primary)] focus:ring-3 focus:ring-emerald-100"
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
