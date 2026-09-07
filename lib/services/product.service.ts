import {
  ProductStatus,
  StockMovementType,
} from "@/lib/prisma-client";
import type { Prisma as PrismaTypes } from "@/app/generated/prisma/edge";
import { unstable_cache } from "next/cache";
import { ApiError } from "@/lib/api-response";
import { decimalToString, toPrismaDecimal } from "@/lib/decimal";
import prisma from "@/lib/prisma";
import { createSlug } from "@/lib/products/product-format";
import {
  STORE_PRODUCT_MAX_PAGE_SIZE,
  STORE_PRODUCT_PAGE_SIZE,
  STORE_PRODUCT_REVALIDATE_SECONDS,
  STORE_PRODUCTS_CACHE_TAG,
} from "@/features/catalog/constants";
import type {
  CreateProductInput,
  ProductImageInput,
  ProductQueryInput,
  UpdateProductInput,
} from "@/lib/validations/product";
import type {
  CursorPaginatedProducts,
  ProductCardDto,
  ProductDto,
  StoreProductDetailDto,
} from "@/lib/products/product-types";

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
  costPrice: true,
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
} satisfies PrismaTypes.ProductSelect;

type ProductDetail = PrismaTypes.ProductGetPayload<{
  select: typeof productDetailSelect;
}>;

const productCardSelect = {
  id: true,
  categoryId: true,
  brandId: true,
  name: true,
  slug: true,
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
  createdAt: true,
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
} satisfies PrismaTypes.ProductSelect;

type ProductCard = PrismaTypes.ProductGetPayload<{
  select: typeof productCardSelect;
}>;

export type StoreProductSort = "newest" | "price-asc" | "price-desc";

export type StoreProductQueryOptions = {
  limit?: number;
  cursor?: string;
  search?: string;
  categoryId?: string;
  categorySlug?: string;
  brandSlug?: string;
  minPrice?: string;
  maxPrice?: string;
  inStock?: boolean;
  excludeProductId?: string;
  ids?: string[];
  sort?: StoreProductSort;
};

type NormalizedStoreProductQueryOptions = {
  limit: number;
  cursor: string | undefined;
  search: string | undefined;
  categoryId: string | undefined;
  categorySlug: string | undefined;
  brandSlug: string | undefined;
  minPrice: string | undefined;
  maxPrice: string | undefined;
  inStock: boolean;
  excludeProductId: string | undefined;
  ids: string[] | undefined;
  sort: StoreProductSort;
};

export async function createProduct(input: CreateProductInput) {
  await ensureRelationsExist(input.categoryId, input.brandId ?? null);
  const slug = await generateUniqueProductSlug(input.name);
  await ensureProductUniqueness({
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
        slug,
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
    //

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
  const normalizedInput =
    input.slug === undefined
      ? input
      : {
          ...input,
          slug: createSlug(input.slug),
        };
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

  if (
    normalizedInput.categoryId !== undefined ||
    normalizedInput.brandId !== undefined
  ) {
    await ensureRelationsExist(
      normalizedInput.categoryId,
      normalizedInput.brandId ?? undefined,
    );
  }

  await ensureProductUniqueness(
    {
      slug: normalizedInput.slug,
      sku: normalizedInput.sku ?? undefined,
      barcode: normalizedInput.barcode ?? undefined,
    },
    productId,
  );

  const updateData = buildProductUpdateData(normalizedInput);
  const nextStock =
    normalizedInput.stock === undefined
      ? undefined
      : toPrismaDecimal(normalizedInput.stock);
  const stockChanged =
    nextStock !== undefined && !current.stock.equals(nextStock);
  const shouldRecordStockMovement =
    stockChanged &&
    (current.trackInventory || normalizedInput.trackInventory === true);
  const imageRows =
    normalizedInput.images === undefined
      ? undefined
      : normalizeImages(normalizedInput.images);

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
  return unstable_cache(
    async () => {
      const product = await prisma.product.findFirst({
        where: {
          slug,
          status: ProductStatus.ACTIVE,
        },
        select: productDetailSelect,
      });

      return product ? serializeStoreProduct(product) : null;
    },
    ["store-product-detail", slug],
    {
      revalidate: STORE_PRODUCT_REVALIDATE_SECONDS,
      tags: [STORE_PRODUCTS_CACHE_TAG],
    },
  )();
}

export async function getStoreProducts(
  options: StoreProductQueryOptions = {},
): Promise<CursorPaginatedProducts<ProductCardDto>> {
  const normalizedOptions = normalizeStoreProductQueryOptions(options);

  return unstable_cache(
    () => queryStoreProducts(normalizedOptions),
    ["store-products-page", JSON.stringify(normalizedOptions)],
    {
      revalidate: STORE_PRODUCT_REVALIDATE_SECONDS,
      tags: [STORE_PRODUCTS_CACHE_TAG],
    },
  )();
}

export async function listStoreProducts(options?: StoreProductQueryOptions) {
  const page = await getStoreProducts(options);

  return page.items;
}

async function queryStoreProducts(
  options: NormalizedStoreProductQueryOptions,
): Promise<CursorPaginatedProducts<ProductCardDto>> {
  const products = await prisma.product.findMany({
    where: buildStoreProductWhere(options),
    orderBy: getStoreProductOrderBy(options.sort),
    ...(options.cursor ? { cursor: { id: options.cursor }, skip: 1 } : {}),
    take: options.limit + 1,
    select: productCardSelect,
  });
  const hasMore = products.length > options.limit;
  const pageItems = hasMore ? products.slice(0, options.limit) : products;

  return {
    items: pageItems.map(serializeProductCard),
    nextCursor: hasMore ? pageItems.at(-1)?.id ?? null : null,
    hasMore,
    pageSize: options.limit,
  };
}

function normalizeStoreProductQueryOptions(
  options: StoreProductQueryOptions,
): NormalizedStoreProductQueryOptions {
  const limit = Math.min(
    Math.max(Number(options.limit) || STORE_PRODUCT_PAGE_SIZE, 1),
    STORE_PRODUCT_MAX_PAGE_SIZE,
  );
  const ids = options.ids
    ?.map((id) => id.trim())
    .filter((id) => id.length > 0);

  return {
    limit,
    cursor: cleanStoreText(options.cursor),
    search: cleanStoreText(options.search),
    categoryId: cleanStoreText(options.categoryId),
    categorySlug: cleanStoreText(options.categorySlug),
    brandSlug: cleanStoreText(options.brandSlug),
    minPrice: normalizeStorePriceFilter(options.minPrice) ?? undefined,
    maxPrice: normalizeStorePriceFilter(options.maxPrice) ?? undefined,
    inStock: options.inStock === true,
    excludeProductId: cleanStoreText(options.excludeProductId),
    ids: ids && ids.length > 0 ? Array.from(new Set(ids)) : undefined,
    sort: options.sort ?? "newest",
  };
}

function buildStoreProductWhere(
  options: ReturnType<typeof normalizeStoreProductQueryOptions>,
) {
  const andFilters: PrismaTypes.ProductWhereInput[] = [
    { status: ProductStatus.ACTIVE },
  ];
  const minPrice = normalizeStorePriceFilter(options.minPrice);
  const maxPrice = normalizeStorePriceFilter(options.maxPrice);

  if (options.ids?.length) andFilters.push({ id: { in: options.ids } });
  if (options.categoryId) andFilters.push({ categoryId: options.categoryId });
  if (options.categorySlug) {
    andFilters.push({
      category: { slug: options.categorySlug, isActive: true },
    });
  }
  if (options.brandSlug) {
    andFilters.push({ brand: { slug: options.brandSlug, isActive: true } });
  }
  if (options.excludeProductId) {
    andFilters.push({ id: { not: options.excludeProductId } });
  }
  if (minPrice || maxPrice) {
    andFilters.push({
      price: {
        ...(minPrice ? { gte: toPrismaDecimal(minPrice) } : {}),
        ...(maxPrice ? { lte: toPrismaDecimal(maxPrice) } : {}),
      },
    });
  }
  if (options.inStock) {
    andFilters.push({
      OR: [
        { trackInventory: false },
        { allowBackorder: true },
        { stock: { gt: 0 } },
      ],
    });
  }
  if (options.search) {
    andFilters.push({
      OR: [
        { name: { contains: options.search, mode: "insensitive" } },
        { sku: { contains: options.search, mode: "insensitive" } },
        { barcode: { contains: options.search, mode: "insensitive" } },
        { category: { name: { contains: options.search, mode: "insensitive" } } },
        { brand: { name: { contains: options.search, mode: "insensitive" } } },
      ],
    });
  }

  return { AND: andFilters } satisfies PrismaTypes.ProductWhereInput;
}

function getStoreProductOrderBy(sort: StoreProductSort) {
  if (sort === "price-asc") {
    return [
      { price: "asc" },
      { createdAt: "desc" },
      { id: "desc" },
    ] satisfies PrismaTypes.ProductOrderByWithRelationInput[];
  }

  if (sort === "price-desc") {
    return [
      { price: "desc" },
      { createdAt: "desc" },
      { id: "desc" },
    ] satisfies PrismaTypes.ProductOrderByWithRelationInput[];
  }

  return [
    { createdAt: "desc" },
    { id: "desc" },
  ] satisfies PrismaTypes.ProductOrderByWithRelationInput[];
}

function cleanStoreText(value: string | undefined) {
  const text = value?.trim();

  return text || undefined;
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
  const andFilters: PrismaTypes.ProductWhereInput[] = [];

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

  const where: PrismaTypes.ProductWhereInput =
    andFilters.length > 0 ? { AND: andFilters } : {};

  const orderBy = {
    [query.sortBy]: query.order,
  } as PrismaTypes.ProductOrderByWithRelationInput;

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

async function generateUniqueProductSlug(name: string) {
  const baseSlug = createSlug(name) || "product";
  let candidate = baseSlug;

  for (let suffix = 2; suffix <= 500; suffix += 1) {
    const existing = await prisma.product.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });

    if (!existing) return candidate;

    candidate = `${baseSlug}-${suffix}`;
  }

  throw new ApiError("Could not generate product slug", 409);
}

async function ensureProductUniqueness(
  values: {
    slug?: string;
    sku?: string | null;
    barcode?: string | null;
  },
  excludeProductId?: string,
) {
  const checks: PrismaTypes.ProductWhereInput[] = [];

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
  const data: PrismaTypes.ProductUncheckedUpdateInput = {};

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
    costPrice: decimalToString(product.costPrice),
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

function serializeStoreProduct(product: ProductDetail): StoreProductDetailDto {
  const serializedProduct: Partial<ProductDto> = serializeProduct(product);
  delete serializedProduct.costPrice;

  return serializedProduct as StoreProductDetailDto;
}

function serializeProductCard(product: ProductCard): ProductCardDto {
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
  };
}
