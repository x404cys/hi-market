import { handleRouteError, successResponse } from "@/lib/api-response";
import { getOrder } from "@/lib/services/order.service";
import { orderIdSchema } from "@/lib/validations/order";
import type { NextRequest } from "next/server";

type OrderRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export const runtime = "nodejs";

export async function GET(_request: NextRequest, context: OrderRouteContext) {
  try {
    const { id } = await context.params;
    const orderId = orderIdSchema.parse(id);
    const order = await getOrder(orderId);

    return successResponse(order);
  } catch (error) {
    return handleRouteError(error, {
      route: "GET /api/orders/[id]",
      method: "GET",
    });
  }
}
