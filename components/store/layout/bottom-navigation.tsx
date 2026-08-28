"use client";

import { Heart, Home, Menu, ReceiptText, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCartSummary } from "@/features/cart/store";

const navItems = [
  { label: "الرئيسية", href: "/", icon: Home },
  { label: "السلة", href: "/cart", icon: ShoppingBag, cart: true },
  { label: "المفضلة", href: null, icon: Heart },
  { label: "طلباتي", href: null, icon: ReceiptText },
  { label: "المزيد", href: null, icon: Menu },
];

export function BottomNavigation() {
  const pathname = usePathname();
  const { itemCount } = useCartSummary();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--store-border)] bg-white/95 px-3 pb-[calc(env(safe-area-inset-bottom)+0.45rem)] pt-2 shadow-[0_-10px_24px_rgba(15,23,42,0.08)] backdrop-blur md:hidden"
      aria-label="التنقل الرئيسي"
    >
      <div className="mx-auto grid max-w-md grid-cols-5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = item.href ? pathname === item.href : false;
          const content = (
            <>
              <span className="relative">
                <Icon className="size-[18px]" />
                {item.cart && itemCount > 0 && (
                  <span className="absolute -right-2 -top-2 flex min-w-4 items-center justify-center rounded-full bg-[var(--store-primary)] px-1 text-[10px] leading-4 text-white">
                    {itemCount > 99 ? "99+" : itemCount.toLocaleString("ar-IQ")}
                  </span>
                )}
              </span>
              <span className="mt-1 text-[10px] font-medium">{item.label}</span>
            </>
          );

          if (!item.href) {
            return (
              <button
                key={item.label}
                type="button"
                className="flex flex-col items-center justify-center text-[var(--store-muted)]"
                aria-disabled="true"
                title="غير متاح حالياً"
              >
                {content}
              </button>
            );
          }

          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex flex-col items-center justify-center ${
                active ? "text-[var(--store-primary)]" : "text-[var(--store-muted)]"
              }`}
            >
              {content}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
