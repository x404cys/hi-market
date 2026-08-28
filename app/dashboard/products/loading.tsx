import { Card, CardContent } from "@/components/ui/card";

export default function ProductsLoading() {
  return (
    <main dir="rtl" className="min-h-screen bg-[#f8fafc] text-slate-950">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between border-b border-slate-200 pb-5">
          <div className="space-y-2">
            <div className="h-7 w-28 animate-pulse rounded bg-slate-200" />
            <div className="h-4 w-64 animate-pulse rounded bg-slate-100" />
          </div>
          <div className="h-9 w-28 animate-pulse rounded bg-slate-200" />
        </header>
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} className="rounded-lg border-slate-200 shadow-none">
              <CardContent className="space-y-3 p-4">
                <div className="h-3 w-24 animate-pulse rounded bg-slate-100" />
                <div className="h-7 w-14 animate-pulse rounded bg-slate-200" />
              </CardContent>
            </Card>
          ))}
        </section>
        <div className="h-16 animate-pulse rounded-lg border border-slate-200 bg-white" />
        <div className="h-96 animate-pulse rounded-lg border border-slate-200 bg-white" />
      </div>
    </main>
  );
}
