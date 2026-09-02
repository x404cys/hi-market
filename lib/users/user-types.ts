import type { UserRole } from "@/app/generated/prisma";

export type AdminUserDto = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
};
