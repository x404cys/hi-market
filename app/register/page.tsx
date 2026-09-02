import { RegisterForm } from "@/components/auth/register-form";
import { Button } from "@/components/ui/button";
import { authOptions } from "@/lib/auth/config";
import { hasActiveOwner } from "@/lib/services/user.service";
import { ShieldCheck } from "lucide-react";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function RegisterPage() {
  const session = await getServerSession(authOptions);

  if (session?.user?.id) {
    redirect("/dashboard");
  }

  const ownerExists = await hasActiveOwner();

  return (
    <main dir="rtl" className="min-h-screen bg-[#f8fafc] px-4 py-10 text-slate-950">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-md items-center">
        <section className="w-full rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <div className="mb-3 flex size-10 items-center justify-center rounded-md bg-slate-950 text-white">
              <ShieldCheck className="size-5" />
            </div>
            <p className="text-xs font-medium text-slate-500">تهيئة لوحة الموظفين</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-normal">
              إنشاء حساب المالك
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              هذه الصفحة تنشئ حساب الإدارة الأول فقط. العملاء يواصلون الشراء كضيوف.
            </p>
          </div>

          {ownerExists ? (
            <div className="space-y-4">
              <p className="rounded-md border border-amber-100 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                تم إنشاء حساب المالك مسبقاً. أضف الموظفين الجدد من لوحة المستخدمين.
              </p>
              <Button asChild className="h-11 w-full rounded-md">
                <Link href="/login">الانتقال لتسجيل الدخول</Link>
              </Button>
            </div>
          ) : (
            <RegisterForm />
          )}
        </section>
      </div>
    </main>
  );
}
