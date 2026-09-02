import type { UserRole } from "@/app/generated/prisma";

export const userRoleLabels: Record<UserRole, string> = {
  OWNER: "المالك",
  ADMIN: "مدير النظام",
  MANAGER: "مدير",
  STAFF: "موظف",
};
