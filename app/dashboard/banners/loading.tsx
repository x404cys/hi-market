export default function BannersLoading() {
  return (
    <main dir="rtl" className="min-h-screen bg-[#f8fafc] px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-5">
        <div className="h-20 rounded-lg bg-slate-100" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-24 rounded-lg bg-slate-100" />
          ))}
        </div>
        <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-16 rounded-md bg-slate-100" />
          ))}
        </div>
      </div>
    </main>
  );
}
