import {
  handleRouteError,
  readJsonBody,
  successResponse,
} from "@/lib/api-response";
import {
  createBrandOption,
  listBrandOptions,
} from "@/lib/services/catalog-options.service";
import { quickCreateBrandSchema } from "@/lib/validations/catalog";
import type { NextRequest } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  try {
    const brands = await listBrandOptions();

    return successResponse(brands);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await readJsonBody(request);
    const input = quickCreateBrandSchema.parse(body);
    const brand = await createBrandOption(input);

    return successResponse(brand, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
