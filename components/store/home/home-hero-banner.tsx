import Image from "next/image";
import Link from "next/link";
import type { PublicBannerDto } from "@/lib/banners/banner-types";

const fallbackBanner = {
  title: "خصم يصل إلى 30%",
  description: "استمتع بعروضنا اليومية على المنتجات الطازجة",
  buttonText: "تسوق الآن",
  link: "#best-deals",
  image: "/store/grocery-basket.png",
  mobileImage: null,
};

export function HomeHeroBanner({
  banner,
}: {
  banner?: PublicBannerDto | null;
}) {
  const resolvedBanner = banner ?? fallbackBanner;
  const title = resolvedBanner.title;
  const description = resolvedBanner.description;
  const buttonText = resolvedBanner.buttonText;
  const link = resolvedBanner.link;
  const mobileImage = resolvedBanner.mobileImage;
  const image = resolvedBanner.image;

  return (
    <section className="rounded-[14px] bg-[var(--store-primary-soft)] px-4 py-4">
      <div className="grid min-h-[108px] grid-cols-[1fr_112px] items-center gap-2 overflow-hidden">
        <div className="min-w-0">
          {title && (
            <h1 className="text-[18px] font-bold leading-6 text-[var(--store-primary-strong)]">
              {title}
            </h1>
          )}
          {description && (
            <p className="mt-1 max-w-[170px] text-[11px] leading-4 text-[var(--store-text-muted)]">
              {description}
            </p>
          )}
          {buttonText && link && (
            <Link
              href={link}
              className="mt-3 inline-flex h-8 items-center justify-center rounded-[8px] bg-[var(--store-primary)] px-3 text-xs font-bold text-white shadow-[0_8px_18px_rgba(16,185,129,0.18)]"
            >
              {buttonText}
            </Link>
          )}
        </div>
        <div className="relative h-[104px]">
          {mobileImage && mobileImage !== image ? (
            <>
              <Image
                src={mobileImage}
                alt={title || "بنر إعلاني"}
                fill
                sizes="112px"
                priority
                className="object-contain drop-shadow-[0_14px_18px_rgba(15,23,42,0.12)] md:hidden"
              />
              <Image
                src={image}
                alt={title || "بنر إعلاني"}
                fill
                sizes="112px"
                priority
                className="hidden object-contain drop-shadow-[0_14px_18px_rgba(15,23,42,0.12)] md:block"
              />
            </>
          ) : (
            <Image
              src={image}
              alt={title || "بنر إعلاني"}
              fill
              sizes="112px"
              priority
              className="object-contain drop-shadow-[0_14px_18px_rgba(15,23,42,0.12)]"
            />
          )}
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
