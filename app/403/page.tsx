import { Button } from "@/components/ui/button";
import { ShieldAlert } from "lucide-react";
import Link from "next/link";

export default function ForbiddenPage() {
  return (
    <main dir="rtl" className="min-h-screen bg-[#f8fafc] px-4 py-10 text-slate-950">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-md items-center">
        <section className="w-full rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm">
          <div className="mx-auto flex size-12 items-center justify-center rounded-md bg-red-50 text-red-600">
            <ShieldAlert className="size-5" />
          </div>
          <h1 className="mt-4 text-xl font-semibold">لا تملك صلاحية الوصول</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            هذا القسم يحتاج صلاحية أعلى من صلاحيات حسابك الحالي.
          </p>
          <Button asChild className="mt-5 rounded-md">
            <Link href="/dashboard">العودة للوحة التحكم</Link>
          </Button>
        </section>
      </div>
    </main>
  );
}
