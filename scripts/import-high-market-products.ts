import "dotenv/config";

import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";

import prisma from "../lib/prisma";
import { ProductStatus, ProductUnit } from "../app/generated/prisma";

type LegacyCategory = {
  id: string;
  cat: string;
  name: string;
  image?: string;
};

type LegacyProduct = {
  id: string;
  cat: string;
  name: string;
  num: number;
  active?: boolean;
  desc?: string;
  images?: string[];
};

type LegacySeed = {
  categories: LegacyCategory[];
  products: LegacyProduct[];
};

type ImportReport = {
  startingProduct: string;
  ignoredBeforeStart: number;
  consideredAfterStart: number;
  inserted: number;
  skippedExisting: number;
  skippedInvalidPrice: number;
  missingImage: number;
  copiedImages: number;
  createdCategories: number;
};

const STARTING_PRODUCT_NAME = "لبنة تركية";
const DEFAULT_HTML_PATH =
  "C:\\Users\\um alqura\\Desktop\\HIGH MARKET final ver\\HIGH MARKET final ver\\index.html";
const DEFAULT_SOURCE_IMAGE_DIR =
  "C:\\Users\\um alqura\\Desktop\\HIGH MARKET final ver\\HIGH MARKET final ver\\images\\products";
const PUBLIC_PRODUCT_IMAGE_DIR = path.join(process.cwd(), "public", "images", "products");
const PUBLIC_PRODUCT_IMAGE_URL_PREFIX = "/images/products";

const dryRun = process.argv.includes("--dry-run");
const htmlPath = process.env.HIGH_MARKET_HTML_PATH || DEFAULT_HTML_PATH;
const sourceImageDir =
  process.env.HIGH_MARKET_PRODUCT_IMAGES_DIR || DEFAULT_SOURCE_IMAGE_DIR;

async function main() {
  const seed = await readLegacySeed(htmlPath);
  const productsToConsider = getProductsAfterStartingPoint(seed.products);
  const { categoryByLegacyId, createdCategories } = await resolveCategories(
    seed.categories,
    productsToConsider,
  );
  const sourceImages = await indexSourceImages(sourceImageDir);

  if (!dryRun) {
    await fs.mkdir(PUBLIC_PRODUCT_IMAGE_DIR, { recursive: true });
  }

  const report: ImportReport = {
    startingProduct: STARTING_PRODUCT_NAME,
    ignoredBeforeStart: seed.products.length - productsToConsider.length,
    consideredAfterStart: productsToConsider.length,
    inserted: 0,
    skippedExisting: 0,
    skippedInvalidPrice: 0,
    missingImage: 0,
    copiedImages: 0,
    createdCategories,
  };

  for (const legacyProduct of productsToConsider) {
    const name = cleanDisplayName(legacyProduct.name);
    const price = Number(legacyProduct.num);

    if (!name || !Number.isFinite(price) || price <= 0) {
      report.skippedInvalidPrice += 1;
      continue;
    }

    const slug = productSlug(name);
    const existingProduct = await prisma.product.findFirst({
      where: {
        OR: [{ slug }, { name: { equals: name, mode: "insensitive" } }],
      },
      select: { id: true },
    });

    if (existingProduct) {
      report.skippedExisting += 1;
      continue;
    }

    const categoryId = categoryByLegacyId.get(legacyProduct.cat);
    if (!categoryId) {
      throw new Error(`IMPORT_ABORTED: Missing category for product "${name}".`);
    }

    const imageAsset = await prepareProductImage(legacyProduct, sourceImages);
    if (!imageAsset) {
      report.missingImage += 1;
    } else if (imageAsset.copied) {
      report.copiedImages += 1;
    }

    if (dryRun) {
      report.inserted += 1;
      continue;
    }

    await prisma.product.create({
      data: {
        categoryId,
        brandId: null,
        name,
        slug,
        description: cleanOptionalText(legacyProduct.desc),
        price: price.toFixed(2),
        unit: ProductUnit.PIECE,
        isWeighted: false,
        minOrderQty: "1",
        orderStep: "1",
        stock: "0",
        lowStockAt: "0",
        trackInventory: false,
        allowBackorder: false,
        image: imageAsset?.publicUrl ?? null,
        status:
          legacyProduct.active === false
            ? ProductStatus.INACTIVE
            : ProductStatus.ACTIVE,
        isFeatured: false,
        sortOrder: report.inserted,
        images: imageAsset
          ? {
              create: [
                {
                  url: imageAsset.publicUrl,
                  alt: name,
                  sortOrder: 0,
                },
              ],
            }
          : undefined,
      },
      select: { id: true },
    });

    report.inserted += 1;
  }

  printReport(report);
}

async function readLegacySeed(filePath: string): Promise<LegacySeed> {
  const html = await fs.readFile(filePath, "utf8");
  const scriptMatch = html.match(
    /<script\s+type=["']text\/babel["'][^>]*>([\s\S]*?)<\/script>/i,
  );

  if (!scriptMatch) {
    throw new Error("IMPORT_ABORTED: Could not find the legacy catalog script.");
  }

  const script = scriptMatch[1];
  const seedStart = script.indexOf("const PLACEHOLDER");
  const functionStart = script.indexOf("function seedData()");

  if (seedStart < 0 || functionStart < 0) {
    throw new Error("IMPORT_ABORTED: Could not find seedData() in the HTML.");
  }

  const functionBodyStart = script.indexOf("{", functionStart);
  const functionEnd = findMatchingBrace(script, functionBodyStart);
  const executableSeedCode = `${script.slice(seedStart, functionEnd + 1)}\nseedData();`;

  const result = vm.runInNewContext(
    executableSeedCode,
    { Date, console, STORE_PHONE: "" },
    { timeout: 5000 },
  ) as LegacySeed;

  if (!Array.isArray(result.products) || !Array.isArray(result.categories)) {
    throw new Error("IMPORT_ABORTED: Legacy seedData() returned invalid data.");
  }

  return result;
}

function findMatchingBrace(source: string, openBraceIndex: number) {
  let depth = 0;

  for (let index = openBraceIndex; index < source.length; index += 1) {
    const character = source[index];

    if (character === "{") depth += 1;
    if (character === "}") depth -= 1;
    if (depth === 0) return index;
  }

  throw new Error("IMPORT_ABORTED: Could not parse seedData() function body.");
}

function getProductsAfterStartingPoint(products: LegacyProduct[]) {
  const startingName = normalizeArabicForComparison(STARTING_PRODUCT_NAME);
  const result: LegacyProduct[] = [];
  let importStarted = false;
  let ignoredBeforeStart = 0;

  for (const product of products) {
    const normalizedProductName = normalizeArabicForComparison(product.name);

    if (!importStarted) {
      if (normalizedProductName !== startingName) {
        ignoredBeforeStart += 1;
        continue;
      }

      importStarted = true;
    }

    result.push(product);
  }

  if (!importStarted) {
    throw new Error(
      `IMPORT_ABORTED: Starting product "${STARTING_PRODUCT_NAME}" was not found in the HTML.`,
    );
  }

  console.log(
    `Starting product found after ignoring ${ignoredBeforeStart} product(s).`,
  );

  return result;
}

async function resolveCategories(
  legacyCategories: LegacyCategory[],
  products: LegacyProduct[],
) {
  const categoryByLegacyId = new Map<string, string>();
  let createdCategories = 0;
  const neededLegacyCategoryIds = Array.from(
    new Set(products.map((product) => product.cat).filter(Boolean)),
  );

  for (const legacyCategoryId of neededLegacyCategoryIds) {
    const legacyCategory =
      legacyCategories.find((category) => category.cat === legacyCategoryId) ||
      legacyCategories.find((category) => category.id === legacyCategoryId);

    const categoryName =
      cleanDisplayName(legacyCategory?.name) || legacyCategoryId;
    const categorySlug = legacyCategoryId;

    const existingCategory = await prisma.category.findFirst({
      where: {
        OR: [
          { slug: categorySlug },
          { name: { equals: categoryName, mode: "insensitive" } },
        ],
      },
      select: { id: true },
    });

    if (existingCategory) {
      categoryByLegacyId.set(legacyCategoryId, existingCategory.id);
      continue;
    }

    if (dryRun) {
      categoryByLegacyId.set(legacyCategoryId, `dry-run:${categorySlug}`);
      createdCategories += 1;
      continue;
    }

    const createdCategory = await prisma.category.create({
      data: {
        name: categoryName,
        slug: categorySlug,
        image: normalizeLegacyAssetUrl(legacyCategory?.image),
        sortOrder: neededLegacyCategoryIds.indexOf(legacyCategoryId),
        isActive: true,
      },
      select: { id: true },
    });

    categoryByLegacyId.set(legacyCategoryId, createdCategory.id);
    createdCategories += 1;
  }

  return { categoryByLegacyId, createdCategories };
}

async function indexSourceImages(directory: string) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = entries.filter((entry) => entry.isFile()).map((entry) => entry.name);
  const byExactName = new Map<string, string>();
  const byNormalizedStem = new Map<string, string>();

  for (const fileName of files) {
    const fullPath = path.join(directory, fileName);
    byExactName.set(fileName, fullPath);
    byNormalizedStem.set(
      normalizeArabicForComparison(path.parse(fileName).name),
      fullPath,
    );
  }

  return { byExactName, byNormalizedStem };
}

async function prepareProductImage(
  product: LegacyProduct,
  sourceImages: Awaited<ReturnType<typeof indexSourceImages>>,
) {
  const imagePath = findSourceImage(product, sourceImages);
  if (!imagePath) return null;

  const fileName = path.basename(imagePath);
  const publicUrl = `${PUBLIC_PRODUCT_IMAGE_URL_PREFIX}/${encodeURIComponent(fileName)}`;
  const destinationPath = path.join(PUBLIC_PRODUCT_IMAGE_DIR, fileName);

  if (dryRun) {
    return { publicUrl, copied: false };
  }

  const destinationExists = await pathExists(destinationPath);
  if (!destinationExists) {
    await fs.copyFile(imagePath, destinationPath);
  }

  return { publicUrl, copied: !destinationExists };
}

function findSourceImage(
  product: LegacyProduct,
  sourceImages: Awaited<ReturnType<typeof indexSourceImages>>,
) {
  const expectedImage = product.images?.[0]
    ? path.basename(product.images[0])
    : `${product.name}.jpg`;
  const exactPath = sourceImages.byExactName.get(expectedImage);

  if (exactPath) return exactPath;

  const nameStem = normalizeArabicForComparison(product.name);
  return sourceImages.byNormalizedStem.get(nameStem) ?? null;
}

async function pathExists(filePath: string) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function productSlug(name: string) {
  const normalizedName = normalizeArabicForComparison(name);
  const hash = crypto
    .createHash("sha1")
    .update(normalizedName)
    .digest("hex")
    .slice(0, 12);

  return `hm-product-${hash}`;
}

function normalizeLegacyAssetUrl(value?: string) {
  if (!value) return null;
  return value.startsWith("/") ? value : `/${value}`;
}

function cleanDisplayName(value?: string) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function cleanOptionalText(value?: string) {
  const text = cleanDisplayName(value);
  return text || null;
}

function normalizeArabicForComparison(value?: string) {
  return cleanDisplayName(value)
    .normalize("NFKC")
    .replace(/[\u064B-\u065F\u0670\u0640]/g, "")
    .replace(/[إأآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function printReport(report: ImportReport) {
  console.log("");
  console.log(dryRun ? "High Market import dry run:" : "High Market import complete:");
  console.log(`Starting product: ${report.startingProduct}`);
  console.log(`Products before starting point ignored: ${report.ignoredBeforeStart}`);
  console.log(`Products considered after starting point: ${report.consideredAfterStart}`);
  console.log(`Inserted: ${report.inserted}`);
  console.log(`Skipped existing: ${report.skippedExisting}`);
  console.log(`Skipped invalid price: ${report.skippedInvalidPrice}`);
  console.log(`Missing image: ${report.missingImage}`);
  console.log(`Copied images: ${report.copiedImages}`);
  console.log(
    dryRun
      ? `Categories to create: ${report.createdCategories}`
      : `Created categories: ${report.createdCategories}`,
  );
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
