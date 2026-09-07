import type { UserRole } from "@/lib/prisma-client";
import type { Permission } from "@/lib/auth/permissions";

export type AuthenticatedAdmin = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  permissions: Permission[];
};
