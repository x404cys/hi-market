import { z } from "zod";

export const orderStatusValues = [
  "PENDING",
  "CONFIRMED",
  "PREPARING",
  "READY",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
] as const;

export const orderIdSchema = z.string().trim().uuid("Invalid order id");
export const orderStatusSchema = z.enum(orderStatusValues);

const positiveIntegerFromQuery = (defaultValue: number, maxValue?: number) =>
  z
    .preprocess((value) => {
      if (value === undefined || value === null || value === "") return defaultValue;
      if (typeof value === "string") return Number(value);
      return value;
    }, z.number().int().positive())
    .transform((value) => (maxValue ? Math.min(value, maxValue) : value));

export const orderQuerySchema = z.object({
  page: positiveIntegerFromQuery(1),
  limit: positiveIntegerFromQuery(20, 100),
  search: z.string().trim().optional(),
  status: orderStatusSchema.or(z.literal("active")).optional(),
  date: z.string().trim().optional(),
  deliveryZoneId: z.string().trim().uuid("Invalid delivery zone id").optional(),
  sortBy: z
    .enum(["createdAt", "placedAt", "orderNumber", "total"])
    .default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
});

export const updateOrderStatusSchema = z
  .object({
    status: orderStatusSchema,
    note: z
      .string()
      .trim()
      .max(500, "Note is too long")
      .transform((value) => (value.length > 0 ? value : undefined))
      .optional(),
  })
  .strict();

export type OrderQueryInput = z.infer<typeof orderQuerySchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
