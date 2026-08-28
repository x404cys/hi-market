import {
  handleRouteError,
  readJsonBody,
  successResponse,
} from "@/lib/api-response";
import {
  createCategoryOption,
  listCategoryOptions,
} from "@/lib/services/catalog-options.service";
import { quickCreateCategorySchema } from "@/lib/validations/catalog";
import type { NextRequest } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  try {
    const categories = await listCategoryOptions();

    return successResponse(categories);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await readJsonBody(request);
    const input = quickCreateCategorySchema.parse(body);

    const category = await createCategoryOption(input);

    return successResponse(category, 201);
  } catch (error) {
    console.error("POST /api/categories failed:", error);
    return handleRouteError(error);
  }
}