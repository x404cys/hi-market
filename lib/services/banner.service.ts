import { BannerPosition, Prisma } from "@/app/generated/prisma";
import { ApiError } from "@/lib/api-response";
import type {
  BannerDisplayStatus,
  BannerDto,
  BannerListSummary,
  PublicBannerDto,
} from "@/lib/banners/banner-types";
import {
  deleteBannerImageObjects,
} from "@/lib/r2";
import { getOwnedBannerImageKeyFromUrl } from "@/lib/r2-utils";
import prisma from "@/lib/prisma";
import type {
  CreateBannerInput,
  UpdateBannerInput,
} from "@/lib/validations/banner";

const bannerSelect = {
  id: true,
  title: true,
  description: true,
  image: true,
  mobileImage: true,
  buttonText: true,
  link: true,
  position: true,
  isActive: true,
  sortOrder: true,
  startsAt: true,
  endsAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.BannerSelect;

type BannerRecord = Prisma.BannerGetPayload<{
  select: typeof bannerSelect;
}>;

export async function getActiveHeroBanner(): Promise<PublicBannerDto | null> {
  const now = new Date();
  const banner = await prisma.banner.findFirst({
    where: {
      position: BannerPosition.HERO,
      isActive: true,
      OR: [{ startsAt: null }, { startsAt: { lte: now } }],
      AND: [{ OR: [{ endsAt: null }, { endsAt: { gte: now } }] }],
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    select: bannerSelect,
  });

  return banner ? serializePublicBanner(banner) : null;
}

export async function listBanners() {
  const banners = await prisma.banner.findMany({
    orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }],
    select: bannerSelect,
  });
  const serialized = banners.map(serializeBanner);

  return {
    data: serialized,
    summary: buildBannerSummary(serialized),
  };
}

export async function getBannerById(id: string) {
  const banner = await prisma.banner.findUnique({
    where: { id },
    select: bannerSelect,
  });

  if (!banner) {
    throw new ApiError("Banner not found", 404);
  }

  return serializeBanner(banner);
}

export async function createBanner(input: CreateBannerInput) {
  const banner = await prisma.banner.create({
    data: {
      title: input.title,
      description: input.description,
      image: input.image,
      mobileImage: input.mobileImage,
      buttonText: input.buttonText,
      link: input.link,
      position: input.position,
      isActive: input.isActive,
      sortOrder: input.sortOrder,
      startsAt: input.startsAt ? new Date(input.startsAt) : null,
      endsAt: input.endsAt ? new Date(input.endsAt) : null,
    },
    select: bannerSelect,
  });

  return serializeBanner(banner);
}

export async function updateBanner(id: string, input: UpdateBannerInput) {
  const current = await prisma.banner.findUnique({
    where: { id },
    select: bannerSelect,
  });

  if (!current) {
    throw new ApiError("Banner not found", 404);
  }

  const updated = await prisma.banner.update({
    where: { id },
    data: buildBannerUpdateData(input),
    select: bannerSelect,
  });

  await cleanupReplacedBannerImages(current, updated);

  return serializeBanner(updated);
}

export async function deleteBanner(id: string) {
  const banner = await prisma.banner.findUnique({
    where: { id },
    select: bannerSelect,
  });

  if (!banner) {
    throw new ApiError("Banner not found", 404);
  }

  await prisma.banner.delete({
    where: { id },
    select: { id: true },
  });

  await cleanupBannerImages([banner.image, banner.mobileImage]);

  return serializeBanner(banner);
}

function buildBannerUpdateData(input: UpdateBannerInput): Prisma.BannerUpdateInput {
  const data: Prisma.BannerUpdateInput = {};

  if (input.title !== undefined) data.title = input.title;
  if (input.description !== undefined) data.description = input.description;
  if (input.image !== undefined) data.image = input.image;
  if (input.mobileImage !== undefined) data.mobileImage = input.mobileImage;
  if (input.buttonText !== undefined) data.buttonText = input.buttonText;
  if (input.link !== undefined) data.link = input.link;
  if (input.position !== undefined) data.position = input.position;
  if (input.isActive !== undefined) data.isActive = input.isActive;
  if (input.sortOrder !== undefined) data.sortOrder = input.sortOrder;
  if (input.startsAt !== undefined) {
    data.startsAt = input.startsAt ? new Date(input.startsAt) : null;
  }
  if (input.endsAt !== undefined) {
    data.endsAt = input.endsAt ? new Date(input.endsAt) : null;
  }

  return data;
}

async function cleanupReplacedBannerImages(
  current: BannerRecord,
  updated: BannerRecord,
) {
  const removedUrls = [
    current.image !== updated.image ? current.image : null,
    current.mobileImage && current.mobileImage !== updated.mobileImage
      ? current.mobileImage
      : null,
  ];

  await cleanupBannerImages(removedUrls);
}

async function cleanupBannerImages(urls: Array<string | null>) {
  const keys = urls
    .map((url) => (url ? getOwnedBannerImageKeyFromUrl(url) : null))
    .filter((key): key is string => Boolean(key));

  if (keys.length === 0) return;

  await deleteBannerImageObjects(keys);
}

function buildBannerSummary(banners: BannerDto[]): BannerListSummary {
  return {
    total: banners.length,
    active: banners.filter((banner) => banner.displayStatus === "ACTIVE").length,
    scheduled: banners.filter((banner) => banner.displayStatus === "SCHEDULED").length,
    inactive: banners.filter((banner) => banner.displayStatus === "INACTIVE").length,
  };
}

function getBannerDisplayStatus(banner: BannerRecord): BannerDisplayStatus {
  const now = Date.now();

  if (!banner.isActive) return "INACTIVE";
  if (banner.startsAt && banner.startsAt.getTime() > now) return "SCHEDULED";
  if (banner.endsAt && banner.endsAt.getTime() < now) return "EXPIRED";

  return "ACTIVE";
}

function serializeBanner(banner: BannerRecord): BannerDto {
  return {
    ...banner,
    startsAt: banner.startsAt?.toISOString() ?? null,
    endsAt: banner.endsAt?.toISOString() ?? null,
    createdAt: banner.createdAt.toISOString(),
    updatedAt: banner.updatedAt.toISOString(),
    displayStatus: getBannerDisplayStatus(banner),
  };
}

function serializePublicBanner(banner: BannerRecord): PublicBannerDto {
  return {
    id: banner.id,
    title: banner.title,
    description: banner.description,
    image: banner.image,
    mobileImage: banner.mobileImage,
    buttonText: banner.buttonText,
    link: banner.link,
  };
}
