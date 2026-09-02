"use client";

import { cn } from "@/lib/utils";
import type { AuthenticatedAdmin } from "@/lib/auth/session-types";
import { userRoleLabels } from "@/lib/auth/role-labels";
import type { Permission } from "@/lib/auth/permissions";
import {
  Boxes,
  ClipboardList,
  GalleryHorizontal,
  Home,
  Layers3,
  LogOut,
  Tags,
  Settings,
  UserCog,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

const navItems = [
  {
    href: "/dashboard",
    label: "لوحة التحكم",
    icon: Home,
    exact: true,
    permission: "dashboard.view",
  },
  {
    href: "/dashboard/orders",
    label: "الطلبات",
    icon: ClipboardList,
    permission: "orders.read",
  },
  {
    href: "/dashboard/products",
    label: "المنتجات",
    icon: Boxes,
    permission: "products.read",
  },
  {
    href: "/dashboard/categories",
    label: "الأصناف",
    icon: Tags,
    permission: "categories.read",
  },
  {
    href: "/dashboard/banners",
    label: "البنرات",
    icon: GalleryHorizontal,
    permission: "banners.read",
  },
  {
    href: "/dashboard/users",
    label: "المستخدمون",
    icon: UserCog,
    permission: "users.read",
  },
] satisfies Array<{
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
  permission: Permission;
}>;

export function AdminShell({
  children,
  currentUser,
}: {
  children: React.ReactNode;
  currentUser: AuthenticatedAdmin;
}) {
  const pathname = usePathname();
  const allowedNavItems = navItems.filter((item) =>
    currentUser.permissions.includes(item.permission),
  );

  return (
    <div dir="rtl" className="min-h-screen bg-[#f8fafc] text-slate-950">
      <aside className="fixed right-0 top-0 z-30 hidden h-screen w-64 border-l border-slate-200 bg-white lg:block">
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center gap-3 border-b border-slate-100 px-5">
            <div className="flex size-9 items-center justify-center rounded-md bg-slate-950 text-white">
              <Layers3 className="size-4" />
            </div>
            <div>
              <p className="text-sm font-bold">إدارة المتجر</p>
              <p className="text-xs text-slate-500">لوحة الموظفين</p>
            </div>
          </div>

          <nav className="flex-1 space-y-1 px-3 py-4">
            {allowedNavItems.map((item) => {
              const isActive = item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href.split("?")[0]);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-950",
                    isActive && "bg-slate-950 text-white hover:bg-slate-900 hover:text-white",
                  )}
                >
                  <item.icon className="size-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-slate-100 p-3">
            <div className="mb-2 rounded-md bg-slate-50 px-3 py-2">
              <p className="truncate text-sm font-semibold text-slate-950">
                {currentUser.name}
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                {userRoleLabels[currentUser.role]}
              </p>
            </div>
            <Link
              href="/"
              className="flex h-9 items-center gap-3 rounded-md px-3 text-sm font-medium text-slate-500 transition hover:bg-slate-50 hover:text-slate-950"
            >
              <Settings className="size-4" />
              عرض المتجر
            </Link>
            <button
              type="button"
              onClick={() => void signOut({ callbackUrl: "/login" })}
              className="mt-1 flex h-9 w-full items-center gap-3 rounded-md px-3 text-sm font-medium text-red-600 transition hover:bg-red-50"
            >
              <LogOut className="size-4" />
              تسجيل الخروج
            </button>
          </div>
        </div>
      </aside>

      <div className="lg:pr-64">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur lg:px-6">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          
            <nav className="flex items-center gap-1 lg:hidden">
              {allowedNavItems.slice(0, 5).map((item) => {
                const isActive = item.exact
                  ? pathname === item.href
                  : pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-label={item.label}
                    className={cn(
                      "flex size-9 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-50",
                      isActive && "bg-slate-950 text-white",
                    )}
                  >
                    <item.icon className="size-4" />
                  </Link>
                );
              })}
            </nav>
            <div className="flex items-center gap-2">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-semibold text-slate-950">
                  {currentUser.name}
                </p>
                <p className="text-xs text-slate-500">{userRoleLabels[currentUser.role]}</p>
              </div>
              <button
                type="button"
                onClick={() => void signOut({ callbackUrl: "/login" })}
                className="flex size-9 items-center justify-center rounded-md text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                aria-label="تسجيل الخروج"
              >
                <LogOut className="size-4" />
              </button>
            </div>
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}
