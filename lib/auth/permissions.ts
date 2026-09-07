import type { UserRole } from "@/lib/prisma-client";

export const permissions = [
  "dashboard.view",
  "products.read",
  "products.create",
  "products.update",
  "products.delete",
  "categories.read",
  "categories.manage",
  "brands.read",
  "brands.manage",
  "banners.read",
  "banners.manage",
  "orders.read",
  "orders.updateStatus",
  "orders.cancel",
  "inventory.read",
  "inventory.manage",
  "coupons.read",
  "coupons.manage",
  "users.read",
  "users.create",
  "users.update",
  "users.deactivate",
  "roles.manage",
] as const;

export type Permission = (typeof permissions)[number];

export const allPermissions = [...permissions];

export const rolePermissions: Record<UserRole, Permission[]> = {
  OWNER: allPermissions,
  ADMIN: [
    "dashboard.view",
    "products.read",
    "products.create",
    "products.update",
    "products.delete",
    "categories.read",
    "categories.manage",
    "brands.read",
    "brands.manage",
    "banners.read",
    "banners.manage",
    "orders.read",
    "orders.updateStatus",
    "orders.cancel",
    "inventory.read",
    "inventory.manage",
    "coupons.read",
    "coupons.manage",
    "users.read",
    "users.create",
    "users.update",
    "users.deactivate",
  ],
  MANAGER: [
    "dashboard.view",
    "products.read",
    "products.create",
    "products.update",
    "categories.read",
    "categories.manage",
    "brands.read",
    "brands.manage",
    "banners.read",
    "banners.manage",
    "orders.read",
    "orders.updateStatus",
    "orders.cancel",
    "inventory.read",
    "inventory.manage",
    "coupons.read",
  ],
  STAFF: [
    "dashboard.view",
    "products.read",
    "orders.read",
    "orders.updateStatus",
    "inventory.read",
  ],
};

export function hasPermission(role: UserRole, permission: Permission) {
  return rolePermissions[role].includes(permission);
}

export function hasAnyPermission(role: UserRole, requiredPermissions: Permission[]) {
  return requiredPermissions.some((permission) => hasPermission(role, permission));
}
