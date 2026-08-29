"use client";

import { cn } from "@/lib/utils";
import {
  BarChart3,
  Boxes,
  ClipboardList,
  GalleryHorizontal,
  Home,
  Layers3,
  Settings,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  {
    href: "/dashboard",
    label: "لوحة التحكم",
    icon: Home,
    exact: true,
  },
  {
    href: "/dashboard/orders",
    label: "الطلبات",
    icon: ClipboardList,
  },
  {
    href: "/dashboard/products",
    label: "المنتجات",
    icon: Boxes,
  },
  {
    href: "/dashboard/banners",
    label: "البنرات",
    icon: GalleryHorizontal,
  },
  {
    href: "/dashboard/products?stockStatus=low",
    label: "المخزون",
    icon: BarChart3,
  },
] as const;

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

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
              <p className="text-xs text-slate-500">عمليات السوبرماركت</p>
            </div>
          </div>

          <nav className="flex-1 space-y-1 px-3 py-4">
            {navItems.map((item) => {
              const isActive = "exact" in item && item.exact
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
            <Link
              href="/"
              className="flex h-9 items-center gap-3 rounded-md px-3 text-sm font-medium text-slate-500 transition hover:bg-slate-50 hover:text-slate-950"
            >
              <Settings className="size-4" />
              عرض المتجر
            </Link>
          </div>
        </div>
      </aside>

      <div className="lg:pr-64">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur lg:px-6">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs text-slate-500">لوحة إدارة السوبرماركت</p>
              <p className="truncate text-sm font-semibold text-slate-950">
                متابعة الطلبات والمخزون
              </p>
            </div>
            <nav className="flex items-center gap-1 lg:hidden">
              {navItems.slice(0, 4).map((item) => {
                const isActive = "exact" in item && item.exact
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
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}
