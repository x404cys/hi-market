export default function ProductLoading() {
  return (
    <main
      dir="rtl"
      className="min-h-screen bg-white pb-28 text-[var(--store-text)]"
    >
      <div className="mx-auto max-w-md md:max-w-3xl">
        <div className="flex h-14 items-center justify-between px-5">
          <div className="size-9 animate-pulse rounded-full bg-slate-100" />
          <div className="h-4 w-24 animate-pulse rounded bg-slate-100" />
          <div className="size-9 animate-pulse rounded-full bg-slate-100" />
        </div>
        <div className="rounded-b-[28px] bg-[#f7f7f7] px-5 pb-7 pt-3">
          <div className="mx-auto aspect-square max-w-[360px] animate-pulse rounded-xl bg-slate-100" />
          <div className="mx-auto mt-3 h-1.5 w-5 rounded-full bg-emerald-200" />
        </div>
        <div className="space-y-4 px-5 pt-5">
          <div className="h-3 w-16 animate-pulse rounded bg-slate-100" />
          <div className="h-6 w-44 animate-pulse rounded bg-slate-100" />
          <div className="h-16 animate-pulse rounded bg-slate-100" />
          <div className="h-36 animate-pulse rounded bg-slate-100" />
        </div>
      </div>
    </main>
  );
}
