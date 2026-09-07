import type { Prisma as PrismaTypes } from "@/app/generated/prisma/edge";
import { ApiError } from "@/lib/api-response";
import type {
  CategoryDto,
  CategoryListSummary,
} from "@/lib/categories/category-types";
import { deleteCategoryImageObjects } from "@/lib/r2";
import { getOwnedCategoryImageKeyFromUrl } from "@/lib/r2-utils";
import prisma from "@/lib/prisma";
import type {
  CreateCategoryInput,
  UpdateCategoryInput,
} from "@/lib/validations/category";

const categorySelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  image: true,
  icon: true,
  parentId: true,
  parent: {
    select: {
      id: true,
      name: true,
      slug: true,
    },
  },
  sortOrder: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  _count: {
    select: {
      products: true,
      children: true,
    },
  },
} satisfies PrismaTypes.CategorySelect;

type CategoryRecord = PrismaTypes.CategoryGetPayload<{
  select: typeof categorySelect;
}>;

export async function listDashboardCategories(options?: { search?: string }) {
  const search = options?.search?.trim();
  const where: PrismaTypes.CategoryWhereInput = search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { slug: { contains: search, mode: "insensitive" } },
        ],
      }
    : {};

  const categories = await prisma.category.findMany({
    where,
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: categorySelect,
  });
  const serialized = categories.map(serializeCategory);

  return {
    data: serialized,
    summary: buildCategorySummary(serialized),
  };
}

export async function getCategoryById(id: string) {
  const category = await prisma.category.findUnique({
    where: { id },
    select: categorySelect,
  });

  if (!category) {
    throw new ApiError("Category not found", 404);
  }

  return serializeCategory(category);
}

export async function createCategory(input: CreateCategoryInput) {
  await ensureParentCanBeUsed(input.parentId ?? null);

  try {
    const category = await prisma.category.create({
      data: {
        name: input.name,
        slug: input.slug,
        description: input.description,
        image: input.image,
        sortOrder: input.sortOrder,
        isActive: input.isActive,
        ...(input.parentId
          ? { parent: { connect: { id: input.parentId } } }
          : {}),
      },
      select: categorySelect,
    });

    return serializeCategory(category);
  } catch (error) {
    mapCategoryWriteError(error);
  }
}

export async function updateCategory(id: string, input: UpdateCategoryInput) {
  const current = await prisma.category.findUnique({
    where: { id },
    select: categorySelect,
  });

  if (!current) {
    throw new ApiError("Category not found", 404);
  }

  if (input.parentId !== undefined) {
    await ensureParentCanBeUsed(input.parentId, id);
  }

  try {
    const updated = await prisma.category.update({
      where: { id },
      data: buildCategoryUpdateData(input),
      select: categorySelect,
    });

    await cleanupReplacedCategoryImage(current, updated);

    return serializeCategory(updated);
  } catch (error) {
    mapCategoryWriteError(error);
  }
}

export async function deleteCategory(id: string) {
  const category = await prisma.category.findUnique({
    where: { id },
    select: categorySelect,
  });

  if (!category) {
    throw new ApiError("Category not found", 404);
  }

  if (category._count.products > 0) {
    throw new ApiError("Category has products", 409, {
      category: ["لا يمكن حذف هذا الصنف لأنه يحتوي على منتجات."],
    });
  }

  await prisma.category.delete({
    where: { id },
    select: { id: true },
  });

  await cleanupCategoryImages([category.image]);

  return serializeCategory(category);
}

function buildCategoryUpdateData(input: UpdateCategoryInput): PrismaTypes.CategoryUpdateInput {
  const data: PrismaTypes.CategoryUpdateInput = {};

  if (input.name !== undefined) data.name = input.name;
  if (input.slug !== undefined) data.slug = input.slug;
  if (input.description !== undefined) data.description = input.description;
  if (input.image !== undefined) data.image = input.image;
  if (input.sortOrder !== undefined) data.sortOrder = input.sortOrder;
  if (input.isActive !== undefined) data.isActive = input.isActive;
  if (input.parentId !== undefined) {
    data.parent = input.parentId
      ? { connect: { id: input.parentId } }
      : { disconnect: true };
  }

  return data;
}

async function ensureParentCanBeUsed(parentId: string | null, categoryId?: string) {
  if (!parentId) return;

  if (categoryId && parentId === categoryId) {
    throw new ApiError("Category cannot be its own parent", 400, {
      parentId: ["Category cannot be its own parent"],
    });
  }

  let currentParent = await prisma.category.findUnique({
    where: { id: parentId },
    select: { id: true, parentId: true },
  });

  if (!currentParent) {
    throw new ApiError("Parent category not found", 404, {
      parentId: ["Parent category not found"],
    });
  }

  while (currentParent?.parentId) {
    if (categoryId && currentParent.parentId === categoryId) {
      throw new ApiError("Category parent cannot be a descendant", 400, {
        parentId: ["Category parent cannot be a descendant"],
      });
    }

    currentParent = await prisma.category.findUnique({
      where: { id: currentParent.parentId },
      select: { id: true, parentId: true },
    });
  }
}

async function cleanupReplacedCategoryImage(
  current: CategoryRecord,
  updated: CategoryRecord,
) {
  if (current.image === updated.image) return;

  await cleanupCategoryImages([current.image]);
}

async function cleanupCategoryImages(urls: Array<string | null>) {
  const keys = urls
    .map((url) => (url ? getOwnedCategoryImageKeyFromUrl(url) : null))
    .filter((key): key is string => Boolean(key));

  if (keys.length === 0) return;

  await deleteCategoryImageObjects(keys);
}

function serializeCategory(category: CategoryRecord): CategoryDto {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description,
    image: category.image,
    icon: category.icon,
    parentId: category.parentId,
    parent: category.parent,
    sortOrder: category.sortOrder,
    isActive: category.isActive,
    productCount: category._count.products,
    childCount: category._count.children,
    createdAt: category.createdAt.toISOString(),
    updatedAt: category.updatedAt.toISOString(),
  };
}

function buildCategorySummary(categories: CategoryDto[]): CategoryListSummary {
  return {
    total: categories.length,
    active: categories.filter((category) => category.isActive).length,
    inactive: categories.filter((category) => !category.isActive).length,
    used: categories.filter((category) => category.productCount > 0).length,
    empty: categories.filter((category) => category.productCount === 0).length,
  };
}

function mapCategoryWriteError(error: unknown): never {
  if (isUniqueConstraintError(error)) {
    throw new ApiError("Category slug already exists", 409, {
      slug: ["Category slug already exists"],
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
