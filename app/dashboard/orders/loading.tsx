import { Card, CardContent } from "@/components/ui/card";

export default function OrdersLoading() {
  return (
    <main className="min-h-screen bg-[#f8fafc] px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
        <header className="space-y-2 border-b border-slate-200 pb-5">
          <div className="h-7 w-28 animate-pulse rounded bg-slate-200" />
          <div className="h-4 w-64 animate-pulse rounded bg-slate-100" />
        </header>
        <section className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="h-16 animate-pulse rounded-lg bg-white ring-1 ring-slate-200" />
          ))}
        </section>
        <div className="h-16 animate-pulse rounded-lg border border-slate-200 bg-white" />
        <Card className="rounded-lg border-slate-200 bg-white shadow-none">
          <CardContent className="space-y-4 p-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="h-12 animate-pulse rounded bg-slate-100" />
            ))}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
