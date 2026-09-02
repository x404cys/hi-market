import "server-only";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { ApiError } from "@/lib/api-response";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth/config";
import {
  hasAnyPermission,
  hasPermission,
  rolePermissions,
  type Permission,
} from "@/lib/auth/permissions";
import type { AuthenticatedAdmin } from "@/lib/auth/session-types";

export async function getCurrentUser(): Promise<AuthenticatedAdmin | null> {
  const session = await getServerSession(authOptions);
  const sessionUserId = session?.user?.id;

  if (!sessionUserId) return null;

  const user = await prisma.user.findUnique({
    where: { id: sessionUserId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
    },
  });

  if (!user || !user.isActive) return null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    permissions: rolePermissions[user.role],
  };
}

export async function requireAuth() {
  const user = await getCurrentUser();

  if (!user) {
    throw new ApiError("Unauthenticated", 401);
  }

  return user;
}

export async function requirePermission(permission: Permission) {
  const user = await requireAuth();

  if (!hasPermission(user.role, permission)) {
    throw new ApiError("Forbidden", 403);
  }

  return user;
}

export async function requireAnyPermission(permissions: Permission[]) {
  const user = await requireAuth();

  if (!hasAnyPermission(user.role, permissions)) {
    throw new ApiError("Forbidden", 403);
  }

  return user;
}

export async function requirePagePermission(permission: Permission) {
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/login?callbackUrl=${encodeURIComponent("/dashboard")}`);
  }

  if (!hasPermission(user.role, permission)) {
    redirect("/403");
  }

  return user;
}
