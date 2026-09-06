import prisma from "@/lib/prisma";
import { Prisma } from "@/app/generated/prisma";
import { ApiError } from "@/lib/api-response";
import type { z } from "zod";
import type { bulkPricesSchema, priceQuerySchema } from "@/lib/validations/product-prices";

export async function listProductPrices(query: z.infer<typeof priceQuerySchema>) {
  const limit = 50;
  const where: Prisma.ProductWhereInput = {
    status: { not: "ARCHIVED" },
    ...(query.search ? { name: { contains: query.search, mode: "insensitive" } } : {}),
    ...(query.categoryId ? { categoryId: query.categoryId } : {}),
  };
  const [products, total] = await prisma.$transaction([
    prisma.product.findMany({ where, skip: (query.page - 1) * limit, take: limit,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      select: { id: true, name: true, image: true, price: true, categoryId: true,
        category: { select: { name: true } }, status: true } }),
    prisma.product.count({ where }),
  ]);
  return { data: products.map((product) => ({ ...product, price: product.price.toString() })),
    pagination: { page: query.page, limit, total, totalPages: Math.ceil(total / limit) } };
}

export async function updateProductPrices(input: z.infer<typeof bulkPricesSchema>, database = prisma) {
  const ids = input.updates.map((update) => update.id);
  return database.$transaction(async (tx) => {
    // Lock only the requested rows, in stable order, for a short atomic batch.
    await tx.$queryRaw(Prisma.sql`SELECT "id" FROM "Product" WHERE "id" IN (${Prisma.join(ids)}) ORDER BY "id" FOR UPDATE`);
    const products = await tx.product.findMany({ where: { id: { in: ids } },
      select: { id: true, slug: true, category: { select: { slug: true } } } });
    const found = new Set(products.map((product) => product.id));
    const missingIds = ids.filter((id) => !found.has(id));
    if (missingIds.length) throw new ApiError("بعض المنتجات لم تعد موجودة. لم يتم حفظ أي تغيير.", 409, { missingIds });
    // Parameterized VALUES keeps hundreds of prices to one UPDATE round trip.
    const values = input.updates.map((update) => Prisma.sql`(${update.id}::text, ${update.price}::numeric(14,2))`);
    await tx.$executeRaw(Prisma.sql`UPDATE "Product" AS p SET "price" = v.price, "updatedAt" = NOW()
      FROM (VALUES ${Prisma.join(values)}) AS v(id, price) WHERE p."id" = v.id`);
    return { updatedCount: input.updates.length, updates: input.updates,
      paths: [...new Set(products.flatMap((product) => [`/products/${product.slug}`, `/categories/${product.category.slug}`]))] };
  }, { timeout: 15000 });
}
