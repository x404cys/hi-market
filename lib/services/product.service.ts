import {
  Prisma,
  ProductStatus,
  StockMovementType,
} from "@/app/generated/prisma";
import { ApiError } from "@/lib/api-response";
import { decimalToString, toPrismaDecimal } from "@/lib/decimal";
import prisma from "@/lib/prisma";
import type {
  CreateProductInput,
  ProductImageInput,
  ProductQueryInput,
  UpdateProductInput,
} from "@/lib/validations/product";
import type { ProductDto } from "@/lib/products/product-types";

const productDetailSelect = {
  id: true,
  categoryId: true,
  brandId: true,
  name: true,
  slug: true,
  description: true,
  sku: true,
  barcode: true,
  price: true,
  comparePrice: true,
  unit: true,
  unitValue: true,
  isWeighted: true,
  minOrderQty: true,
  orderStep: true,
  stock: true,
  lowStockAt: true,
  trackInventory: true,
  allowBackorder: true,
  image: true,
  status: true,
  isFeatured: true,
  sortOrder: true,
  createdAt: true,
  updatedAt: true,
  category: {
    select: {
      id: true,
      name: true,
      slug: true,
      image: true,
      isActive: true,
    },
  },
  brand: {
    select: {
      id: true,
      name: true,
      slug: true,
      logo: true,
      isActive: true,
    },
  },
  images: {
    select: {
      id: true,
      url: true,
      alt: true,
      sortOrder: true,
      createdAt: true,
    },
    orderBy: {
      sortOrder: "asc",
    },
  },
} satisfies Prisma.ProductSelect;

type ProductDetail = Prisma.ProductGetPayload<{
  select: typeof productDetailSelect;
}>;

export async function createProduct(input: CreateProductInput) {
  await ensureRelationsExist(input.categoryId, input.brandId ?? null);
  await ensureProductUniqueness({
    slug: input.slug,
    sku: input.sku ?? null,
    barcode: input.barcode ?? null,
  });

  const stock = toPrismaDecimal(input.stock ?? "0");
  const shouldTrackInitialStock =
    input.trackInventory !== false && !stock.equals(0);
  const imageRows = normalizeImages(input.images);

  const created = await prisma.$transaction(async (tx) => {
    const product = await tx.product.create({
      data: {
        categoryId: input.categoryId,
        brandId: input.brandId ?? null,
        name: input.name,
        slug: input.slug,
        description: input.description ?? null,
        sku: input.sku ?? null,
        barcode: input.barcode ?? null,
        price: toPrismaDecimal(input.price),
        comparePrice:
          input.comparePrice == null
            ? null
            : toPrismaDecimal(input.comparePrice),
        costPrice:
          input.costPrice == null ? null : toPrismaDecimal(input.costPrice),
        unit: input.unit,
        unitValue:
          input.unitValue == null ? null : toPrismaDecimal(input.unitValue),
        isWeighted: input.isWeighted ?? false,
        minOrderQty:
          input.minOrderQty == null
            ? toPrismaDecimal("1")
            : toPrismaDecimal(input.minOrderQty),
        orderStep:
          input.orderStep == null
            ? toPrismaDecimal("1")
            : toPrismaDecimal(input.orderStep),
        stock,
        lowStockAt:
          input.lowStockAt == null
            ? toPrismaDecimal("0")
            : toPrismaDecimal(input.lowStockAt),
        trackInventory: input.trackInventory ?? true,
        allowBackorder: input.allowBackorder ?? false,
        image: input.image ?? null,
        status: input.status ?? ProductStatus.ACTIVE,
        isFeatured: input.isFeatured ?? false,
        sortOrder: input.sortOrder ?? 0,
      },
      select: { id: true },
    });

    if (imageRows.length > 0) {
      await tx.productImage.createMany({
        data: imageRows.map((image) => ({
          productId: product.id,
          ...image,
        })),
      });
    }

    if (shouldTrackInitialStock) {
      await tx.stockMovement.create({
        data: {
          productId: product.id,
          type: StockMovementType.PURCHASE,
          quantity: stock,
          stockBefore: toPrismaDecimal("0"),
          stockAfter: stock,
          note: "Initial stock from product creation",
        },
      });
    }

    return tx.product.findUniqueOrThrow({
      where: { id: product.id },
      select: productDetailSelect,
    });
  });

  return serializeProduct(created);
}

export async function updateProduct(
  productId: string,
  input: UpdateProductInput,
) {
  const current = await prisma.product.findUnique({
    where: { id: productId },
    select: {
      id: true,
      slug: true,
      sku: true,
      barcode: true,
      stock: true,
      trackInventory: true,
    },
  });

  if (!current) {
    throw new ApiError("Product not found", 404);
  }

  if (input.categoryId !== undefined || input.brandId !== undefined) {
    await ensureRelationsExist(input.categoryId, input.brandId ?? undefined);
  }

  await ensureProductUniqueness(
    {
      slug: input.slug,
      sku: input.sku ?? undefined,
      barcode: input.barcode ?? undefined,
    },
    productId,
  );

  const updateData = buildProductUpdateData(input);
  const nextStock =
    input.stock === undefined ? undefined : toPrismaDecimal(input.stock);
  const stockChanged =
    nextStock !== undefined && !current.stock.equals(nextStock);
  const shouldRecordStockMovement =
    stockChanged && (current.trackInventory || input.trackInventory === true);
  const imageRows =
    input.images === undefined ? undefined : normalizeImages(input.images);

  const updated = await prisma.$transaction(async (tx) => {
    if (imageRows !== undefined) {
      await tx.productImage.deleteMany({
        where: { productId },
      });

      if (imageRows.length > 0) {
        await tx.productImage.createMany({
          data: imageRows.map((image) => ({
            productId,
            ...image,
          })),
        });
      }
    }

    await tx.product.update({
      where: { id: productId },
      data: updateData,
      select: { id: true },
    });

    if (shouldRecordStockMovement && nextStock !== undefined) {
      await tx.stockMovement.create({
        data: {
          productId,
          type: StockMovementType.ADJUSTMENT,
          quantity: nextStock.minus(current.stock),
          stockBefore: current.stock,
          stockAfter: nextStock,
          note: "Stock adjusted from product update",
        },
      });
    }

    return tx.product.findUniqueOrThrow({
      where: { id: productId },
      select: productDetailSelect,
    });
  });

  return serializeProduct(updated);
}

export async function archiveProduct(productId: string) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true },
  });

  if (!product) {
    throw new ApiError("Product not found", 404);
  }

  const archived = await prisma.product.update({
    where: { id: productId },
    data: { status: ProductStatus.ARCHIVED },
    select: productDetailSelect,
  });

  return serializeProduct(archived);
}

export async function getProduct(productId: string) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: productDetailSelect,
  });

  if (!product) {
    throw new ApiError("Product not found", 404);
  }

  return serializeProduct(product);
}

export async function getStoreProductBySlug(slug: string) {
  const product = await prisma.product.findFirst({
    where: {
      slug,
      status: ProductStatus.ACTIVE,
    },
    select: productDetailSelect,
  });

  return product ? serializeProduct(product) : null;
}

export async function listStoreProducts(options?: {
  limit?: number;
  search?: string;
  categoryId?: string;
  categorySlug?: string;
  brandSlug?: string;
  minPrice?: string;
  maxPrice?: string;
  inStock?: boolean;
  excludeProductId?: string;
}) {
  const where: Prisma.ProductWhereInput = {
    status: ProductStatus.ACTIVE,
    ...(options?.categoryId ? { categoryId: options.categoryId } : {}),
    ...(options?.categorySlug
      ? { category: { slug: options.categorySlug, isActive: true } }
      : {}),
    ...(options?.brandSlug
      ? { brand: { slug: options.brandSlug, isActive: true } }
      : {}),
    ...(options?.excludeProductId ? { id: { not: options.excludeProductId } } : {}),
  };
  const search = options?.search?.trim();
  const minPrice = normalizeStorePriceFilter(options?.minPrice);
  const maxPrice = normalizeStorePriceFilter(options?.maxPrice);

  if (minPrice || maxPrice) {
    where.price = {
      ...(minPrice ? { gte: toPrismaDecimal(minPrice) } : {}),
      ...(maxPrice ? { lte: toPrismaDecimal(maxPrice) } : {}),
    };
  }

  if (options?.inStock) {
    where.OR = [
      ...(Array.isArray(where.OR) ? where.OR : []),
      { trackInventory: false },
      { allowBackorder: true },
      { stock: { gt: 0 } },
    ];
  }

  if (search) {
    const searchFilters: Prisma.ProductWhereInput[] = [
      { name: { contains: search, mode: "insensitive" } },
      { sku: { contains: search, mode: "insensitive" } },
      { barcode: { contains: search, mode: "insensitive" } },
      { category: { name: { contains: search, mode: "insensitive" } } },
      { brand: { name: { contains: search, mode: "insensitive" } } },
    ];

    if (where.OR) {
      where.AND = [{ OR: Array.isArray(where.OR) ? where.OR : [where.OR] }, { OR: searchFilters }];
      delete where.OR;
    } else {
      where.OR = searchFilters;
    }
  }

  const products = await prisma.product.findMany({
    where,
    orderBy: [
      { isFeatured: "desc" },
      { sortOrder: "asc" },
      { updatedAt: "desc" },
    ],
    take: options?.limit ?? 12,
    select: productDetailSelect,
  });

  return products.map(serializeProduct);
}

function normalizeStorePriceFilter(value: string | undefined) {
  if (!value) return null;

  const numericValue = Number(value);

  if (!Number.isFinite(numericValue) || numericValue < 0) return null;

  return numericValue.toString();
}

export async function listRelatedStoreProducts(product: {
  id: string;
  categoryId: string;
}) {
  return listStoreProducts({
    categoryId: product.categoryId,
    excludeProductId: product.id,
    limit: 8,
  });
}

export async function listProducts(query: ProductQueryInput) {
  const andFilters: Prisma.ProductWhereInput[] = [];

  if (query.categoryId) andFilters.push({ categoryId: query.categoryId });
  if (query.brandId) andFilters.push({ brandId: query.brandId });
  if (query.status) andFilters.push({ status: query.status });

  if (query.stockStatus === "available") {
    andFilters.push({
      stock: {
        gt: prisma.product.fields.lowStockAt,
      },
    });
  }

  if (query.stockStatus === "low") {
    andFilters.push({
      stock: {
        gt: 0,
        lte: prisma.product.fields.lowStockAt,
      },
    });
  }

  if (query.stockStatus === "out") {
    andFilters.push({
      OR: [{ status: ProductStatus.OUT_OF_STOCK }, { stock: { lte: 0 } }],
    });
  }

  if (query.search) {
    andFilters.push({
      OR: [
        { name: { contains: query.search, mode: "insensitive" } },
        { sku: { contains: query.search, mode: "insensitive" } },
        { barcode: { contains: query.search, mode: "insensitive" } },
      ],
    });
  }

  const where: Prisma.ProductWhereInput =
    andFilters.length > 0 ? { AND: andFilters } : {};

  const orderBy = {
    [query.sortBy]: query.order,
  } as Prisma.ProductOrderByWithRelationInput;

  const [
    products,
    total,
    totalProducts,
    activeProducts,
    lowStockProducts,
    outOfStockProducts,
  ] = await prisma.$transaction([
    prisma.product.findMany({
      where,
      orderBy,
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      select: productDetailSelect,
    }),
    prisma.product.count({ where }),
    prisma.product.count(),
    prisma.product.count({ where: { status: ProductStatus.ACTIVE } }),
    prisma.product.count({
      where: {
        stock: {
          gt: 0,
          lte: prisma.product.fields.lowStockAt,
        },
      },
    }),
    prisma.product.count({
      where: {
        OR: [{ status: ProductStatus.OUT_OF_STOCK }, { stock: { lte: 0 } }],
      },
    }),
  ]);

  return {
    data: products.map(serializeProduct),
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    },
    summary: {
      totalProducts,
      activeProducts,
      lowStockProducts,
      outOfStockProducts,
    },
  };
}

async function ensureRelationsExist(categoryId?: string, brandId?: string | null) {
  if (categoryId !== undefined) {
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      select: { id: true },
    });

    if (!category) {
      throw new ApiError("Category not found", 404);
    }
  }

  if (brandId !== undefined && brandId !== null) {
    const brand = await prisma.brand.findUnique({
      where: { id: brandId },
      select: { id: true },
    });

    if (!brand) {
      throw new ApiError("Brand not found", 404);
    }
  }
}

async function ensureProductUniqueness(
  values: {
    slug?: string;
    sku?: string | null;
    barcode?: string | null;
  },
  excludeProductId?: string,
) {
  const checks: Prisma.ProductWhereInput[] = [];

  if (values.slug) checks.push({ slug: values.slug });
  if (values.sku) checks.push({ sku: values.sku });
  if (values.barcode) checks.push({ barcode: values.barcode });

  if (checks.length === 0) return;

  const conflict = await prisma.product.findFirst({
    where: {
      OR: checks,
      ...(excludeProductId ? { id: { not: excludeProductId } } : {}),
    },
    select: {
      slug: true,
      sku: true,
      barcode: true,
    },
  });

  if (!conflict) return;

  if (values.slug && conflict.slug === values.slug) {
    throw new ApiError("Product slug already exists", 409);
  }

  if (values.sku && conflict.sku === values.sku) {
    throw new ApiError("Product SKU already exists", 409);
  }

  if (values.barcode && conflict.barcode === values.barcode) {
    throw new ApiError("Product barcode already exists", 409);
  }
}

function buildProductUpdateData(input: UpdateProductInput) {
  const data: Prisma.ProductUncheckedUpdateInput = {};

  if (input.categoryId !== undefined) data.categoryId = input.categoryId;
  if (input.brandId !== undefined) data.brandId = input.brandId;
  if (input.name !== undefined) data.name = input.name;
  if (input.slug !== undefined) data.slug = input.slug;
  if (input.description !== undefined) data.description = input.description;
  if (input.sku !== undefined) data.sku = input.sku;
  if (input.barcode !== undefined) data.barcode = input.barcode;
  if (input.price !== undefined) data.price = toPrismaDecimal(input.price);
  if (input.comparePrice !== undefined) {
    data.comparePrice =
      input.comparePrice === null ? null : toPrismaDecimal(input.comparePrice);
  }
  if (input.costPrice !== undefined) {
    data.costPrice =
      input.costPrice === null ? null : toPrismaDecimal(input.costPrice);
  }
  if (input.unit !== undefined) data.unit = input.unit;
  if (input.unitValue !== undefined) {
    data.unitValue =
      input.unitValue === null ? null : toPrismaDecimal(input.unitValue);
  }
  if (input.isWeighted !== undefined) data.isWeighted = input.isWeighted;
  if (input.minOrderQty !== undefined) {
    data.minOrderQty = toPrismaDecimal(input.minOrderQty);
  }
  if (input.orderStep !== undefined) {
    data.orderStep = toPrismaDecimal(input.orderStep);
  }
  if (input.stock !== undefined) data.stock = toPrismaDecimal(input.stock);
  if (input.lowStockAt !== undefined) {
    data.lowStockAt = toPrismaDecimal(input.lowStockAt);
  }
  if (input.trackInventory !== undefined) {
    data.trackInventory = input.trackInventory;
  }
  if (input.allowBackorder !== undefined) {
    data.allowBackorder = input.allowBackorder;
  }
  if (input.image !== undefined) data.image = input.image;
  if (input.status !== undefined) data.status = input.status;
  if (input.isFeatured !== undefined) data.isFeatured = input.isFeatured;
  if (input.sortOrder !== undefined) data.sortOrder = input.sortOrder;

  return data;
}

function normalizeImages(images: ProductImageInput[] | undefined) {
  return (images ?? []).map((image, index) => ({
    url: image.url,
    alt: "alt" in image ? image.alt ?? null : null,
    sortOrder: "sortOrder" in image ? image.sortOrder ?? index : index,
  }));
}

function serializeProduct(product: ProductDetail): ProductDto {
  return {
    ...product,
    price: decimalToString(product.price) ?? "0",
    comparePrice: decimalToString(product.comparePrice),
    unitValue: decimalToString(product.unitValue),
    minOrderQty: decimalToString(product.minOrderQty) ?? "1",
    orderStep: decimalToString(product.orderStep) ?? "1",
    stock: decimalToString(product.stock) ?? "0",
    lowStockAt: decimalToString(product.lowStockAt) ?? "0",
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
    images: product.images.map((image) => ({
      ...image,
      createdAt: image.createdAt.toISOString(),
    })),
  };
}
