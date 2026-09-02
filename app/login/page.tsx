import { LoginForm } from "@/components/auth/login-form";
import { authOptions } from "@/lib/auth/config";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const session = await getServerSession(authOptions);
  const params = await searchParams;
  const callbackUrl = normalizeCallbackUrl(params.callbackUrl);

  if (session?.user?.id) {
    redirect(callbackUrl);
  }

  return (
    <main dir="rtl" className="min-h-screen bg-[#f8fafc] px-4 py-10 text-slate-950">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-md items-center">
        <section className="w-full rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <p className="text-xs font-medium text-slate-500">لوحة الموظفين</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-normal">
              تسجيل الدخول
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              الدخول مخصص لإدارة المتجر فقط. العملاء يواصلون الشراء كضيوف.
            </p>
          </div>
          <LoginForm callbackUrl={callbackUrl} />
          <p className="mt-5 text-center text-xs text-slate-500">
            لم يتم إنشاء حساب المالك؟{" "}
            <Link href="/register" className="font-semibold text-slate-950 hover:underline">
              إنشاء الحساب الأول
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}

function normalizeCallbackUrl(value: string | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/dashboard";
  }

  if (value.startsWith("/login")) {
    return "/dashboard";
  }

  return value;
}
