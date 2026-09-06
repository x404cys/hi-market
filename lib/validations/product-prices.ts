import { z } from "zod";
import { MAX_PRICE_UPDATES, validPrice } from "@/lib/products/price-editor";

const price = z.union([z.string(), z.number().finite()])
  .transform(String).refine(validPrice, "أدخل سعراً موجباً بحد أقصى منزلتين عشريتين");
export const bulkPricesSchema = z.object({
  updates: z.array(z.object({ id: z.string().uuid(), price }).strict())
    .min(1).max(MAX_PRICE_UPDATES)
    .refine((updates) => new Set(updates.map((update) => update.id)).size === updates.length, "Duplicate product IDs"),
}).strict();

export const priceQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(100000).default(1),
  search: z.string().trim().max(200).default(""),
  categoryId: z.string().uuid().optional(),
});
