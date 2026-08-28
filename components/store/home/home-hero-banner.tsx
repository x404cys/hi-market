import Image from "next/image";
import Link from "next/link";
import type { StoreBanner } from "@/features/catalog/types";

const fallbackBanner: StoreBanner = {
  title: "خصم يصل إلى 30%",
  description: "استمتع بعروضنا اليومية على المنتجات الطازجة",
  buttonText: "تسوق الآن",
  href: "#best-deals",
  imageSrc: "/store/grocery-basket.png",
};

export function HomeHeroBanner({ banner = fallbackBanner }: { banner?: StoreBanner }) {
  return (
    <section className="rounded-[14px] bg-[var(--store-primary-soft)] px-4 py-4">
      <div className="grid min-h-[108px] grid-cols-[1fr_112px] items-center gap-2 overflow-hidden">
        <div className="min-w-0">
          <h1 className="text-[18px] font-bold leading-6 text-[var(--store-primary-strong)]">
            {banner.title}
          </h1>
          <p className="mt-1 max-w-[170px] text-[11px] leading-4 text-[var(--store-text-muted)]">
            {banner.description}
          </p>
          <Link
            href={banner.href}
            className="mt-3 inline-flex h-8 items-center justify-center rounded-[8px] bg-[var(--store-primary)] px-3 text-xs font-bold text-white shadow-[0_8px_18px_rgba(16,185,129,0.18)]"
          >
            {banner.buttonText}
          </Link>
        </div>
        <div className="relative h-[104px]">
          <Image
            src={banner.imageSrc}
            alt=""
            fill
            sizes="112px"
            priority
            className="object-contain drop-shadow-[0_14px_18px_rgba(15,23,42,0.12)]"
          />
        </div>
      </div>
      <div className="mt-3 flex justify-center gap-1.5" aria-label="مؤشرات العروض">
        <span className="size-1.5 rounded-full bg-emerald-200" />
        <span className="size-1.5 rounded-full bg-emerald-200" />
        <span className="h-1.5 w-4 rounded-full bg-[var(--store-primary)]" />
        <span className="size-1.5 rounded-full bg-emerald-200" />
      </div>
    </section>
  );
}
