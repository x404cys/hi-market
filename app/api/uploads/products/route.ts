import { deleteProductImageObject } from "@/lib/r2";
import {
  errorResponse,
  handleRouteError,
  readJsonBody,
  successResponse,
} from "@/lib/api-response";
import { isValidProductImageKey } from "@/lib/r2-utils";
import { deleteProductImageSchema } from "@/lib/validations/product-upload";
import { requireAnyPermission } from "@/lib/auth/guards";
import type { NextRequest } from "next/server";

export const runtime = "nodejs";

export async function DELETE(request: NextRequest) {
  try {
    await requireAnyPermission(["products.create", "products.update", "products.delete"]);
    const body = await readJsonBody(request);
    const parsed = deleteProductImageSchema.safeParse(body);

    if (!parsed.success || !isValidProductImageKey(parsed.data.key)) {
      return errorResponse("Invalid image key", 400);
    }

    await deleteProductImageObject(parsed.data.key);

    return successResponse({ key: parsed.data.key });
  } catch (error) {
    if (error instanceof Error && error.message.includes("R2")) {
      console.error("R2 delete configuration failure", error);
      return errorResponse("Image upload service is unavailable", 503);
    }

    console.error("R2 delete failure", error);
    return handleRouteError(error);
  }
}
