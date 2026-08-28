import { Bell, ChevronDown, MapPin } from "lucide-react";
import { StoreSearch } from "@/components/store/search/store-search";

export function StoreHeader({ search }: { search?: string }) {
  return (
    <header className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-medium text-[var(--store-text-muted)]">
            الموقع
          </p>
          <button
            type="button"
            className="mt-1 flex min-w-0 items-center gap-1 text-sm font-bold text-[var(--store-text)]"
          >
            <MapPin className="size-4 shrink-0 fill-[var(--store-primary)] text-[var(--store-primary)]" />
            <span className="truncate">بغداد، العراق</span>
            <ChevronDown className="size-3.5 shrink-0 text-[var(--store-muted)]" />
          </button>
        </div>
        <button
          type="button"
          className="relative flex size-9 shrink-0 items-center justify-center rounded-full bg-white text-[var(--store-text)]  ring-1 ring-[var(--store-border)]"
          aria-label="الإشعارات"
        >
          <Bell className="size-4" />
          <span className="absolute right-2 top-2 size-1.5 rounded-full bg-red-500" />
        </button>
      </div>
      <StoreSearch initialSearch={search} />
    </header>
  );
}
