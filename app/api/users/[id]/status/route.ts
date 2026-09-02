import { z } from "zod";
import type { NextRequest } from "next/server";
import {
  handleRouteError,
  readJsonBody,
  successResponse,
} from "@/lib/api-response";
import { requirePermission } from "@/lib/auth/guards";
import { setAdminUserActiveState } from "@/lib/services/user.service";
import { userIdSchema } from "@/lib/validations/auth";

type UserStatusRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const userStatusSchema = z
  .object({
    isActive: z.boolean(),
  })
  .strict();

export const runtime = "nodejs";

export async function PATCH(
  request: NextRequest,
  context: UserStatusRouteContext,
) {
  try {
    const actor = await requirePermission("users.deactivate");
    const { id } = await context.params;
    const userId = userIdSchema.parse(id);
    const body = await readJsonBody(request);
    const input = userStatusSchema.parse(body);
    const user = await setAdminUserActiveState(actor, userId, input.isActive);

    return successResponse(user);
  } catch (error) {
    return handleRouteError(error, {
      route: "PATCH /api/users/[id]/status",
      method: "PATCH",
    });
  }
}
