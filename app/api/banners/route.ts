import { revalidatePath } from "next/cache";
import type { NextRequest } from "next/server";
import {
  createBanner,
  listBanners,
} from "@/lib/services/banner.service";
import {
  handleRouteError,
  readJsonBody,
  successResponse,
} from "@/lib/api-response";
import { createBannerSchema } from "@/lib/validations/banner";

export const runtime = "nodejs";

export async function GET() {
  try {
    const result = await listBanners();

    return successResponse(result);
  } catch (error) {
    return handleRouteError(error, {
      route: "/api/banners",
      method: "GET",
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await readJsonBody(request);
    const input = createBannerSchema.parse(body);
    const banner = await createBanner(input);

    revalidatePath("/");
    revalidatePath("/dashboard/banners");

    return successResponse(banner, 201);
  } catch (error) {
    return handleRouteError(error, {
      route: "/api/banners",
      method: "POST",
    });
  }
}
