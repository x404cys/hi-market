import type { NextRequest } from "next/server";
import {
  handleRouteError,
  readJsonBody,
  successResponse,
} from "@/lib/api-response";
import { requirePermission } from "@/lib/auth/guards";
import { resetAdminUserPassword } from "@/lib/services/user.service";
import { resetPasswordSchema, userIdSchema } from "@/lib/validations/auth";

type ResetPasswordRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export const runtime = "nodejs";

export async function POST(
  request: NextRequest,
  context: ResetPasswordRouteContext,
) {
  try {
    const actor = await requirePermission("users.update");
    const { id } = await context.params;
    const userId = userIdSchema.parse(id);
    const body = await readJsonBody(request);
    const input = resetPasswordSchema.parse(body);
    const result = await resetAdminUserPassword(actor, userId, input);

    return successResponse(result);
  } catch (error) {
    return handleRouteError(error, {
      route: "POST /api/users/[id]/reset-password",
      method: "POST",
    });
  }
}
