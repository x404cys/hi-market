"use client";

import { BadgePercent, Heart, Home, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { CartSheet } from "@/components/store/cart/cart-sheet";
import { useCartSummary } from "@/features/cart/store";
import { useFavoritesSummary } from "@/features/favorites/store";

const navItems = [
  { label: "الرئيسية", href: "/", icon: Home },
  { label: "العروض", href: "/offers", icon: BadgePercent },
  { label: "السلة", href: "/cart", icon: ShoppingBag, cart: true },
  { label: "المفضلة", href: "/favorites", icon: Heart, favorites: true },
];

export function BottomNavigation() {
  const pathname = usePathname();
  const { itemCount } = useCartSummary();
  const { count: favoritesCount } = useFavoritesSummary();
  const [cartOpen, setCartOpen] = useState(false);

  function handleNavClick(
    event: React.MouseEvent<HTMLAnchorElement>,
    item: (typeof navItems)[number],
  ) {
    if (!item.cart) return;
    if (!window.matchMedia("(max-width: 767px)").matches) return;

    event.preventDefault();
    setCartOpen(true);
  }

  return (
    <>
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--store-border)] bg-white px-3 pb-[calc(env(safe-area-inset-bottom)+0.45rem)] pt-2 md:hidden"
        aria-label="التنقل الرئيسي"
      >
        <div className="mx-auto grid max-w-md grid-cols-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));
            const content = (
              <>
                <span className="relative">
                  <Icon className="size-[19px]" />
                  {item.cart && itemCount > 0 && (
                    <span className="absolute -right-2 -top-2 flex min-w-4 items-center justify-center rounded-full bg-[var(--store-primary)] px-1 text-[10px] leading-4 text-white">
                      {itemCount > 99 ? "99+" : itemCount.toLocaleString("ar-IQ")}
                    </span>
                  )}
                  {item.favorites && favoritesCount > 0 && (
                    <span className="absolute -right-2 -top-2 flex min-w-4 items-center justify-center rounded-full bg-[var(--store-primary)] px-1 text-[10px] leading-4 text-white">
                      {favoritesCount > 99
                        ? "99+"
                        : favoritesCount.toLocaleString("ar-IQ")}
                    </span>
                  )}
                </span>
                <span className="mt-1 text-[10px] font-medium">{item.label}</span>
              </>
            );

            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={(event) => handleNavClick(event, item)}
                className={`flex min-h-12 flex-col items-center justify-center rounded-lg transition active:bg-slate-50 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-emerald-200 ${
                  active ? "text-[var(--store-primary)]" : "text-[var(--store-muted)]"
                }`}
              >
                {content}
              </Link>
            );
          })}
        </div>
      </nav>
      <CartSheet open={cartOpen} onOpenChange={setCartOpen} />
    </>
  );
}
