import { UserRole } from "@/lib/prisma-client";
import { z } from "zod";

const requiredString = z.string().trim().min(1, "Required");
const emailSchema = requiredString.email("Invalid email").max(254);
const passwordSchema = z.string().min(8, "Password must be at least 8 characters").max(128);

export const loginSchema = z
  .object({
    email: emailSchema.transform((value) => value.toLowerCase()),
    password: z.string().min(1, "Required").max(128),
  })
  .strict();

export const createUserSchema = z
  .object({
    name: requiredString.max(120),
    email: emailSchema.transform((value) => value.toLowerCase()),
    password: passwordSchema,
    confirmPassword: z.string(),
    role: z.enum(UserRole),
  })
  .strict()
  .refine((value) => value.password === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

export const registerOwnerSchema = z
  .object({
    name: requiredString.max(120),
    email: emailSchema.transform((value) => value.toLowerCase()),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .strict()
  .refine((value) => value.password === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

export const updateUserSchema = z
  .object({
    name: requiredString.max(120).optional(),
    email: emailSchema.transform((value) => value.toLowerCase()).optional(),
    role: z.enum(UserRole).optional(),
    isActive: z.boolean().optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one editable field is required",
  });

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .strict()
  .refine((value) => value.password === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

export const userIdSchema = z.string().trim().uuid("Invalid user id");

export type LoginInput = z.infer<typeof loginSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type RegisterOwnerInput = z.infer<typeof registerOwnerSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
