import {
  handleRouteError,
  readJsonBody,
  successResponse,
} from "@/lib/api-response";
import { updateOrderStatus } from "@/lib/services/order.service";
import { requirePermission } from "@/lib/auth/guards";
import {
  orderIdSchema,
  updateOrderStatusSchema,
} from "@/lib/validations/order";
import type { NextRequest } from "next/server";

type OrderStatusRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export const runtime = "nodejs";

export async function PATCH(
  request: NextRequest,
  context: OrderStatusRouteContext,
) {
  try {
    const { id } = await context.params;
    const orderId = orderIdSchema.parse(id);
    const body = await readJsonBody(request);
    const input = updateOrderStatusSchema.parse(body);
    await requirePermission(
      input.status === "CANCELLED" ? "orders.cancel" : "orders.updateStatus",
    );
    const order = await updateOrderStatus(orderId, input);

    return successResponse(order);
  } catch (error) {
    return handleRouteError(error, {
      route: "PATCH /api/orders/[id]/status",
      method: "PATCH",
    });
  }
}
