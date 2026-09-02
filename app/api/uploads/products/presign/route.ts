import { createProductImagePresignedPutUrl } from "@/lib/r2";
import {
  errorResponse,
  handleRouteError,
  readJsonBody,
  successResponse,
} from "@/lib/api-response";
import { MAX_PRODUCT_IMAGE_SIZE_BYTES } from "@/lib/r2-utils";
import { productImagePresignSchema } from "@/lib/validations/product-upload";
import { requireAnyPermission } from "@/lib/auth/guards";
import type { NextRequest } from "next/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    await requireAnyPermission(["products.create", "products.update"]);
    const body = await readJsonBody(request);

    const parsed =
      productImagePresignSchema.safeParse(body);

    if (!parsed.success) {
      const field = parsed.error.issues[0]?.path[0];

      if (field === "fileType") {
        return errorResponse(
          "Invalid image type",
          400,
        );
      }

      if (field === "fileSize") {
        return errorResponse(
          "Image exceeds the maximum allowed size",
          400,
          {
            fileSize: [
              `Maximum file size is ${MAX_PRODUCT_IMAGE_SIZE_BYTES} bytes`,
            ],
          },
        );
      }

      return errorResponse(
        "Invalid image metadata",
        400,
      );
    }

    const upload =
      await createProductImagePresignedPutUrl(
        parsed.data.fileType,
      );

    return successResponse(upload);
  } catch (error) {
    console.error(
      "POST /api/uploads/products/presign FAILED:",
      error,
    );

    if (error instanceof Error) {
      console.error("R2 ERROR MESSAGE:", error.message);

      if (
        error.message.includes(
          "NEXT_PUBLIC_R2_PUBLIC_URL",
        )
      ) {
        return errorResponse(
          "R2 public URL is not configured",
          503,
        );
      }

      if (
        error.message.includes(
          "Cloudflare R2 is not configured",
        )
      ) {
        return errorResponse(
          "Cloudflare R2 credentials are not configured",
          503,
        );
      }
    }

    return handleRouteError(error);
  }
}
