import { z } from "zod";
import { isOwnedCategoryR2PublicUrl } from "@/lib/r2-utils";

const requiredText = z.string().trim().min(1, "Required");
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
const optionalId = z
  .string()
  .trim()
  .uuid("Invalid id")
  .optional()
  .nullable()
  .transform((value) => (value ? value : null));

export const categorySlugSchema = requiredText
  .max(140, "Must be 140 characters or fewer")
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Slug must contain lowercase letters, numbers, and hyphens only",
  );

export const categoryImageUrlSchema = z
  .string()
  .trim()
  .optional()
  .nullable()
  .transform((value) => (value ? value : null))
  .refine((url) => !url || isOwnedCategoryR2PublicUrl(url), {
    message: "يجب رفع صورة الصنف إلى R2",
  });

const categoryBaseSchema = z
  .object({
    name: requiredText.max(120, "Must be 120 characters or fewer"),
    slug: categorySlugSchema,
    description: optionalLongText,
    image: categoryImageUrlSchema,
    parentId: optionalId,
    sortOrder: z.coerce.number().int().min(0).max(100000).default(0),
    isActive: z.boolean().default(true),
  })
  .strict();

export const createCategorySchema = categoryBaseSchema;

export const updateCategorySchema = categoryBaseSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one editable field is required",
  });

export const categoryIdSchema = z.string().trim().uuid("Invalid category id");

export const categoryQuerySchema = z.object({
  search: z.string().trim().max(120).optional().default(""),
});

export const quickCategoryImageSchema = categoryImageUrlSchema;

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;

export function normalizeOptionalCategoryText(value: string | null | undefined) {
  return optionalText.parse(value);
}
