import type { UserRole } from "@/lib/prisma-client";
import type { Prisma as PrismaTypes } from "@/app/generated/prisma/edge";
import { ApiError } from "@/lib/api-response";
import type { AuthenticatedAdmin } from "@/lib/auth/session-types";
import { hashPassword } from "@/lib/auth/password";
import prisma from "@/lib/prisma";
import type { AdminUserDto } from "@/lib/users/user-types";
import type {
  CreateUserInput,
  RegisterOwnerInput,
  ResetPasswordInput,
  UpdateUserInput,
} from "@/lib/validations/auth";

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  isActive: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies PrismaTypes.UserSelect;

type UserRecord = PrismaTypes.UserGetPayload<{
  select: typeof userSelect;
}>;

const adminAssignableRoles: UserRole[] = ["MANAGER", "STAFF"];

export async function hasActiveOwner() {
  const owner = await prisma.user.findFirst({
    where: { role: "OWNER", isActive: true },
    select: { id: true },
  });

  return Boolean(owner);
}

export async function registerInitialOwner(
  input: RegisterOwnerInput,
): Promise<AdminUserDto> {
  const activeOwnerExists = await hasActiveOwner();

  if (activeOwnerExists) {
    throw new ApiError("Owner registration is closed", 409);
  }

  try {
    const user = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash: await hashPassword(input.password),
        role: "OWNER",
        isActive: true,
      },
      select: userSelect,
    });

    return serializeUser(user);
  } catch (error) {
    mapUserWriteError(error);
  }
}

export async function listAdminUsers(): Promise<AdminUserDto[]> {
  const users = await prisma.user.findMany({
    orderBy: [{ role: "asc" }, { createdAt: "desc" }],
    select: userSelect,
  });

  return users.map(serializeUser);
}

export async function getAdminUserById(id: string): Promise<AdminUserDto> {
  const user = await prisma.user.findUnique({
    where: { id },
    select: userSelect,
  });

  if (!user) {
    throw new ApiError("User not found", 404);
  }

  return serializeUser(user);
}

export async function createAdminUser(
  actor: AuthenticatedAdmin,
  input: CreateUserInput,
): Promise<AdminUserDto> {
  assertCanAssignRole(actor, input.role);

  try {
    const user = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash: await hashPassword(input.password),
        role: input.role,
      },
      select: userSelect,
    });

    return serializeUser(user);
  } catch (error) {
    mapUserWriteError(error);
  }
}

export async function updateAdminUser(
  actor: AuthenticatedAdmin,
  id: string,
  input: UpdateUserInput,
): Promise<AdminUserDto> {
  const current = await getCurrentUserRecord(id);

  assertCanModifyUser(actor, current);
  if (input.role !== undefined) {
    assertCanAssignRole(actor, input.role);
    await assertCanChangeRole(current, input.role);
  }
  if (input.isActive === false) {
    await assertCanDeactivateUser(actor, current);
  }

  try {
    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.email !== undefined ? { email: input.email } : {}),
        ...(input.role !== undefined ? { role: input.role } : {}),
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      },
      select: userSelect,
    });

    return serializeUser(user);
  } catch (error) {
    mapUserWriteError(error);
  }
}

export async function resetAdminUserPassword(
  actor: AuthenticatedAdmin,
  id: string,
  input: ResetPasswordInput,
): Promise<{ id: string }> {
  const current = await getCurrentUserRecord(id);
  assertCanModifyUser(actor, current);

  const user = await prisma.user.update({
    where: { id },
    data: {
      passwordHash: await hashPassword(input.password),
    },
    select: { id: true },
  });

  return user;
}

export async function setAdminUserActiveState(
  actor: AuthenticatedAdmin,
  id: string,
  isActive: boolean,
): Promise<AdminUserDto> {
  const current = await getCurrentUserRecord(id);
  assertCanModifyUser(actor, current);

  if (!isActive) {
    await assertCanDeactivateUser(actor, current);
  }

  const user = await prisma.user.update({
    where: { id },
    data: { isActive },
    select: userSelect,
  });

  return serializeUser(user);
}

async function getCurrentUserRecord(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: userSelect,
  });

  if (!user) {
    throw new ApiError("User not found", 404);
  }

  return user;
}

function assertCanAssignRole(actor: AuthenticatedAdmin, role: UserRole) {
  if (actor.role === "OWNER") return;

  if (actor.role === "ADMIN" && adminAssignableRoles.includes(role)) {
    return;
  }

  throw new ApiError("You cannot assign this role", 403);
}

function assertCanModifyUser(actor: AuthenticatedAdmin, target: UserRecord) {
  if (actor.role === "OWNER") return;

  if (target.role === "OWNER" || target.role === "ADMIN") {
    throw new ApiError("You cannot modify this user", 403);
  }
}

async function assertCanChangeRole(current: UserRecord, nextRole: UserRole) {
  if (current.role === "OWNER" && nextRole !== "OWNER") {
    await assertAnotherActiveOwnerExists(current.id);
  }
}

async function assertCanDeactivateUser(
  actor: AuthenticatedAdmin,
  target: UserRecord,
) {
  if (actor.id === target.id) {
    throw new ApiError("You cannot deactivate your own account", 400);
  }

  if (target.role === "OWNER") {
    await assertAnotherActiveOwnerExists(target.id);
  }
}

async function assertAnotherActiveOwnerExists(excludedUserId: string) {
  const activeOwnerCount = await prisma.user.count({
    where: {
      role: "OWNER",
      isActive: true,
      id: { not: excludedUserId },
    },
  });

  if (activeOwnerCount < 1) {
    throw new ApiError("At least one active owner is required", 400);
  }
}

function serializeUser(user: UserRecord): AdminUserDto {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

function mapUserWriteError(error: unknown): never {
  if (isUniqueConstraintError(error)) {
    throw new ApiError("Email already exists", 409, {
      email: ["Email already exists"],
    });
  }

  throw error;
}

function isUniqueConstraintError(error: unknown): error is { code: string } {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "P2002"
  );
}
