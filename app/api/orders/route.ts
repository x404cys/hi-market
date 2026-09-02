import {
  handleRouteError,
  readJsonBody,
  successResponse,
  validationErrorResponse,
} from "@/lib/api-response";
import {
  createDebugId,
  createDebugTracker,
  sanitizeForDebug,
} from "@/lib/debug/server-debug";
import { createGuestOrder, listOrders } from "@/lib/services/order.service";
import { requirePermission } from "@/lib/auth/guards";
import { createGuestOrderSchema } from "@/lib/validations/checkout";
import { orderQuerySchema } from "@/lib/validations/order";
import type { NextRequest } from "next/server";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    await requirePermission("orders.read");
    const searchParams = request.nextUrl.searchParams;
    const query = orderQuerySchema.parse({
      page: searchParams.get("page") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
      search: searchParams.get("search") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      date: searchParams.get("date") ?? undefined,
      deliveryZoneId: searchParams.get("deliveryZoneId") ?? undefined,
      sortBy: searchParams.get("sortBy") ?? undefined,
      order: searchParams.get("order") ?? undefined,
    });
    const result = await listOrders(query);

    return successResponse(result);
  } catch (error) {
    return handleRouteError(error, {
      route: "GET /api/orders",
      method: "GET",
    });
  }
}

export async function POST(request: NextRequest) {
  const route = "POST /api/orders";
  const method = "POST";
  const debugId = createDebugId();
  const tracker = createDebugTracker(route, debugId);
  let body: unknown;

  try {
    tracker.stage("[ORDER 1] Request received", {
      method,
      url: request.nextUrl.pathname,
    });

    body = await readJsonBody(request);
    tracker.stage("[ORDER 2] JSON parsed", {
      payload: sanitizeForDebug(body),
    });

    tracker.stage("[ORDER 3] Zod validation started");
    const parsed = createGuestOrderSchema.safeParse(body);

    if (!parsed.success) {
      tracker.fail("[ORDER 3 FAILED] Validation failed", parsed.error, {
        payload: body,
      });

      return validationErrorResponse(parsed.error, {
        route,
        method,
        status: 400,
        debugId,
        lastStage: tracker.lastStage,
        payload: body,
      });
    }

    tracker.stage("[ORDER 4] Validation passed", {
      itemCount: parsed.data.items.length,
      productIds: parsed.data.items.map((item) => item.productId),
      hasDeliveryZone: Boolean(parsed.data.deliveryZoneId),
      hasCoupon: Boolean(parsed.data.couponCode),
    });

    const order = await createGuestOrder(parsed.data, { tracker, debugId });

    tracker.stage("[ORDER 14] Response returned", {
      orderId: order.id,
      orderNumber: order.orderNumber,
      total: order.total,
    });

    return successResponse(order, 201);
  } catch (error) {
    tracker.fail("[POST /api/orders FAILED]", error, {
      payload: body,
    });

    return handleRouteError(error, {
      route,
      method,
      debugId,
      lastStage: tracker.lastStage,
      payload: body,
    });
  }
}
