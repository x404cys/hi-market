import { errorResponse } from "@/lib/api-response";

export const runtime = "nodejs";

export function GET() {
  return errorResponse("Authentication is not configured", 404);
}

export function POST() {
  return errorResponse("Authentication is not configured", 404);
}
