"use client";

import { SlidersHorizontal, Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export function StoreSearch({ initialSearch = "" }: { initialSearch?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(initialSearch);

  function submitSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    const search = value.trim();

    if (search) {
      params.set("search", search);
    } else {
      params.delete("search");
    }

    router.push(params.size > 0 ? `/?${params.toString()}` : "/");
  }

  return (
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
      <button
        type="submit"
        className="flex size-10 items-center justify-center rounded-[10px] bg-[var(--store-primary)] text-white  transition hover:bg-[var(--store-primary-strong)] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-emerald-200"
        aria-label="تصفية أو بحث"
      >
        <SlidersHorizontal className="size-4" />
      </button>
    </form>
  );
}
