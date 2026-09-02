import type { NextRequest } from "next/server";
import {
  handleRouteError,
  readJsonBody,
  successResponse,
} from "@/lib/api-response";
import { requirePermission } from "@/lib/auth/guards";
import {
  createAdminUser,
  listAdminUsers,
} from "@/lib/services/user.service";
import { createUserSchema } from "@/lib/validations/auth";

export const runtime = "nodejs";

export async function GET() {
  try {
    await requirePermission("users.read");
    const users = await listAdminUsers();

    return successResponse(users);
  } catch (error) {
    return handleRouteError(error, {
      route: "GET /api/users",
      method: "GET",
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const actor = await requirePermission("users.create");
    const body = await readJsonBody(request);
    const input = createUserSchema.parse(body);
    const user = await createAdminUser(actor, input);

    return successResponse(user, 201);
  } catch (error) {
    return handleRouteError(error, {
      route: "POST /api/users",
      method: "POST",
    });
  }
}
