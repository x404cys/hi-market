import { Card, CardContent } from "@/components/ui/card";

export default function DashboardLoading() {
  return (
    <main className="min-h-screen bg-[#f8fafc] px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
        <header className="flex items-center justify-between border-b border-slate-200 pb-5">
          <div className="space-y-2">
            <div className="h-5 w-24 animate-pulse rounded bg-slate-200" />
            <div className="h-7 w-36 animate-pulse rounded bg-slate-200" />
            <div className="h-4 w-64 animate-pulse rounded bg-slate-100" />
          </div>
          <div className="h-9 w-28 animate-pulse rounded bg-slate-200" />
        </header>
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} className="rounded-lg border-slate-200 bg-white shadow-none">
              <CardContent className="space-y-3 p-4">
                <div className="h-3 w-24 animate-pulse rounded bg-slate-100" />
                <div className="h-7 w-20 animate-pulse rounded bg-slate-200" />
                <div className="h-3 w-28 animate-pulse rounded bg-slate-100" />
              </CardContent>
            </Card>
          ))}
        </section>
        <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
          <div className="h-96 animate-pulse rounded-lg border border-slate-200 bg-white" />
          <div className="space-y-5">
            <div className="h-56 animate-pulse rounded-lg border border-slate-200 bg-white" />
            <div className="h-44 animate-pulse rounded-lg border border-slate-200 bg-white" />
          </div>
        </div>
      </div>
    </main>
  );
}
