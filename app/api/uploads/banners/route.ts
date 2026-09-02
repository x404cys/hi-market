import { deleteBannerImageObject } from "@/lib/r2";
import {
  errorResponse,
  handleRouteError,
  readJsonBody,
  successResponse,
} from "@/lib/api-response";
import { isValidBannerImageKey } from "@/lib/r2-utils";
import { deleteBannerImageSchema } from "@/lib/validations/product-upload";
import { requirePermission } from "@/lib/auth/guards";
import type { NextRequest } from "next/server";

export const runtime = "nodejs";

export async function DELETE(request: NextRequest) {
  try {
    await requirePermission("banners.manage");
    const body = await readJsonBody(request);
    const parsed = deleteBannerImageSchema.safeParse(body);

    if (!parsed.success || !isValidBannerImageKey(parsed.data.key)) {
      return errorResponse("Invalid image key", 400);
    }

    await deleteBannerImageObject(parsed.data.key);

    return successResponse({ key: parsed.data.key });
  } catch (error) {
    if (error instanceof Error && error.message.includes("R2")) {
      console.error("R2 banner delete configuration failure", error);
      return errorResponse("Image upload service is unavailable", 503);
    }

    console.error("R2 banner delete failure", error);
    return handleRouteError(error, {
      route: "/api/uploads/banners",
      method: "DELETE",
    });
  }
}
