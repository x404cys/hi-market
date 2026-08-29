import "server-only";
import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  getExtensionForProductImageMimeType,
  BANNER_IMAGE_PREFIX,
  getR2PublicUrl,
  isValidBannerImageKey,
  isValidProductImageKey,
  PRODUCT_IMAGE_PREFIX,
  type ProductImageMimeType,
} from "@/lib/r2-utils";

type R2Config = {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
};

let r2Client: S3Client | null = null;

function getR2Config(): R2Config {
  const accountId = "624a1ca9c651db4b04dc9c671c88d3e9";
  const accessKeyId = "10771dc76a04d1df7a7274afe3a260b8";
  const secretAccessKey = "645c284931ccc772040d5cd127756b697676ebef42be9232b45658e1020ed7fb";
  const bucketName = "himarket";

  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
    throw new Error("Cloudflare R2 is not configured");
  }

  return {
    accountId,
    accessKeyId,
    secretAccessKey,
    bucketName,
  };
}

function getR2Client() {
  if (r2Client) return r2Client;

  const config = getR2Config();

  r2Client = new S3Client({
    region: "auto",
    endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });

  return r2Client;
}

export async function createProductImagePresignedPutUrl(fileType: ProductImageMimeType) {
  const config = getR2Config();
  const key = `${PRODUCT_IMAGE_PREFIX}${crypto.randomUUID()}.${getExtensionForProductImageMimeType(fileType)}`;
  const command = new PutObjectCommand({
    Bucket: config.bucketName,
    Key: key,
    ContentType: fileType,
  });
  const uploadUrl = await getSignedUrl(getR2Client(), command, {
    expiresIn: 300,
  });

  return {
    uploadUrl,
    key,
    publicUrl: getR2PublicUrl(key),
  };
}

export async function createBannerImagePresignedPutUrl(fileType: ProductImageMimeType) {
  const config = getR2Config();
  const key = `${BANNER_IMAGE_PREFIX}${crypto.randomUUID()}.${getExtensionForProductImageMimeType(fileType)}`;
  const command = new PutObjectCommand({
    Bucket: config.bucketName,
    Key: key,
    ContentType: fileType,
  });
  const uploadUrl = await getSignedUrl(getR2Client(), command, {
    expiresIn: 300,
  });

  return {
    uploadUrl,
    key,
    publicUrl: getR2PublicUrl(key),
  };
}

export async function deleteProductImageObject(key: string) {
  if (!isValidProductImageKey(key)) {
    throw new Error("Invalid product image key");
  }

  const config = getR2Config();

  await getR2Client().send(
    new DeleteObjectCommand({
      Bucket: config.bucketName,
      Key: key,
    }),
  );
}

export async function deleteBannerImageObject(key: string) {
  if (!isValidBannerImageKey(key)) {
    throw new Error("Invalid banner image key");
  }

  const config = getR2Config();

  await getR2Client().send(
    new DeleteObjectCommand({
      Bucket: config.bucketName,
      Key: key,
    }),
  );
}

export async function deleteProductImageObjects(keys: string[]) {
  const uniqueKeys = Array.from(new Set(keys)).filter(isValidProductImageKey);
  const results = await Promise.allSettled(
    uniqueKeys.map((key) => deleteProductImageObject(key)),
  );

  results.forEach((result, index) => {
    if (result.status === "rejected") {
      console.error("Failed to delete product image from R2", {
        key: uniqueKeys[index],
        error: result.reason,
      });
    }
  });
}

export async function deleteBannerImageObjects(keys: string[]) {
  const uniqueKeys = Array.from(new Set(keys)).filter(isValidBannerImageKey);
  const results = await Promise.allSettled(
    uniqueKeys.map((key) => deleteBannerImageObject(key)),
  );

  results.forEach((result, index) => {
    if (result.status === "rejected") {
      console.error("Failed to delete banner image from R2", {
        key: uniqueKeys[index],
        error: result.reason,
      });
    }
  });
}
