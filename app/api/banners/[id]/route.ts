import { revalidatePath } from "next/cache";
import type { NextRequest } from "next/server";
import {
  deleteBanner,
  getBannerById,
  updateBanner,
} from "@/lib/services/banner.service";
import {
  handleRouteError,
  readJsonBody,
  successResponse,
} from "@/lib/api-response";
import {
  bannerIdSchema,
  updateBannerSchema,
} from "@/lib/validations/banner";

type BannerRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export const runtime = "nodejs";

export async function GET(_request: NextRequest, context: BannerRouteContext) {
  try {
    const { id } = await context.params;
    const bannerId = bannerIdSchema.parse(id);
    const banner = await getBannerById(bannerId);

    return successResponse(banner);
  } catch (error) {
    return handleRouteError(error, {
      route: "/api/banners/[id]",
      method: "GET",
    });
  }
}

export async function PATCH(request: NextRequest, context: BannerRouteContext) {
  try {
    const { id } = await context.params;
    const bannerId = bannerIdSchema.parse(id);
    const body = await readJsonBody(request);
    const input = updateBannerSchema.parse(body);
    const banner = await updateBanner(bannerId, input);

    revalidatePath("/");
    revalidatePath("/dashboard/banners");
    revalidatePath(`/dashboard/banners/${bannerId}/edit`);

    return successResponse(banner);
  } catch (error) {
    return handleRouteError(error, {
      route: "/api/banners/[id]",
      method: "PATCH",
    });
  }
}

export async function DELETE(_request: NextRequest, context: BannerRouteContext) {
  try {
    const { id } = await context.params;
    const bannerId = bannerIdSchema.parse(id);
    const banner = await deleteBanner(bannerId);

    revalidatePath("/");
    revalidatePath("/dashboard/banners");

    return successResponse(banner);
  } catch (error) {
    return handleRouteError(error, {
      route: "/api/banners/[id]",
      method: "DELETE",
    });
  }
}
