"use client";

import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Loader2, LockKeyhole } from "lucide-react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type LoginFormProps = {
  callbackUrl?: string;
};

export function LoginForm({ callbackUrl }: LoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const safeCallbackUrl = useMemo(
    () => normalizeCallbackUrl(callbackUrl),
    [callbackUrl],
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl: safeCallbackUrl,
    });

    setIsSubmitting(false);

    if (!result?.ok) {
      setError("البريد الإلكتروني أو كلمة المرور غير صحيحة، أو الحساب غير نشط.");
      return;
    }

    router.push(safeCallbackUrl);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-slate-700">
          البريد الإلكتروني
        </span>
        <input
          type="email"
          dir="ltr"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-left text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
          required
        />
      </label>

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-slate-700">
          كلمة المرور
        </span>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            dir="ltr"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="h-11 w-full rounded-md border border-slate-200 bg-white px-10 text-left text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            required
          />
          <LockKeyhole className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
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
        {isSubmitting && <Loader2 className="size-4 animate-spin" />}
        {isSubmitting ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
      </Button>
    </form>
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
