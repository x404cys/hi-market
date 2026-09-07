import type { UserRole } from "@/lib/prisma-client";

export const userRoleLabels: Record<UserRole, string> = {
  OWNER: "المالك",
  ADMIN: "مدير النظام",
  MANAGER: "مدير",
  STAFF: "موظف",
};
