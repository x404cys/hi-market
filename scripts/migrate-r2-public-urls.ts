import "dotenv/config";
import prisma from "../lib/prisma";
import { getR2PublicUrl } from "../lib/r2-utils";

type UrlFieldChange = {
  model: "Product" | "ProductImage" | "Banner";
  id: string;
  field: "image" | "url" | "mobileImage";
  newUrl: string;
};

async function main() {
  const changes: UrlFieldChange[] = [];

  const [products, productImages, banners] = await Promise.all([
    prisma.product.findMany({
      where: { image: { contains: ".r2.cloudflarestorage.com" } },
      select: { id: true, image: true },
    }),
    prisma.productImage.findMany({
      where: { url: { contains: ".r2.cloudflarestorage.com" } },
      select: { id: true, url: true },
    }),
    prisma.banner.findMany({
      where: {
        OR: [
          { image: { contains: ".r2.cloudflarestorage.com" } },
          { mobileImage: { contains: ".r2.cloudflarestorage.com" } },
        ],
      },
      select: { id: true, image: true, mobileImage: true },
    }),
  ]);

  for (const product of products) {
    addChange(changes, "Product", product.id, "image", product.image);
  }

  for (const image of productImages) {
    addChange(changes, "ProductImage", image.id, "url", image.url);
  }

  for (const banner of banners) {
    addChange(changes, "Banner", banner.id, "image", banner.image);
    addChange(changes, "Banner", banner.id, "mobileImage", banner.mobileImage);
  }

  if (changes.length === 0) {
    console.log("No old r2.cloudflarestorage.com image URLs found.");
    return;
  }

  await prisma.$transaction(
    changes.map((change) => {
      if (change.model === "Product") {
        return prisma.product.update({
          where: { id: change.id },
          data: { image: change.newUrl },
          select: { id: true },
        });
      }

      if (change.model === "ProductImage") {
        return prisma.productImage.update({
          where: { id: change.id },
          data: { url: change.newUrl },
          select: { id: true },
        });
      }

      return prisma.banner.update({
        where: { id: change.id },
        data: { [change.field]: change.newUrl },
        select: { id: true },
      });
    }),
  );

  const remaining = await countRemainingLegacyUrls();

  console.log(`Migrated ${changes.length} old R2 image URL(s).`);
  console.log(`Remaining r2.cloudflarestorage.com image URL(s): ${remaining}`);
}

function addChange(
  changes: UrlFieldChange[],
  model: UrlFieldChange["model"],
  id: string,
  field: UrlFieldChange["field"],
  value: string | null,
) {
  if (!value) return;

  const key = getKeyFromLegacyR2Url(value);
  if (!key) return;

  changes.push({
    model,
    id,
    field,
    newUrl: getR2PublicUrl(key),
  });
}

function getKeyFromLegacyR2Url(value: string) {
  try {
    const url = new URL(value);

    if (!url.hostname.endsWith(".r2.cloudflarestorage.com")) {
      return null;
    }

    const bucketName = process.env.R2_BUCKET_NAME;
    const segments = decodeURIComponent(url.pathname)
      .split("/")
      .filter(Boolean);

    if (bucketName && segments[0] === bucketName) {
      segments.shift();
    }

    const key = segments.join("/");

    return key || null;
  } catch {
    return null;
  }
}

async function countRemainingLegacyUrls() {
  const [productCount, productImageCount, bannerCount] = await Promise.all([
    prisma.product.count({
      where: { image: { contains: ".r2.cloudflarestorage.com" } },
    }),
    prisma.productImage.count({
      where: { url: { contains: ".r2.cloudflarestorage.com" } },
    }),
    prisma.banner.count({
      where: {
        OR: [
          { image: { contains: ".r2.cloudflarestorage.com" } },
          { mobileImage: { contains: ".r2.cloudflarestorage.com" } },
        ],
      },
    }),
  ]);

  return productCount + productImageCount + bannerCount;
}

main()
  .catch((error) => {
    console.error("Failed to migrate R2 public image URLs", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
