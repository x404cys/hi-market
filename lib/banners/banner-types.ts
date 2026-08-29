import type { BannerPosition } from "@/app/generated/prisma";

export type BannerDto = {
  id: string;
  title: string | null;
  description: string | null;
  image: string;
  mobileImage: string | null;
  buttonText: string | null;
  link: string | null;
  position: BannerPosition;
  isActive: boolean;
  sortOrder: number;
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string;
  updatedAt: string;
  displayStatus: BannerDisplayStatus;
};

export type PublicBannerDto = Pick<
  BannerDto,
  | "id"
  | "title"
  | "description"
  | "image"
  | "mobileImage"
  | "buttonText"
  | "link"
>;

export type BannerDisplayStatus = "ACTIVE" | "INACTIVE" | "SCHEDULED" | "EXPIRED";

export type BannerListSummary = {
  total: number;
  active: number;
  scheduled: number;
  inactive: number;
};
