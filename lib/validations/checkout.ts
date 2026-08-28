import { z } from "zod";

const requiredString = z.string().trim().min(1, "Required");
const optionalString = z
  .string()
  .trim()
  .transform((value) => (value.length > 0 ? value : undefined))
  .optional();
const idSchema = z.string().trim().uuid("Invalid id");

const quantitySchema = z
  .preprocess((value) => {
    if (typeof value === "number") {
      return Number.isFinite(value) ? value.toString() : value;
    }

    if (typeof value === "string") {
      return value.trim();
    }

    return value;
  }, z.string().regex(/^\d+(?:\.\d{1,3})?$/, "Invalid quantity"))
  .refine((value) => !/^0+(?:\.0+)?$/.test(value), {
    message: "Quantity must be greater than 0",
  });

const coordinateSchema = z
  .preprocess((value) => {
    if (typeof value === "number") {
      return Number.isFinite(value) ? value.toString() : value;
    }

    if (typeof value === "string") {
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : undefined;
    }

    return value;
  }, z.string().regex(/^-?\d+(?:\.\d{1,7})?$/, "Invalid coordinate").optional());

export const checkoutItemSchema = z
  .object({
    productId: idSchema,
    quantity: quantitySchema,
  })
  .strict();

export const createGuestOrderSchema = z
  .object({
    customerName: requiredString.min(2, "Customer name is too short"),
    customerPhone: requiredString.min(7, "Customer phone is too short").max(32),
    secondaryPhone: optionalString,
    governorate: optionalString,
    city: optionalString,
    area: optionalString,
    street: optionalString,
    address: requiredString.min(5, "Address is too short"),
    landmark: optionalString,
    latitude: coordinateSchema,
    longitude: coordinateSchema,
    customerNotes: optionalString,
    deliveryZoneId: idSchema.nullable().optional(),
    couponCode: optionalString.transform((value) => value?.toUpperCase()),
    items: z.array(checkoutItemSchema).min(1, "Cart is empty").max(50),
  })
  .strict();

export type CreateGuestOrderInput = z.infer<typeof createGuestOrderSchema>;
