import type { ProductStatus, ProductUnit } from "@/app/generated/prisma";

export type ApiSuccess<T> = {
  success: true;
  data: T;
};

export type ApiErrorResponse = {
  success: false;
  message: string;
  errors?: Record<string, unknown>;
  debugId?: string;
  debug?: {
    debugId?: string;
    route?: string;
    method?: string;
    status?: number;
    timestamp?: string;
    type?: string;
    category?: string;
    phase?: "START" | "ACTIVE_TRANSACTION" | "UNKNOWN";
    message?: string;
    lastStage?: string;
    issues?: Array<{
      path: string;
      code: string;
      message: string;
    }>;
    code?: string;
    meta?: unknown;
    stack?: string;
  };
};

export type PaginatedApiSuccess<T> = ApiSuccess<T> & {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  summary?: ProductSummary;
};

export type ProductSummary = {
  totalProducts: number;
  activeProducts: number;
  lowStockProducts: number;
  outOfStockProducts: number;
};

export type CategoryOption = {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  image: string | null;
};

export type BrandOption = {
  id: string;
  name: string;
  slug: string;
};

export type ProductImageDto = {
  id: string;
  url: string;
  alt: string | null;
  sortOrder: number;
  createdAt: string;
};

export type ProductDto = {
  id: string;
  categoryId: string;
  brandId: string | null;
  name: string;
  slug: string;
  description: string | null;
  sku: string | null;
  barcode: string | null;
  price: string;
  comparePrice: string | null;
  unit: ProductUnit;
  unitValue: string | null;
  isWeighted: boolean;
  minOrderQty: string;
  orderStep: string;
  stock: string;
  lowStockAt: string;
  trackInventory: boolean;
  allowBackorder: boolean;
  image: string | null;
  status: ProductStatus;
  isFeatured: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  category: {
    id: string;
    name: string;
    slug: string;
    image: string | null;
    isActive: boolean;
  };
  brand: {
    id: string;
    name: string;
    slug: string;
    logo: string | null;
    isActive: boolean;
  } | null;
  images: ProductImageDto[];
};
