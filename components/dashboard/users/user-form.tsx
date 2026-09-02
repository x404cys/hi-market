"use client";

import type { UserRole } from "@/app/generated/prisma";
import { Button } from "@/components/ui/button";
import { userRoleLabels } from "@/lib/auth/role-labels";
import type { AuthenticatedAdmin } from "@/lib/auth/session-types";
import type { AdminUserDto } from "@/lib/users/user-types";
import type { ApiErrorResponse, ApiSuccess } from "@/lib/products/product-types";
import { Loader2, Save } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

const allRoles: UserRole[] = ["OWNER", "ADMIN", "MANAGER", "STAFF"];

type UserFormProps = {
  mode: "create" | "edit";
  currentUser: AuthenticatedAdmin;
  initialData?: AdminUserDto;
};

type UserFormState = {
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  password: string;
  confirmPassword: string;
};

export function UserForm({
  mode,
  currentUser,
  initialData,
}: UserFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<UserFormState>({
    name: initialData?.name ?? "",
    email: initialData?.email ?? "",
    role: initialData?.role ?? "STAFF",
    isActive: initialData?.isActive ?? true,
    password: "",
    confirmPassword: "",
  });
  const [passwordForm, setPasswordForm] = useState({
    password: "",
    confirmPassword: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const assignableRoles = useMemo(() => getAssignableRoles(currentUser), [currentUser]);
  const canEditStatus = currentUser.permissions.includes("users.deactivate");
  const isSelf = initialData?.id === currentUser.id;

  async function submitUser(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSaving) return;

    setIsSaving(true);
    setMessage(null);
    setError(null);

    const payload =
      mode === "create"
        ? {
            name: form.name,
            email: form.email,
            role: form.role,
            password: form.password,
            confirmPassword: form.confirmPassword,
          }
        : {
            name: form.name,
            email: form.email,
            role: form.role,
            isActive: form.isActive,
          };

    try {
      const response = await fetch(
        mode === "create" ? "/api/users" : `/api/users/${initialData?.id}`,
        {
          method: mode === "create" ? "POST" : "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const json = (await response.json()) as
        | ApiSuccess<AdminUserDto>
        | ApiErrorResponse;

      if (!json.success) {
        setError(translateUserError(json.message));
        return;
      }

      setMessage(mode === "create" ? "تمت إضافة المستخدم" : "تم حفظ المستخدم");
      if (mode === "create") {
        router.push("/dashboard/users");
      } else {
        router.refresh();
      }
    } catch {
      setError("تعذر الاتصال بواجهة المستخدمين.");
    } finally {
      setIsSaving(false);
    }
  }

  async function resetPassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!initialData || isResettingPassword) return;

    setIsResettingPassword(true);
    setPasswordMessage(null);
    setPasswordError(null);

    try {
      const response = await fetch(`/api/users/${initialData.id}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(passwordForm),
      });
      const json = (await response.json()) as
        | ApiSuccess<{ id: string }>
        | ApiErrorResponse;

      if (!json.success) {
        setPasswordError(translateUserError(json.message));
        return;
      }

      setPasswordForm({ password: "", confirmPassword: "" });
      setPasswordMessage("تم تغيير كلمة المرور");
    } catch {
      setPasswordError("تعذر الاتصال بواجهة المستخدمين.");
    } finally {
      setIsResettingPassword(false);
    }
  }

  return (
    <main dir="rtl" className="min-h-screen bg-[#f8fafc] px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl space-y-5">
        <header className="flex flex-col gap-3 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs text-slate-500">المستخدمون</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-normal">
              {mode === "create" ? "إضافة مستخدم" : "تعديل مستخدم"}
            </h1>
          </div>
          <Button asChild variant="outline">
            <Link href="/dashboard/users">العودة</Link>
          </Button>
        </header>

        <form onSubmit={submitUser} className="space-y-5 rounded-lg border border-slate-200 bg-white p-4 shadow-none">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">الاسم</span>
              <input
                value={form.name}
                onChange={(event) => setForm((value) => ({ ...value, name: event.target.value }))}
                className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                required
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">البريد الإلكتروني</span>
              <input
                type="email"
                dir="ltr"
                value={form.email}
                onChange={(event) => setForm((value) => ({ ...value, email: event.target.value }))}
                className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-left text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                required
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">الدور</span>
              <select
                value={form.role}
                onChange={(event) => setForm((value) => ({ ...value, role: event.target.value as UserRole }))}
                className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-50"
                disabled={isSelf && mode === "edit"}
              >
                {allRoles.map((role) => (
                  <option
                    key={role}
                    value={role}
                    disabled={!assignableRoles.includes(role) && role !== initialData?.role}
                  >
                    {userRoleLabels[role]}
                  </option>
                ))}
              </select>
            </label>
            {mode === "edit" && canEditStatus && (
              <label className="flex items-center gap-2 self-end rounded-md border border-slate-200 px-3 py-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  disabled={isSelf}
                  onChange={(event) => setForm((value) => ({ ...value, isActive: event.target.checked }))}
                  className="size-4"
                />
                حساب نشط
              </label>
            )}
          </div>

          {mode === "create" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-700">كلمة المرور</span>
                <input
                  type="password"
                  value={form.password}
                  onChange={(event) => setForm((value) => ({ ...value, password: event.target.value }))}
                  className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                  required
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-700">تأكيد كلمة المرور</span>
                <input
                  type="password"
                  value={form.confirmPassword}
                  onChange={(event) => setForm((value) => ({ ...value, confirmPassword: event.target.value }))}
                  className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                  required
                />
              </label>
            </div>
          )}

          {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          {message && <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p>}

          <div className="flex justify-end gap-2">
            <Button asChild type="button" variant="outline">
              <Link href="/dashboard/users">إلغاء</Link>
            </Button>
            <Button type="submit" disabled={isSaving} className="gap-2 rounded-md bg-slate-950 text-white hover:bg-slate-900">
              {isSaving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              {isSaving ? "جاري الحفظ..." : "حفظ المستخدم"}
            </Button>
          </div>
        </form>

        {mode === "edit" && initialData && currentUser.permissions.includes("users.update") && (
          <form onSubmit={resetPassword} className="space-y-4 rounded-lg border border-slate-200 bg-white p-4 shadow-none">
            <div>
              <h2 className="font-semibold">تغيير كلمة المرور</h2>
              <p className="mt-1 text-sm text-slate-500">استخدم كلمة مرور جديدة من 8 أحرف على الأقل.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <input
                type="password"
                placeholder="كلمة المرور الجديدة"
                value={passwordForm.password}
                onChange={(event) => setPasswordForm((value) => ({ ...value, password: event.target.value }))}
                className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                required
              />
              <input
                type="password"
                placeholder="تأكيد كلمة المرور"
                value={passwordForm.confirmPassword}
                onChange={(event) => setPasswordForm((value) => ({ ...value, confirmPassword: event.target.value }))}
                className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                required
              />
            </div>
            {passwordError && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{passwordError}</p>}
            {passwordMessage && <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{passwordMessage}</p>}
            <Button type="submit" disabled={isResettingPassword} variant="outline" className="gap-2">
              {isResettingPassword && <Loader2 className="size-4 animate-spin" />}
              {isResettingPassword ? "جاري التغيير..." : "تغيير كلمة المرور"}
            </Button>
          </form>
        )}
      </div>
    </main>
  );
}

function getAssignableRoles(currentUser: AuthenticatedAdmin): UserRole[] {
  if (currentUser.role === "OWNER") return allRoles;
  if (currentUser.role === "ADMIN") return ["MANAGER", "STAFF"];
  return [];
}

function translateUserError(message: string) {
  const messages: Record<string, string> = {
    "Email already exists": "البريد الإلكتروني مستخدم مسبقاً.",
    "User not found": "المستخدم غير موجود.",
    "You cannot assign this role": "لا يمكنك تعيين هذا الدور.",
    "You cannot modify this user": "لا يمكنك تعديل هذا المستخدم.",
    "You cannot deactivate your own account": "لا يمكنك تعطيل حسابك الحالي.",
    "At least one active owner is required": "يجب إبقاء مالك نشط واحد على الأقل.",
    "Validation failed": "تحقق من الحقول المدخلة.",
  };

  return messages[message] ?? message ?? "تعذر حفظ المستخدم.";
}
