import { UserRowActions } from "@/components/dashboard/users/user-list-actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { userRoleLabels } from "@/lib/auth/role-labels";
import { requirePagePermission } from "@/lib/auth/guards";
import { listAdminUsers } from "@/lib/services/user.service";
import type { AdminUserDto } from "@/lib/users/user-types";
import { Plus, UserCog } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const currentUser = await requirePagePermission("users.read");
  const users = await listAdminUsers();
  const canCreate = currentUser.permissions.includes("users.create");

  return (
    <main dir="rtl" className="min-h-screen bg-[#f8fafc] px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-5">
        <header className="flex flex-col gap-3 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs text-slate-500">الأمان والصلاحيات</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-normal">
              المستخدمون
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              إدارة حسابات موظفي لوحة التحكم فقط.
            </p>
          </div>
          {canCreate && (
            <Button asChild className="gap-2 rounded-md bg-slate-950 text-white hover:bg-slate-900">
              <Link href="/dashboard/users/new">
                <Plus className="size-4" />
                إضافة مستخدم
              </Link>
            </Button>
          )}
        </header>

        {users.length === 0 ? (
          <Card className="items-center rounded-lg border-slate-200 px-5 py-12 text-center shadow-none">
            <UserCog className="size-10 text-slate-400" />
            <h2 className="mt-3 text-lg font-semibold">لا توجد حسابات موظفين</h2>
            <p className="mt-2 text-sm text-slate-500">
              أنشئ حساب مالك أولي من سطر الأوامر ثم سجّل الدخول.
            </p>
          </Card>
        ) : (
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-right text-sm">
                <thead className="bg-slate-50 text-xs text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">المستخدم</th>
                    <th className="px-4 py-3 font-medium">الدور</th>
                    <th className="px-4 py-3 font-medium">الحالة</th>
                    <th className="px-4 py-3 font-medium">آخر دخول</th>
                    <th className="px-4 py-3 font-medium">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td className="px-4 py-3">
                        <UserIdentity user={user} />
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {userRoleLabels[user.role]}
                      </td>
                      <td className="px-4 py-3">
                        <UserStatus isActive={user.isActive} />
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">
                        {formatDateTime(user.lastLoginAt)}
                      </td>
                      <td className="px-4 py-3">
                        <UserRowActions user={user} currentUser={currentUser} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-slate-100 md:hidden">
              {users.map((user) => (
                <article key={user.id} className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <UserIdentity user={user} />
                    <UserStatus isActive={user.isActive} />
                  </div>
                  <div className="text-sm text-slate-600">
                    <p>{userRoleLabels[user.role]}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      آخر دخول: {formatDateTime(user.lastLoginAt)}
                    </p>
                  </div>
                  <UserRowActions user={user} currentUser={currentUser} />
                </article>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function UserIdentity({ user }: { user: AdminUserDto }) {
  return (
    <div className="min-w-0">
      <p className="truncate font-semibold text-slate-950">{user.name}</p>
      <p className="mt-1 truncate text-xs text-slate-500" dir="ltr">
        {user.email}
      </p>
    </div>
  );
}

function UserStatus({ isActive }: { isActive: boolean }) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${
        isActive
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-slate-200 bg-slate-100 text-slate-500"
      }`}
    >
      {isActive ? "نشط" : "معطل"}
    </span>
  );
}

function formatDateTime(value: string | null) {
  if (!value) return "لم يسجل الدخول";

  return new Intl.DateTimeFormat("ar-IQ", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
