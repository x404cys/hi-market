import { NextResponse } from "next/server";
import { ZodError } from "zod";
import {
  buildDevelopmentDebug,
  debugError,
  isDevelopment,
  zodIssuesToFieldErrors,
  type DebugContext,
  type DevelopmentDebug,
} from "@/lib/debug/server-debug";

type ErrorDetails = Record<string, unknown>;

export class ApiError extends Error {
  status: number;
  details?: ErrorDetails;
  code?: string;

  constructor(
    message: string,
    status = 500,
    details?: ErrorDetails,
    code?: string,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
    this.code = code;
  }
}

export function successResponse<T>(data: T, status = 200) {
  return NextResponse.json(
    {
      success: true,
      data,
    },
    { status },
  );
}

export function paginatedResponse<T>(
  data: T,
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  },
  status = 200,
  extra?: Record<string, unknown>,
) {
  return NextResponse.json(
    {
      success: true,
      data,
      pagination,
      ...(extra ?? {}),
    },
    { status },
  );
}

export function errorResponse(
  message: string,
  status = 500,
  details?: ErrorDetails,
  debug?: DevelopmentDebug,
) {
  return NextResponse.json(
    {
      success: false,
      message,
      ...(details ? { errors: details } : {}),
      ...(debug?.debugId ? { debugId: debug.debugId } : {}),
      ...(debug ? { debug } : {}),
    },
    { status },
  );
}

export function validationErrorResponse(
  error: ZodError,
  context?: DebugContext,
) {
  const status = context?.status ?? 400;
  const debugContext = {
    ...context,
    status,
  };

  debugError({
    scope: context?.route ?? "API",
    error,
    context: debugContext,
  });

  return errorResponse(
    "Validation failed",
    status,
    zodIssuesToFieldErrors(error.issues),
    isDevelopment ? buildDevelopmentDebug(error, debugContext) : undefined,
  );
}

export function handleRouteError(error: unknown, context?: DebugContext) {
  if (error instanceof ApiError) {
    const debugContext = {
      ...context,
      status: error.status,
    };

    debugError({
      scope: context?.route ?? "API",
      error,
      context: debugContext,
    });

    return errorResponse(
      error.message,
      error.status,
      error.details,
      isDevelopment ? buildDevelopmentDebug(error, debugContext) : undefined,
    );
  }

  if (error instanceof ZodError) {
    return validationErrorResponse(error, context);
  }

  if (isPrismaKnownRequestError(error)) {
    const debugContext = { ...context, status: getPrismaHttpStatus(error.code) };

    debugError({
      scope: context?.route ?? "API",
      error,
      context: debugContext,
    });

    if (error.code === "P2002") {
      return errorResponse(
        "Unique constraint violation",
        409,
        undefined,
        isDevelopment ? buildDevelopmentDebug(error, debugContext) : undefined,
      );
    }

    if (error.code === "P2025") {
      return errorResponse(
        "Record not found",
        404,
        undefined,
        isDevelopment ? buildDevelopmentDebug(error, debugContext) : undefined,
      );
    }
  }

  const debugContext = { ...context, status: 500 };

  debugError({
    scope: context?.route ?? "API",
    error,
    context: debugContext,
  });

  return errorResponse(
    "Internal server error",
    500,
    undefined,
    isDevelopment ? buildDevelopmentDebug(error, debugContext) : undefined,
  );
}

export async function readJsonBody(request: Request) {
  try {
    return await request.json();
  } catch {
    throw new ApiError(
      "Invalid JSON request body",
      400,
      { body: ["Request body must be valid JSON"] },
      "JSON_PARSE_ERROR",
    );
  }
}

function isPrismaKnownRequestError(
  error: unknown,
): error is { code: string; meta?: unknown } {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof (error as { code?: unknown }).code === "string"
  );
}

function getPrismaHttpStatus(code: string) {
  if (code === "P2002") return 409;
  if (code === "P2025") return 404;
  return 500;
}
