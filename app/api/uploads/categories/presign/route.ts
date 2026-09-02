import { createCategoryImagePresignedPutUrl } from "@/lib/r2";
import {
  errorResponse,
  handleRouteError,
  readJsonBody,
  successResponse,
} from "@/lib/api-response";
import { MAX_CATEGORY_IMAGE_SIZE_BYTES } from "@/lib/r2-utils";
import { categoryImagePresignSchema } from "@/lib/validations/product-upload";
import { requirePermission } from "@/lib/auth/guards";
import type { NextRequest } from "next/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    await requirePermission("categories.manage");
    const body = await readJsonBody(request);
    const parsed = categoryImagePresignSchema.safeParse(body);

    if (!parsed.success) {
      const field = parsed.error.issues[0]?.path[0];

      if (field === "fileType") {
        return errorResponse("Invalid image type", 400);
      }

      if (field === "fileSize") {
        return errorResponse("Image exceeds the maximum allowed size", 400, {
          fileSize: [`Maximum file size is ${MAX_CATEGORY_IMAGE_SIZE_BYTES} bytes`],
        });
      }

      return errorResponse("Invalid image metadata", 400);
    }

    const upload = await createCategoryImagePresignedPutUrl(parsed.data.fileType);

    return successResponse(upload);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("NEXT_PUBLIC_R2_PUBLIC_URL")) {
        return errorResponse("R2 public URL is not configured", 503);
      }

      if (error.message.includes("Cloudflare R2 is not configured")) {
        return errorResponse("Cloudflare R2 credentials are not configured", 503);
      }
    }

    return handleRouteError(error, {
      route: "/api/uploads/categories/presign",
      method: "POST",
    });
  }
}
