import prisma from "@/lib/prisma";
import { unstable_cache } from "next/cache";
import { ApiError } from "@/lib/api-response";
import {
  STORE_BRANDS_CACHE_TAG,
  STORE_CATEGORIES_CACHE_TAG,
  STORE_PRODUCT_REVALIDATE_SECONDS,
} from "@/features/catalog/constants";
import type {
  QuickCreateBrandInput,
  QuickCreateCategoryInput,
} from "@/lib/validations/catalog";

export async function listCategoryOptions() {
  return unstable_cache(
    () =>
      prisma.category.findMany({
        where: { isActive: true },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        select: {
          id: true,
          name: true,
          slug: true,
          parentId: true,
          image: true,
        },
      }),
    ["store-category-options"],
    {
      revalidate: STORE_PRODUCT_REVALIDATE_SECONDS,
      tags: [STORE_CATEGORIES_CACHE_TAG],
    },
  )();
}

export async function getCategoryOptionBySlug(slug: string) {
  return unstable_cache(
    () =>
      prisma.category.findFirst({
        where: {
          slug,
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          slug: true,
          parentId: true,
          image: true,
        },
      }),
    ["store-category-option", slug],
    {
      revalidate: STORE_PRODUCT_REVALIDATE_SECONDS,
      tags: [STORE_CATEGORIES_CACHE_TAG],
    },
  )();
}

export async function createCategoryOption(input: QuickCreateCategoryInput) {
  const existingCategory = await prisma.category.findUnique({
    where: { slug: input.slug },
    select: { id: true },
  });

  if (existingCategory) {
    throw new ApiError("Category slug already exists", 409, {
      slug: ["Category slug already exists"],
    });
  }

  try {
    return await prisma.category.create({
      data: {
        name: input.name,
        slug: input.slug,
        image: input.image,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        parentId: true,
        image: true,
      },
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new ApiError("Category slug already exists", 409, {
        slug: ["Category slug already exists"],
      });
    }

    throw error;
  }
}

export async function listBrandOptions() {
  return unstable_cache(
    () =>
      prisma.brand.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          slug: true,
        },
      }),
    ["store-brand-options"],
    {
      revalidate: STORE_PRODUCT_REVALIDATE_SECONDS,
      tags: [STORE_BRANDS_CACHE_TAG],
    },
  )();
}

export async function createBrandOption(input: QuickCreateBrandInput) {
  const existingBrand = await prisma.brand.findUnique({
    where: { slug: input.slug },
    select: { id: true },
  });

  if (existingBrand) {
    throw new ApiError("Brand slug already exists", 409, {
      slug: ["Brand slug already exists"],
    });
  }

  try {
    return await prisma.brand.create({
      data: {
        name: input.name,
        slug: input.slug,
      },
      select: {
        id: true,
        name: true,
        slug: true,
      },
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new ApiError("Brand slug already exists", 409, {
        slug: ["Brand slug already exists"],
      });
    }

    throw error;
  }
}

function isUniqueConstraintError(error: unknown): error is { code: string } {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "P2002"
  );
}
