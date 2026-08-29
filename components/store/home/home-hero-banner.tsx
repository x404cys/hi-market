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
    <section className="overflow-hidden rounded-lg border border-emerald-100 bg-[var(--store-primary-soft)] px-4 py-4">
      <div className="grid min-h-[104px] grid-cols-[1fr_108px] items-center gap-3 md:grid-cols-[1fr_180px]">
        <div className="min-w-0">
          {title && (
            <h1 className="text-lg font-semibold leading-6 text-[var(--store-primary-strong)] md:text-xl">
              {title}
            </h1>
          )}
          {description && (
            <p className="mt-1 max-w-[260px] text-xs leading-5 text-[var(--store-text-muted)]">
              {description}
            </p>
          )}
          {buttonText && link && (
            <Link
              href={link}
              className="mt-3 inline-flex h-9 items-center justify-center rounded-lg bg-[var(--store-primary)] px-4 text-xs font-semibold text-white transition hover:bg-[var(--store-primary-strong)] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-emerald-200"
            >
              {buttonText}
            </Link>
          )}
        </div>
        <div className="relative h-[104px] md:h-[140px]">
          {mobileImage && mobileImage !== image ? (
            <>
              <Image
                src={mobileImage}
                alt={title || "بنر إعلاني"}
                fill
                sizes="112px"
                priority
                className="object-contain md:hidden"
              />
              <Image
                src={image}
                alt={title || "بنر إعلاني"}
                fill
                sizes="180px"
                priority
                className="hidden object-contain md:block"
              />
            </>
          ) : (
            <Image
              src={image}
              alt={title || "بنر إعلاني"}
              fill
              sizes="(min-width: 768px) 180px, 108px"
              priority
              className="object-contain"
            />
          )}
        </div>
      </div>
    </section>
  );
}
