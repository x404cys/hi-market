import { z } from "zod";
import { isOwnedBannerR2PublicUrl } from "@/lib/r2-utils";

export const bannerPositionValues = ["HERO", "HOME_MIDDLE", "HOME_BOTTOM"] as const;

const optionalText = z
  .string()
  .trim()
  .max(500)
  .optional()
  .nullable()
  .transform((value) => (value ? value : null));

const optionalLongText = z
  .string()
  .trim()
  .max(1200)
  .optional()
  .nullable()
  .transform((value) => (value ? value : null));

const bannerImageUrl = z
  .string()
  .trim()
  .min(1, "صورة البنر مطلوبة")
  .refine((url) => isOwnedBannerR2PublicUrl(url), "يجب رفع صورة البنر إلى R2");

const optionalBannerImageUrl = z
  .string()
  .trim()
  .optional()
  .nullable()
  .transform((value) => (value ? value : null))
  .refine((url) => !url || isOwnedBannerR2PublicUrl(url), {
    message: "يجب رفع صورة الموبايل إلى R2",
  });

const optionalBannerDate = z
  .string()
  .trim()
  .optional()
  .nullable()
  .transform((value) => {
    if (!value) return null;

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toISOString();
  })
  .refine((value) => !value || !Number.isNaN(new Date(value).getTime()), {
    message: "تاريخ غير صالح",
  });

const optionalBannerLink = z
  .string()
  .trim()
  .max(500)
  .optional()
  .nullable()
  .transform((value) => (value ? value : null))
  .refine((value) => !value || isSafeBannerLink(value), {
    message: "رابط البنر غير صالح",
  });

const bannerBaseObjectSchema = z
  .object({
    title: optionalText,
    description: optionalLongText,
    image: bannerImageUrl,
    mobileImage: optionalBannerImageUrl,
    buttonText: optionalText,
    link: optionalBannerLink,
    position: z.enum(bannerPositionValues).default("HERO"),
    isActive: z.boolean().default(true),
    sortOrder: z.coerce.number().int().min(0).max(100000).default(0),
    startsAt: optionalBannerDate,
    endsAt: optionalBannerDate,
  })
  .strict();

export const createBannerSchema = bannerBaseObjectSchema.refine(hasValidDateRange, {
  path: ["endsAt"],
  message: "يجب أن يكون تاريخ الانتهاء بعد تاريخ البدء",
});

export const updateBannerSchema = bannerBaseObjectSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one editable field is required",
  })
  .refine(hasValidDateRange, {
    path: ["endsAt"],
    message: "يجب أن يكون تاريخ الانتهاء بعد تاريخ البدء",
  });

export const bannerIdSchema = z.string().trim().uuid("Invalid banner id");

export type CreateBannerInput = z.infer<typeof createBannerSchema>;
export type UpdateBannerInput = z.infer<typeof updateBannerSchema>;

function isSafeBannerLink(value: string) {
  if (value.startsWith("/")) return !value.startsWith("//");
  if (value.startsWith("?")) return true;

  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function hasValidDateRange(value: { startsAt?: string | null; endsAt?: string | null }) {
  return (
    !value.startsAt ||
    !value.endsAt ||
    new Date(value.endsAt).getTime() > new Date(value.startsAt).getTime()
  );
}
