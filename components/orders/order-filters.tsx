"use client";

import { Button } from "@/components/ui/button";
import { orderStatusLabels, orderStatusOptions } from "@/lib/orders/order-format";
import type { DeliveryZoneDto } from "@/lib/delivery/delivery-types";
import { RefreshCw, Search, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useRef, useState } from "react";

export function OrderFilters({ zones }: { zones: DeliveryZoneDto[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [searchValue, setSearchValue] = useState(searchParams.get("search") ?? "");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const status = searchParams.get("status") ?? "";
  const date = searchParams.get("date") ?? "";
  const deliveryZoneId = searchParams.get("deliveryZoneId") ?? "";
  const sortBy = searchParams.get("sortBy") ?? "createdAt";
  const order = searchParams.get("order") ?? "desc";
  const hasFilters = Boolean(searchValue || status || date || deliveryZoneId);

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());

    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }

    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  }

  function updateSearch(value: string) {
    setSearchValue(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      updateParam("search", value.trim());
    }, 300);
  }

  function updateSort(value: string) {
    const [nextSortBy, nextOrder] = value.split(":");
    const params = new URLSearchParams(searchParams.toString());
    params.set("sortBy", nextSortBy);
    params.set("order", nextOrder);
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  }

  function clearFilters() {
    setSearchValue("");
    router.push(pathname);
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">بحث في الطلبات</span>
          <Search className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            value={searchValue}
            onChange={(event) => updateSearch(event.target.value)}
            className="h-10 w-full rounded-md border border-slate-200 bg-white pr-9 pl-3 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            placeholder="ابحث برقم الطلب، اسم العميل أو الهاتف..."
          />
        </label>

        <select
          value={status}
          onChange={(event) => updateParam("status", event.target.value)}
          className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
        >
          <option value="">كل الحالات</option>
          <option value="active">قيد التنفيذ</option>
          {orderStatusOptions.map((option) => (
            <option key={option} value={option}>
              {orderStatusLabels[option]}
            </option>
          ))}
        </select>

        <select
          value={date}
          onChange={(event) => updateParam("date", event.target.value)}
          className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
        >
          <option value="">كل التواريخ</option>
          <option value="today">اليوم</option>
          <option value="yesterday">أمس</option>
        </select>

        {zones.length > 0 && (
          <select
            value={deliveryZoneId}
            onChange={(event) => updateParam("deliveryZoneId", event.target.value)}
            className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
          >
            <option value="">كل مناطق التوصيل</option>
            {zones.map((zone) => (
              <option key={zone.id} value={zone.id}>
                {zone.name}
              </option>
            ))}
          </select>
        )}

        <select
          value={`${sortBy}:${order}`}
          onChange={(event) => updateSort(event.target.value)}
          className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
        >
          <option value="createdAt:desc">الأحدث</option>
          <option value="createdAt:asc">الأقدم</option>
          <option value="orderNumber:desc">رقم الطلب: الأعلى</option>
          <option value="total:desc">الإجمالي: الأعلى</option>
          <option value="total:asc">الإجمالي: الأقل</option>
        </select>

        <Button
          type="button"
          variant="outline"
          onClick={() => router.refresh()}
          className="h-10 gap-2 rounded-md"
        >
          <RefreshCw className="size-4" />
          تحديث
        </Button>
      </div>

      {hasFilters && (
        <div className="mt-3">
          <button
            type="button"
            onClick={clearFilters}
            className="inline-flex h-7 items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 text-xs text-slate-700 hover:bg-white"
          >
            <X className="size-3" />
            مسح الفلاتر
          </button>
        </div>
      )}
    </div>
  );
}
