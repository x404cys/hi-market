import type { NextRequest } from "next/server";
import {
  handleRouteError,
  readJsonBody,
  successResponse,
} from "@/lib/api-response";
import { requirePermission } from "@/lib/auth/guards";
import {
  getAdminUserById,
  updateAdminUser,
} from "@/lib/services/user.service";
import { updateUserSchema, userIdSchema } from "@/lib/validations/auth";

type UserRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export const runtime = "nodejs";

export async function GET(_request: NextRequest, context: UserRouteContext) {
  try {
    await requirePermission("users.read");
    const { id } = await context.params;
    const userId = userIdSchema.parse(id);
    const user = await getAdminUserById(userId);

    return successResponse(user);
  } catch (error) {
    return handleRouteError(error, {
      route: "GET /api/users/[id]",
      method: "GET",
    });
  }
}

export async function PATCH(request: NextRequest, context: UserRouteContext) {
  try {
    const actor = await requirePermission("users.update");
    const { id } = await context.params;
    const userId = userIdSchema.parse(id);
    const body = await readJsonBody(request);
    const input = updateUserSchema.parse(body);
    const user = await updateAdminUser(actor, userId, input);

    return successResponse(user);
  } catch (error) {
    return handleRouteError(error, {
      route: "PATCH /api/users/[id]",
      method: "PATCH",
    });
  }
}
