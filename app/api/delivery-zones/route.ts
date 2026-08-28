import { handleRouteError, successResponse } from "@/lib/api-response";
import { listActiveDeliveryZones } from "@/lib/services/delivery-zone.service";

export const runtime = "nodejs";

export async function GET() {
  try {
    const zones = await listActiveDeliveryZones();

    return successResponse(zones);
  } catch (error) {
    return handleRouteError(error);
  }
}
