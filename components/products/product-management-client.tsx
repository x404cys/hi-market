"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  formatIqd,
  formatQuantity,
  getStockLabel,
  productStatusLabels,
} from "@/lib/products/product-format";
import type {
  ApiErrorResponse,
  ApiSuccess,
  BrandOption,
  CategoryOption,
  PaginatedApiSuccess,
  ProductDto,
  ProductSummary,
} from "@/lib/products/product-types";
import {
  AlertTriangle,
  Archive,
  Boxes,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Filter,
  MoreHorizontal,
  PackagePlus,
  Pencil,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

const statusOptions = [
  { value: "ACTIVE", label: productStatusLabels.ACTIVE },
  { value: "DRAFT", label: productStatusLabels.DRAFT },
  { value: "INACTIVE", label: productStatusLabels.INACTIVE },
  { value: "OUT_OF_STOCK", label: productStatusLabels.OUT_OF_STOCK },
  { value: "ARCHIVED", label: productStatusLabels.ARCHIVED },
] as const;

const stockStatusOptions = [
  { value: "available", label: "متوفر" },
  { value: "low", label: "مخزون منخفض" },
  { value: "out", label: "نفد المخزون" },
] as const;

const sortOptions = [
  { value: "createdAt:desc", label: "الأحدث" },
  { value: "updatedAt:desc", label: "آخر تحديث" },
  { value: "name:asc", label: "الاسم" },
  { value: "price:asc", label: "السعر: الأقل" },
  { value: "price:desc", label: "السعر: الأعلى" },
  { value: "stock:asc", label: "المخزون: الأقل" },
] as const;

type ProductsState = {
  products: ProductDto[];
  pagination: PaginatedApiSuccess<ProductDto[]>["pagination"];
  summary: ProductSummary;
};

type CatalogState = {
  categories: CategoryOption[];
  brands: BrandOption[];
};

const emptySummary: ProductSummary = {
  totalProducts: 0,
  activeProducts: 0,
  lowStockProducts: 0,
  outOfStockProducts: 0,
};

export function ProductManagementClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryString = searchParams.toString();
  const [productsState, setProductsState] = useState<ProductsState | null>(null);
  const [catalog, setCatalog] = useState<CatalogState>({
    categories: [],
    brands: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [searchValue, setSearchValue] = useState(searchParams.get("search") ?? "");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [productToDelete, setProductToDelete] = useState<ProductDto | null>(null);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const page = Number(searchParams.get("page") ?? "1");
  const categoryId = searchParams.get("categoryId") ?? "";
  const brandId = searchParams.get("brandId") ?? "";
  const status = searchParams.get("status") ?? "";
  const stockStatus = searchParams.get("stockStatus") ?? "";
  const search = searchParams.get("search") ?? "";
  const sortBy = searchParams.get("sortBy") ?? "createdAt";
  const order = searchParams.get("order") ?? "desc";

  useEffect(() => {
    let isActive = true;

    async function loadCatalog() {
      try {
        const [categoriesResponse, brandsResponse] = await Promise.all([
          fetch("/api/categories", { cache: "no-store" }),
          fetch("/api/brands", { cache: "no-store" }),
        ]);
        const [categoriesJson, brandsJson] = (await Promise.all([
          categoriesResponse.json(),
          brandsResponse.json(),
        ])) as [
          ApiSuccess<CategoryOption[]> | ApiErrorResponse,
          ApiSuccess<BrandOption[]> | ApiErrorResponse,
        ];

        if (!isActive) return;

        if (!categoriesJson.success || !brandsJson.success) {
          setCatalogError("تعذر تحميل التصنيفات أو الماركات.");
          return;
        }

        setCatalog({
          categories: categoriesJson.data,
          brands: brandsJson.data,
        });
      } catch {
        if (isActive) {
          setCatalogError("تعذر تحميل التصنيفات أو الماركات.");
        }
      }
    }

    loadCatalog();

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    let isActive = true;

    async function loadProducts() {
      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams(queryString);
        if (!params.has("page")) params.set("page", "1");
        if (!params.has("limit")) params.set("limit", "20");
        const response = await fetch(`/api/products?${params.toString()}`, {
          cache: "no-store",
        });
        const json = (await response.json()) as
          | PaginatedApiSuccess<ProductDto[]>
          | ApiErrorResponse;

        if (!isActive) return;

        if (!json.success) {
          setProductsState(null);
          setError(json.message || "تعذر تحميل المنتجات.");
          return;
        }

        setProductsState({
          products: json.data,
          pagination: json.pagination,
          summary: json.summary ?? emptySummary,
        });
      } catch {
        if (isActive) {
          setProductsState(null);
          setError("تعذر الاتصال بواجهة المنتجات.");
        }
      } finally {
        if (isActive) setIsLoading(false);
      }
    }

    loadProducts();

    return () => {
      isActive = false;
    };
  }, [queryString, stockStatus]);

  const activeFilters = useMemo(() => {
    const filters: { key: string; label: string }[] = [];
    const selectedCategory = catalog.categories.find((item) => item.id === categoryId);
    const selectedBrand = catalog.brands.find((item) => item.id === brandId);
    const selectedStatus = statusOptions.find((item) => item.value === status);
    const selectedStock = stockStatusOptions.find((item) => item.value === stockStatus);

    if (search.trim()) filters.push({ key: "search", label: `البحث: ${search}` });
    if (selectedCategory) filters.push({ key: "categoryId", label: `التصنيف: ${selectedCategory.name}` });
    if (selectedBrand) filters.push({ key: "brandId", label: `الماركة: ${selectedBrand.name}` });
    if (selectedStatus) filters.push({ key: "status", label: `الحالة: ${selectedStatus.label}` });
    if (selectedStock) filters.push({ key: "stockStatus", label: `المخزون: ${selectedStock.label}` });

    return filters;
  }, [brandId, catalog.brands, catalog.categories, categoryId, search, status, stockStatus]);

  const products = productsState?.products ?? [];
  const pagination = productsState?.pagination;
  const summary = productsState?.summary ?? emptySummary;
  const hasFilters = activeFilters.length > 0;
  const isEmptyDatabase = !isLoading && !error && !hasFilters && summary.totalProducts === 0;
  const hasNoResults = !isLoading && !error && hasFilters && products.length === 0;

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());

    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }

    if (key !== "page") {
      params.set("page", "1");
    }

    router.push(`${pathname}?${params.toString()}`);
  }

  function updateSort(value: string) {
    const [nextSortBy, nextOrder] = value.split(":");
    const params = new URLSearchParams(searchParams.toString());
    params.set("sortBy", nextSortBy);
    params.set("order", nextOrder);
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  }

  function updateSearch(value: string) {
    setSearchValue(value);

    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    searchDebounceRef.current = setTimeout(() => {
      updateParam("search", value.trim());
    }, 350);
  }

  function clearFilter(key: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(key);
    params.set("page", "1");
    if (key === "search") setSearchValue("");
    router.push(`${pathname}?${params.toString()}`);
  }

  function clearFilters() {
    setSearchValue("");
    router.push(pathname);
  }

  async function confirmDelete() {
    if (!productToDelete) return;

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/products/${productToDelete.id}`, {
        method: "DELETE",
      });
      const json = (await response.json()) as ApiSuccess<ProductDto> | ApiErrorResponse;

      if (!json.success) {
        setError(json.message || "تعذر حذف المنتج.");
        return;
      }

      setProductToDelete(null);
      setOpenMenuId(null);
      router.refresh();
      const params = new URLSearchParams(searchParams.toString());
      router.push(`${pathname}?${params.toString()}`);
    } catch {
      setError("تعذر الاتصال بواجهة المنتجات.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <main dir="rtl" className="min-h-screen bg-[#f8fafc] text-slate-950">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-3 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-normal text-slate-950">المنتجات</h1>
            <p className="mt-1 text-sm text-slate-500">إدارة منتجات المتجر والأسعار والمخزون.</p>
          </div>
          <Button asChild className="h-9 gap-2 self-start rounded-md px-3">
            <Link href="/dashboard/products/new">
              <Plus className="size-4" />
              إضافة منتج
            </Link>
          </Button>
        </header>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard icon={Boxes} label="إجمالي المنتجات" value={summary.totalProducts} />
          <MetricCard icon={CheckCircle2} label="المنتجات النشطة" value={summary.activeProducts} tone="success" />
          <MetricCard icon={AlertTriangle} label="مخزون منخفض" value={summary.lowStockProducts} tone="warning" />
          <MetricCard icon={Archive} label="نفد المخزون" value={summary.outOfStockProducts} tone="danger" />
        </section>

        <Card className="rounded-lg border-slate-200 shadow-none">
          <CardContent className="space-y-3 p-3">
            <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
              <label className="relative min-w-0 flex-1">
                <span className="sr-only">بحث عن منتج</span>
                <Search className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={searchValue}
                  onChange={(event) => updateSearch(event.target.value)}
                  className="h-10 w-full rounded-md border border-slate-200 bg-white pr-9 pl-3 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                  placeholder="ابحث بالاسم، SKU أو الباركود..."
                />
              </label>

              <SelectFilter
                label="التصنيف"
                value={categoryId}
                onChange={(value) => updateParam("categoryId", value)}
                options={catalog.categories.map((item) => ({
                  value: item.id,
                  label: item.name,
                }))}
              />

              <SelectFilter
                label="الحالة"
                value={status}
                onChange={(value) => updateParam("status", value)}
                options={statusOptions}
              />

              <details className="group relative">
                <summary className="flex h-10 cursor-pointer list-none items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                  <SlidersHorizontal className="size-4" />
                  المزيد
                </summary>
                <div className="absolute left-0 z-20 mt-2 w-72 rounded-lg border border-slate-200 bg-white p-3 shadow-lg">
                  <div className="space-y-3">
                    <SelectFilter
                      label="الماركة"
                      value={brandId}
                      onChange={(value) => updateParam("brandId", value)}
                      options={catalog.brands.map((item) => ({
                        value: item.id,
                        label: item.name,
                      }))}
                      fullWidth
                    />
                    <SelectFilter
                      label="حالة المخزون"
                      value={stockStatus}
                      onChange={(value) => updateParam("stockStatus", value)}
                      options={stockStatusOptions}
                      fullWidth
                    />
                  </div>
                </div>
              </details>

              <label className="lg:mr-auto">
                <span className="sr-only">ترتيب المنتجات</span>
                <select
                  value={`${sortBy}:${order}`}
                  onChange={(event) => updateSort(event.target.value)}
                  className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      ترتيب: {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {catalogError && (
              <p className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-700">{catalogError}</p>
            )}

            {activeFilters.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                {activeFilters.map((filter) => (
                  <button
                    key={filter.key}
                    type="button"
                    onClick={() => clearFilter(filter.key)}
                    className="inline-flex h-7 items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 text-xs text-slate-700 hover:bg-white"
                  >
                    {filter.label}
                    <X className="size-3" />
                  </button>
                ))}
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-xs font-medium text-slate-500 hover:text-slate-950"
                >
                  مسح الكل
                </button>
              </div>
            )}
          </CardContent>
        </Card>

        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          {isLoading && <ProductsSkeleton />}

          {!isLoading && error && (
            <StateMessage
              title="تعذر تحميل المنتجات"
              description={error}
              actionLabel="إعادة المحاولة"
              onAction={() => updateParam("page", String(page))}
            />
          )}

          {isEmptyDatabase && (
            <StateMessage
              title="لا توجد منتجات بعد"
              description="ابدأ بإضافة أول منتج إلى المتجر."
              href="/dashboard/products/new"
              actionLabel="إضافة منتج"
            />
          )}

          {hasNoResults && (
            <StateMessage
              title="لا توجد نتائج مطابقة"
              description="جرّب تغيير البحث أو إزالة بعض الفلاتر."
              actionLabel="مسح الفلاتر"
              onAction={clearFilters}
            />
          )}

          {!isLoading && !error && products.length > 0 && (
            <>
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full border-collapse text-sm">
                  <thead className="bg-slate-50 text-xs text-slate-500">
                    <tr>
                      <TableHeader>المنتج</TableHeader>
                      <TableHeader>SKU / Barcode</TableHeader>
                      <TableHeader>التصنيف</TableHeader>
                      <TableHeader>السعر</TableHeader>
                      <TableHeader>المخزون</TableHeader>
                      <TableHeader>الحالة</TableHeader>
                      <TableHeader>آخر تحديث</TableHeader>
                      <TableHeader>الإجراءات</TableHeader>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {products.map((product) => (
                      <tr key={product.id} className="hover:bg-slate-50/60">
                        <td className="min-w-64 px-4 py-3">
                          <ProductIdentity product={product} />
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          <div className="space-y-1">
                            <p className="font-medium text-slate-800">{product.sku || "—"}</p>
                            <p className="text-xs text-slate-400">{product.barcode || "لا يوجد باركود"}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-700">{product.category.name}</td>
                        <td className="px-4 py-3">
                          <PriceCell product={product} />
                        </td>
                        <td className="px-4 py-3">
                          <StockCell product={product} />
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={product.status} />
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500">{formatDate(product.updatedAt)}</td>
                        <td className="px-4 py-3">
                          <RowActions
                            product={product}
                            openMenuId={openMenuId}
                            setOpenMenuId={setOpenMenuId}
                            setProductToDelete={setProductToDelete}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="divide-y divide-slate-100 lg:hidden">
                {products.map((product) => (
                  <MobileProductRow
                    key={product.id}
                    product={product}
                    openMenuId={openMenuId}
                    setOpenMenuId={setOpenMenuId}
                    setProductToDelete={setProductToDelete}
                  />
                ))}
              </div>
            </>
          )}

          {pagination && pagination.total > 0 && (
            <Pagination
              page={pagination.page}
              limit={pagination.limit}
              total={pagination.total}
              totalPages={pagination.totalPages}
              onPageChange={(nextPage) => updateParam("page", String(nextPage))}
            />
          )}
        </section>
      </div>

      {productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-product-title"
            className="w-full max-w-md rounded-lg bg-white p-5 shadow-xl"
          >
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
                <Trash2 className="size-5" />
              </div>
              <div>
                <h2 id="delete-product-title" className="text-lg font-semibold text-slate-950">
                  حذف المنتج؟
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  سيتم أرشفة &quot;{productToDelete.name}&quot; حتى لا يظهر كمنتج قابل للبيع. لا يتم حذف سجل الطلبات المرتبط به.
                </p>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setProductToDelete(null)}
                disabled={isDeleting}
              >
                إلغاء
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={confirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? "جاري الحذف..." : "حذف المنتج"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  tone = "neutral",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  tone?: "neutral" | "success" | "warning" | "danger";
}) {
  const toneClasses = {
    neutral: "bg-slate-100 text-slate-600",
    success: "bg-emerald-50 text-emerald-700",
    warning: "bg-amber-50 text-amber-700",
    danger: "bg-red-50 text-red-700",
  };

  return (
    <Card className="rounded-lg border-slate-200 shadow-none">
      <CardContent className="flex items-center justify-between p-4">
        <div>
          <p className="text-xs text-slate-500">{label}</p>
          <p className="mt-1 text-2xl font-semibold text-slate-950">{value.toLocaleString("ar-IQ")}</p>
        </div>
        <div className={`flex size-9 items-center justify-center rounded-md ${toneClasses[tone]}`}>
          <Icon className="size-4" />
        </div>
      </CardContent>
    </Card>
  );
}

function SelectFilter({
  label,
  value,
  options,
  onChange,
  fullWidth = false,
}: {
  label: string;
  value: string;
  options: readonly { value: string; label: string }[];
  onChange: (value: string) => void;
  fullWidth?: boolean;
}) {
  return (
    <label className={fullWidth ? "block w-full" : "block min-w-36"}>
      <span className={fullWidth ? "mb-1 block text-xs font-medium text-slate-500" : "sr-only"}>{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
      >
        <option value="">{label}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function TableHeader({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-3 text-right font-medium">{children}</th>;
}

function ProductIdentity({ product }: { product: ProductDto }) {
  const imageUrl = product.image || product.images[0]?.url;

  return (
    <div className="flex items-center gap-3">
      <div className="relative size-11 overflow-hidden rounded-md bg-slate-100 ring-1 ring-slate-200">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            sizes="44px"
            className="object-cover"
          />
        ) : (
          <PackagePlus className="absolute left-1/2 top-1/2 size-5 -translate-x-1/2 -translate-y-1/2 text-slate-400" />
        )}
      </div>
      <div className="min-w-0">
        <p className="truncate font-medium text-slate-950">{product.name}</p>
        <p className="truncate text-xs text-slate-500">{product.brand?.name ?? "بدون ماركة"}</p>
      </div>
    </div>
  );
}

function PriceCell({ product }: { product: ProductDto }) {
  return (
    <div className="space-y-0.5">
      <p className="font-medium text-slate-950">{formatIqd(product.price)}</p>
      {product.comparePrice && (
        <p className="text-xs text-slate-400 line-through">{formatIqd(product.comparePrice)}</p>
      )}
    </div>
  );
}

function StockCell({ product }: { product: ProductDto }) {
  const stock = getStockLabel(product.stock, product.lowStockAt);
  const dotClass = {
    success: "bg-emerald-500",
    warning: "bg-amber-500",
    danger: "bg-red-500",
  }[stock.tone];

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 text-xs text-slate-600">
        <span className={`size-2 rounded-full ${dotClass}`} />
        {stock.label}
      </div>
      <p className="font-medium text-slate-950">{formatQuantity(product.stock)}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: ProductDto["status"] }) {
  const className = {
    ACTIVE: "border-emerald-200 bg-emerald-50 text-emerald-700",
    DRAFT: "border-slate-200 bg-slate-50 text-slate-600",
    INACTIVE: "border-amber-200 bg-amber-50 text-amber-700",
    OUT_OF_STOCK: "border-red-200 bg-red-50 text-red-700",
    ARCHIVED: "border-slate-200 bg-slate-100 text-slate-500",
  }[status];

  return (
    <Badge variant="outline" className={className}>
      {productStatusLabels[status]}
    </Badge>
  );
}

function RowActions({
  product,
  openMenuId,
  setOpenMenuId,
  setProductToDelete,
}: {
  product: ProductDto;
  openMenuId: string | null;
  setOpenMenuId: (id: string | null) => void;
  setProductToDelete: (product: ProductDto) => void;
}) {
  const isOpen = openMenuId === product.id;

  return (
    <div className="relative flex justify-end">
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={`إجراءات ${product.name}`}
        aria-expanded={isOpen}
        onClick={() => setOpenMenuId(isOpen ? null : product.id)}
      >
        <MoreHorizontal className="size-4" />
      </Button>
      {isOpen && (
        <div className="absolute left-0 top-9 z-20 w-36 overflow-hidden rounded-md border border-slate-200 bg-white p-1 text-sm shadow-lg">
          <Link
            href={`/dashboard/products/${product.id}/edit`}
            className="flex items-center gap-2 rounded px-2 py-2 text-slate-700 hover:bg-slate-50"
          >
            <Pencil className="size-4" />
            تعديل
          </Link>
          <button
            type="button"
            onClick={() => setProductToDelete(product)}
            className="flex w-full items-center gap-2 rounded px-2 py-2 text-red-600 hover:bg-red-50"
          >
            <Trash2 className="size-4" />
            حذف
          </button>
        </div>
      )}
    </div>
  );
}

function MobileProductRow({
  product,
  openMenuId,
  setOpenMenuId,
  setProductToDelete,
}: {
  product: ProductDto;
  openMenuId: string | null;
  setOpenMenuId: (id: string | null) => void;
  setProductToDelete: (product: ProductDto) => void;
}) {
  return (
    <div className="p-4">
      <div className="flex items-start justify-between gap-3">
        <ProductIdentity product={product} />
        <RowActions
          product={product}
          openMenuId={openMenuId}
          setOpenMenuId={setOpenMenuId}
          setProductToDelete={setProductToDelete}
        />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-xs text-slate-500">التصنيف</p>
          <p className="mt-1 font-medium text-slate-800">{product.category.name}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">الحالة</p>
          <div className="mt-1">
            <StatusBadge status={product.status} />
          </div>
        </div>
        <PriceCell product={product} />
        <StockCell product={product} />
      </div>
    </div>
  );
}

function Pagination({
  page,
  limit,
  total,
  totalPages,
  onPageChange,
}: {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  const start = total === 0 ? 0 : (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);
  const pages = buildPagination(page, totalPages);

  return (
    <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
      <p>
        عرض {start.toLocaleString("ar-IQ")}–{end.toLocaleString("ar-IQ")} من {total.toLocaleString("ar-IQ")} منتج
      </p>
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronRight className="size-4" />
          السابق
        </Button>
        {pages.map((item, index) =>
          item === "ellipsis" ? (
            <span key={`${item}-${index}`} className="px-2 text-slate-400">
              ...
            </span>
          ) : (
            <Button
              key={item}
              type="button"
              variant={item === page ? "default" : "ghost"}
              size="sm"
              onClick={() => onPageChange(item)}
            >
              {item.toLocaleString("ar-IQ")}
            </Button>
          ),
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          التالي
          <ChevronLeft className="size-4" />
        </Button>
      </div>
    </div>
  );
}

function ProductsSkeleton() {
  return (
    <div className="divide-y divide-slate-100">
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={index} className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-4 px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="size-11 animate-pulse rounded-md bg-slate-100" />
            <div className="space-y-2">
              <div className="h-3 w-36 animate-pulse rounded bg-slate-100" />
              <div className="h-3 w-20 animate-pulse rounded bg-slate-100" />
            </div>
          </div>
          {Array.from({ length: 4 }).map((__, childIndex) => (
            <div key={childIndex} className="space-y-2">
              <div className="h-3 w-20 animate-pulse rounded bg-slate-100" />
              <div className="h-3 w-14 animate-pulse rounded bg-slate-100" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function StateMessage({
  title,
  description,
  actionLabel,
  href,
  onAction,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  href?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex min-h-80 flex-col items-center justify-center px-4 py-12 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
        <Filter className="size-5" />
      </div>
      <h2 className="mt-4 text-lg font-semibold text-slate-950">{title}</h2>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
      {href && actionLabel && (
        <Button asChild className="mt-5">
          <Link href={href}>{actionLabel}</Link>
        </Button>
      )}
      {onAction && actionLabel && (
        <Button type="button" onClick={onAction} className="mt-5">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

function buildPagination(page: number, totalPages: number) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages: Array<number | "ellipsis"> = [1];
  if (page > 4) pages.push("ellipsis");

  const start = Math.max(2, page - 1);
  const end = Math.min(totalPages - 1, page + 1);

  for (let index = start; index <= end; index += 1) {
    pages.push(index);
  }

  if (page < totalPages - 3) pages.push("ellipsis");
  pages.push(totalPages);

  return pages;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ar-IQ", {
    dateStyle: "medium",
  }).format(new Date(value));
}
