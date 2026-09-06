import { loadEnvConfig } from "@next/env";
import { PrismaPg } from "@prisma/adapter-pg";
import { readdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { Prisma, PrismaClient, ProductStatus, ProductUnit, StockMovementType } from "../app/generated/prisma";
import { createSlug } from "../lib/products/product-format";

const CATEGORY = "المعجنات";
const SOURCE = "C:/Users/um alqura/Desktop/عناية الاطفال/عناية الاطفال";
const EXTENSIONS = new Set([".webp", ".jpg", ".jpeg", ".png", ".avif"]);
type Candidate = { file: string; name: string; image: string };
type Existing = { name: string; slug: string; image: string | null };
type Issue = { file: string; reason: string };

function normalizeName(name: string) {
  return name.normalize("NFKC").replace(/\s+/gu, " ").trim().toLowerCase();
}

function duplicate(candidate: Candidate, products: Existing[]) {
  return products.some((product) =>
    normalizeName(product.name) === normalizeName(candidate.name) || product.image === candidate.image,
  );
}

function uniqueSlug(name: string, products: Existing[]) {
  const occupied = new Set(products.map((product) => product.slug));
  const base = createSlug(name) || "product";
  let slug = base;
  for (let suffix = 2; occupied.has(slug); suffix++) slug = `${base}-${suffix}`;
  return slug;
}

function productData(candidate: Candidate, categoryId: string, slug: string) {
  return {
    name: candidate.name, slug, image: candidate.image, categoryId,
    price: new Prisma.Decimal(2000), stock: new Prisma.Decimal(20),
    minOrderQty: new Prisma.Decimal(1), orderStep: new Prisma.Decimal(1),
    status: ProductStatus.ACTIVE, unit: ProductUnit.PIECE, brandId: null,
  } satisfies Prisma.ProductUncheckedCreateInput;
}

function validateSchema() {
  const model = Prisma.dmmf.datamodel.models.find((item) => item.name === "Product");
  if (!model) throw new Error("Product model is missing.");
  const provided = new Set(Object.keys(productData({ file: "", name: "", image: "" }, "", "")));
  for (const field of model.fields) {
    if (field.kind !== "object" && field.isRequired && !field.isList &&
        !field.hasDefaultValue && !field.isUpdatedAt && !provided.has(field.name)) {
      throw new Error(`Unsupported required Product field: ${field.name}`);
    }
  }
}

function errorReason(error: unknown) {
  // Avoid printing connection strings or Prisma query arguments in reports.
  if (error instanceof Prisma.PrismaClientKnownRequestError) return `Database error ${error.code}`;
  if (error instanceof Prisma.PrismaClientInitializationError) return "Database connection failed.";
  return error instanceof Error ? error.message.replace(/postgres(?:ql)?:\/\/\S+/gi, "[database URL]") : "Unknown error";
}

async function main() {
  const args = process.argv.slice(2);
  const modes = args.filter((arg) => arg === "--dry-run" || arg === "--commit");
  let directory = SOURCE;
  for (let index = 0; index < args.length; index++) {
    if (args[index] === "--dir" && args[index + 1] && !args[index + 1].startsWith("--")) {
      directory = path.resolve(args[++index]);
    } else if (args[index] !== "--dry-run" && args[index] !== "--commit") {
      throw new Error(`Unknown or incomplete argument: ${args[index]}`);
    }
  }
  if (modes.length !== 1) {
    console.log('Usage: npx tsx scripts/import-products-from-images.ts (--dry-run | --commit) [--dir "image folder"]');
    if (args.length) process.exitCode = 1;
    return;
  }
  const commit = modes[0] === "--commit";
  const root = path.resolve(__dirname, "..");
  loadEnvConfig(root);
  validateSchema();
  const configuredBase = process.env.NEXT_PUBLIC_R2_PUBLIC_URL?.trim();
  if (!configuredBase) throw new Error("NEXT_PUBLIC_R2_PUBLIC_URL is missing.");
  const base = new URL(configuredBase);
  if (!["https:", "http:"].includes(base.protocol) || base.username || base.password || base.search || base.hash) {
    throw new Error("NEXT_PUBLIC_R2_PUBLIC_URL must be an HTTP(S) public base URL without credentials, query or fragment.");
  }
  const imageBase = `${base.href.replace(/\/+$/, "")}/products/`;
  const entries = await readdir(directory, { withFileTypes: true }).catch(() => {
    throw new Error(`Cannot read products directory: ${directory}`);
  });
  const files = entries.filter((entry) => entry.isFile() && EXTENSIONS.has(path.extname(entry.name).toLowerCase()))
    .map((entry) => entry.name).sort((a, b) => a < b ? -1 : a > b ? 1 : 0);
  const candidates: Candidate[] = [];
  const invalid: Issue[] = [];
  for (const file of files) {
    const name = file.slice(0, -path.extname(file).length);
    try {
      if (!normalizeName(name)) throw new Error("Empty product name");
      // Decode locally to detect corrupt images; no file or image is written.
      await sharp(path.join(directory, file), { failOn: "warning" }).stats();
      candidates.push({ file, name, image: imageBase + encodeURIComponent(file) });
    } catch (error) {
      invalid.push({ file, reason: errorReason(error) });
    }
  }
  console.log(`Image preflight: ${files.length} supported files, ${candidates.length} valid images, ${invalid.length} invalid files.`);
  for (const issue of invalid) console.error(`INVALID: ${issue.file}: ${issue.reason}`);
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is missing.");
  const prisma = new PrismaClient({ adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 15000,
  }) });
  const select = { name: true, slug: true, image: true } as const;
  const skipped: Issue[] = [];
  const failed: Issue[] = [];
  const samples: ReturnType<typeof productData>[] = [];
  let inserted = 0;
  let ready = 0;
  try {
    await prisma.$connect();
    const categories = await prisma.category.findMany({ where: { name: CATEGORY }, select: { id: true } });
    if (categories.length === 0) throw new Error(`Category "${CATEGORY}" was not found.`);
    if (categories.length !== 1) throw new Error(`Category "${CATEGORY}" is ambiguous: multiple exact matches.`);
    const categoryId = categories[0].id;
    const existing = await prisma.product.findMany({ select });
    for (const candidate of candidates) {
      if (duplicate(candidate, existing)) {
        skipped.push({ file: candidate.file, reason: "Equivalent product already exists or was selected earlier in this run" });
        continue;
      }
      try {
        let data = productData(candidate, categoryId, uniqueSlug(candidate.name, existing));
        if (commit) {
          const created = await prisma.$transaction(async (tx) => {
            // Product names are not unique in the schema. Serialize the check/create window.
            await tx.$executeRaw`LOCK TABLE "Product" IN SHARE ROW EXCLUSIVE MODE`;
            const current = await tx.product.findMany({ select });
            if (duplicate(candidate, current)) return null;
            data = productData(candidate, categoryId, uniqueSlug(candidate.name, current));
            return tx.product.create({ data: {
              ...data,
              stockMovements: { create: {
                type: StockMovementType.ADJUSTMENT, quantity: new Prisma.Decimal(20),
                stockBefore: new Prisma.Decimal(0), stockAfter: new Prisma.Decimal(20),
                note: "Opening stock from one-time image import",
              } },
            }, select });
          }, { maxWait: 15000, timeout: 30000 });
          if (!created) {
            skipped.push({ file: candidate.file, reason: "Equivalent product found during insert recheck" });
            continue;
          }
          inserted++;
        }
        existing.push({ name: data.name, slug: data.slug, image: data.image });
        ready++;
        if (samples.length < 5) samples.push(data);
      } catch (error) {
        failed.push({ file: candidate.file, reason: errorReason(error) });
      }
    }
    console.log(commit ? "IMPORT COMPLETE" : "PRODUCT IMPORT DRY RUN (no database writes)");
    console.log(JSON.stringify({ directory, category: CATEGORY, totalImageFiles: files.length,
      ignoredEntries: entries.length - files.length, validImages: candidates.length, invalidFiles: invalid.length,
      inserted, readyToInsert: commit ? 0 : ready, skippedExisting: skipped.length, failed: failed.length,
      defaultPrice: 2000, defaultStock: 20, minOrderQty: 1, orderStep: 1, imageBase,
      samples, skipped, invalid, failedProducts: failed,
    }, null, 2));
    if (failed.length || invalid.length) process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(`IMPORT_ABORTED: ${errorReason(error)}`);
  process.exitCode = 1;
});
