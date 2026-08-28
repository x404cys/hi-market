import { z } from "zod";

const requiredString = z.string().trim().min(1, "Required");

export const quickCreateCategorySchema = z
  .object({
    name: requiredString.max(120, "Must be 120 characters or fewer"),
    slug: requiredString
      .max(140, "Must be 140 characters or fewer")
      .regex(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        "Slug must contain lowercase letters, numbers, and hyphens only",
      ),
  })
  .strict();

export const quickCreateBrandSchema = z
  .object({
    name: requiredString.max(120, "Must be 120 characters or fewer"),
    slug: requiredString
      .max(140, "Must be 140 characters or fewer")
      .regex(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        "Slug must contain lowercase letters, numbers, and hyphens only",
      ),
  })
  .strict();

export type QuickCreateCategoryInput = z.infer<typeof quickCreateCategorySchema>;
export type QuickCreateBrandInput = z.infer<typeof quickCreateBrandSchema>;
