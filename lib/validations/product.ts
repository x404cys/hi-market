import { z } from "zod";
import { getR2PublicBaseUrl, isOwnedR2PublicUrl } from "@/lib/r2-utils";

export const productUnitValues = [
  "PIECE",
  "KG",
  "GRAM",
  "LITER",
  "ML",
  "PACK",
  "BOX",
  "BOTTLE",
  "CAN",
] as const;

export const productStatusValues = [
  "DRAFT",
  "ACTIVE",
  "INACTIVE",
  "OUT_OF_STOCK",
  "ARCHIVED",
] as const;

const requiredString = z.string().trim().min(1, "Required");
const optionalNullableString = requiredString.nullable().optional();
const idSchema = z.string().trim().uuid("Invalid id");
const MAX_BULK_CATEGORY_PRODUCTS = 200;
const productImageUrlSchema = requiredString.refine(
  (url) => !getR2PublicBaseUrl() || isOwnedR2PublicUrl(url),
  "Product image must be uploaded to R2",
);
const optionalNullableProductImageUrl = productImageUrlSchema
  .nullable()
  .optional();
const productSlugSchema = requiredString.regex(
  /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  "Slug must contain lowercase letters, numbers, and hyphens only",
);

function decimalSchema(options: {
  maxScale: number;
  positive?: boolean;
  nonNegative?: boolean;
}) {
  const pattern = new RegExp(`^\\d+(\\.\\d{1,${options.maxScale}})?$`);

  return z
    .preprocess((value) => {
      if (typeof value === "number") {
        return Number.isFinite(value) ? value.toString() : value;
      }

      if (typeof value === "string") {
        return value.trim();
      }

      return value;
    }, z.string().regex(pattern, `Must be a decimal with at most ${options.maxScale} decimal places`))
    .refine((value) => !options.positive || !/^0+(?:\.0+)?$/.test(value), {
      message: "Must be greater than 0",
    })
    .refine((value) => !options.nonNegative || pattern.test(value), {
      message: "Must be greater than or equal to 0",
    });
}

const moneyDecimal = decimalSchema({ maxScale: 2, positive: true });
const nullableMoneyDecimal = moneyDecimal.nullable().optional();
const quantityDecimal = decimalSchema({ maxScale: 3, positive: true });
const nullableQuantityDecimal = quantityDecimal.nullable().optional();
const nonNegativeQuantityDecimal = decimalSchema({
  maxScale: 3,
  nonNegative: true,
});

const productImageInputSchema = z.union([
  productImageUrlSchema.transform((url) => ({ url })),
  z
    .object({
      url: productImageUrlSchema,
      alt: optionalNullableString,
      sortOrder: z.number().int().min(0).optional(),
    })
    .strict(),
]);

export const productIdSchema = idSchema;

export const createProductSchema = z
  .object({
    name: requiredString,
    slug: productSlugSchema.optional(),
    description: optionalNullableString,
    sku: optionalNullableString,
    barcode: optionalNullableString,
    categoryId: idSchema,
    brandId: idSchema.nullable().optional(),
    price: moneyDecimal,
    comparePrice: nullableMoneyDecimal,
    costPrice: nullableMoneyDecimal,
    unit: z.enum(productUnitValues),
    unitValue: nullableQuantityDecimal,
    isWeighted: z.boolean().optional(),
    minOrderQty: quantityDecimal.optional(),
    orderStep: quantityDecimal.optional(),
    stock: nonNegativeQuantityDecimal.optional(),
    lowStockAt: nonNegativeQuantityDecimal.optional(),
    trackInventory: z.boolean().optional(),
    allowBackorder: z.boolean().optional(),
    image: optionalNullableProductImageUrl,
    images: z.array(productImageInputSchema).max(50).optional(),
    status: z.enum(productStatusValues).optional(),
    isFeatured: z.boolean().optional(),
    sortOrder: z.number().int().optional(),
  })
  .strict();

export const updateProductSchema = createProductSchema
  .partial()
  .omit({ categoryId: true })
  .extend({
    categoryId: idSchema.optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one editable field is required",
  });

export const productQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z
      .string()
      .trim()
      .optional()
      .transform((value) => (value ? value : undefined)),
    categoryId: idSchema.optional(),
    brandId: idSchema.optional(),
    status: z.enum(productStatusValues).optional(),
    stockStatus: z.enum(["available", "low", "out"]).optional(),
    sortBy: z
      .enum(["name", "price", "stock", "status", "sortOrder", "createdAt", "updatedAt"])
      .default("createdAt"),
    order: z.enum(["asc", "desc"]).default("desc"),
  })
  .strict();

export const bulkCategorySchema = z
  .object({
    productIds: z
      .array(idSchema)
      .min(1, "At least one product is required")
      .max(MAX_BULK_CATEGORY_PRODUCTS, `Cannot update more than ${MAX_BULK_CATEGORY_PRODUCTS} products at once`)
      .transform((ids) => Array.from(new Set(ids))),
    categoryId: idSchema,
  })
  .strict()
  .refine((value) => value.productIds.length > 0, {
    message: "At least one product is required",
    path: ["productIds"],
  });

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductQueryInput = z.infer<typeof productQuerySchema>;
export type ProductImageInput = z.infer<typeof productImageInputSchema>;
export type BulkCategoryInput = z.infer<typeof bulkCategorySchema>;
