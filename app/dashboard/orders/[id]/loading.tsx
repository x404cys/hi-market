import { Card, CardContent } from "@/components/ui/card";

export default function OrderDetailsLoading() {
  return (
    <main className="min-h-screen bg-[#f8fafc] px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
        <header className="flex items-center justify-between border-b border-slate-200 pb-5">
          <div className="space-y-2">
            <div className="h-7 w-36 animate-pulse rounded bg-slate-200" />
            <div className="h-4 w-52 animate-pulse rounded bg-slate-100" />
          </div>
          <div className="h-9 w-40 animate-pulse rounded bg-slate-200" />
        </header>
        <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
          <div className="space-y-5">
            <Card className="rounded-lg border-slate-200 bg-white shadow-none">
              <CardContent className="space-y-4 p-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="h-16 animate-pulse rounded bg-slate-100" />
                ))}
              </CardContent>
            </Card>
            <div className="h-52 animate-pulse rounded-lg border border-slate-200 bg-white" />
          </div>
          <div className="space-y-5">
            <div className="h-56 animate-pulse rounded-lg border border-slate-200 bg-white" />
            <div className="h-72 animate-pulse rounded-lg border border-slate-200 bg-white" />
          </div>
        </div>
      </div>
    </main>
  );
}
