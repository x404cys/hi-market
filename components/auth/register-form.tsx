"use client";

import { Button } from "@/components/ui/button";
import type { ApiErrorResponse, ApiSuccess } from "@/lib/products/product-types";
import type { AdminUserDto } from "@/lib/users/user-types";
import { Eye, EyeOff, Loader2, UserPlus } from "lucide-react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function RegisterForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = (await response.json()) as
        | ApiSuccess<AdminUserDto>
        | ApiErrorResponse;

      if (!json.success) {
        setError(translateRegisterError(json.message));
        return;
      }

      const loginResult = await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
        callbackUrl: "/dashboard",
      });

      if (!loginResult?.ok) {
        router.push("/login");
        router.refresh();
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("تعذر الاتصال بواجهة التسجيل.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-slate-700">
          اسم المالك
        </span>
        <input
          value={form.name}
          onChange={(event) =>
            setForm((value) => ({ ...value, name: event.target.value }))
          }
          className="h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
          required
        />
      </label>

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-slate-700">
          البريد الإلكتروني
        </span>
        <input
          type="email"
          dir="ltr"
          autoComplete="email"
          value={form.email}
          onChange={(event) =>
            setForm((value) => ({ ...value, email: event.target.value }))
          }
          className="h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-left text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
          required
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-700">
            كلمة المرور
          </span>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              dir="ltr"
              autoComplete="new-password"
              value={form.password}
              onChange={(event) =>
                setForm((value) => ({ ...value, password: event.target.value }))
              }
              className="h-11 w-full rounded-md border border-slate-200 bg-white px-10 text-left text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute left-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
              aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-700">
            تأكيد كلمة المرور
          </span>
          <input
            type={showPassword ? "text" : "password"}
            dir="ltr"
            autoComplete="new-password"
            value={form.confirmPassword}
            onChange={(event) =>
              setForm((value) => ({
                ...value,
                confirmPassword: event.target.value,
              }))
            }
            className="h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-left text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            required
          />
        </label>
      </div>

      {error && (
        <p className="rounded-md border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <Button
        type="submit"
        disabled={isSubmitting}
        className="h-11 w-full gap-2 rounded-md bg-slate-950 text-white hover:bg-slate-900"
      >
        {isSubmitting ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <UserPlus className="size-4" />
        )}
        {isSubmitting ? "جاري إنشاء الحساب..." : "إنشاء حساب المالك"}
      </Button>
    </form>
  );
}

function translateRegisterError(message: string) {
  const messages: Record<string, string> = {
    "Owner registration is closed": "تم إنشاء حساب المالك مسبقاً. استخدم تسجيل الدخول.",
    "Email already exists": "البريد الإلكتروني مستخدم مسبقاً.",
    "Validation failed": "تحقق من الحقول المدخلة. كلمة المرور يجب أن تكون 8 أحرف على الأقل.",
  };

  return messages[message] ?? message ?? "تعذر إنشاء الحساب.";
}
