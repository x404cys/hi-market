import { z } from "zod";
import {
  MAX_BANNER_IMAGE_SIZE_BYTES,
  MAX_CATEGORY_IMAGE_SIZE_BYTES,
  MAX_PRODUCT_IMAGE_SIZE_BYTES,
  productImageMimeTypes,
} from "@/lib/r2-utils";

export const productImagePresignSchema = z
  .object({
    fileName: z.string().trim().min(1).max(255),
    fileType: z.enum(productImageMimeTypes),
    fileSize: z.number().int().positive().max(MAX_PRODUCT_IMAGE_SIZE_BYTES),
  })
  .strict();

export const deleteProductImageSchema = z
  .object({
    key: z.string().trim().min(1),
  })
  .strict();

export const bannerImagePresignSchema = z
  .object({
    fileName: z.string().trim().min(1).max(255),
    fileType: z.enum(productImageMimeTypes),
    fileSize: z.number().int().positive().max(MAX_BANNER_IMAGE_SIZE_BYTES),
  })
  .strict();

export const deleteBannerImageSchema = z
  .object({
    key: z.string().trim().min(1),
  })
  .strict();

export const categoryImagePresignSchema = z
  .object({
    fileName: z.string().trim().min(1).max(255),
    fileType: z.enum(productImageMimeTypes),
    fileSize: z.number().int().positive().max(MAX_CATEGORY_IMAGE_SIZE_BYTES),
  })
  .strict();

export const deleteCategoryImageSchema = z
  .object({
    key: z.string().trim().min(1),
  })
  .strict();

export type ProductImagePresignInput = z.infer<typeof productImagePresignSchema>;
export type BannerImagePresignInput = z.infer<typeof bannerImagePresignSchema>;
export type CategoryImagePresignInput = z.infer<typeof categoryImagePresignSchema>;
