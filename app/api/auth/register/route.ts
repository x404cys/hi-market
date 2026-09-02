import type { NextRequest } from "next/server";
import {
  handleRouteError,
  readJsonBody,
  successResponse,
} from "@/lib/api-response";
import { registerInitialOwner } from "@/lib/services/user.service";
import { registerOwnerSchema } from "@/lib/validations/auth";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await readJsonBody(request);
    const input = registerOwnerSchema.parse(body);
    const user = await registerInitialOwner(input);

    return successResponse(user, 201);
  } catch (error) {
    return handleRouteError(error, {
      route: "POST /api/auth/register",
      method: "POST",
    });
  }
}
