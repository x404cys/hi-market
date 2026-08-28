import "server-only";

import { ZodError, type ZodIssue } from "zod";

export const isDevelopment = process.env.NODE_ENV !== "production";

const redactedValue = "[REDACTED]";
const maxStringLength = 1200;
const maxArrayLength = 50;
const sensitiveKeyPattern =
  /password|secret|token|authorization|cookie|database_url|r2_secret_access_key|r2_access_key_id|accesskey|connectionstring/i;

export type DebugContext = {
  route?: string;
  method?: string;
  status?: number;
  debugId?: string;
  lastStage?: string;
  payload?: unknown;
  context?: unknown;
};

export type DevelopmentDebug = {
  debugId?: string;
  route?: string;
  method?: string;
  status?: number;
  timestamp: string;
  type: string;
  category: string;
  message: string;
  lastStage?: string;
  phase?: "START" | "ACTIVE_TRANSACTION" | "UNKNOWN";
  issues?: DebugZodIssue[];
  flattened?: unknown;
  code?: string;
  meta?: unknown;
  stack?: string;
  payload?: unknown;
  context?: unknown;
};

export type DebugZodIssue = {
  path: string;
  code: string;
  message: string;
};

export type DebugTracker = {
  readonly lastStage: string | undefined;
  stage(stage: string, context?: unknown): void;
  fail(stage: string, error: unknown, context?: unknown): void;
};

export function createDebugId() {
  return `REQ-${crypto.randomUUID().slice(0, 8)}`;
}

export function createDebugTracker(scope: string, debugId: string): DebugTracker {
  let lastStage: string | undefined;

  return {
    get lastStage() {
      return lastStage;
    },
    stage(stage, context) {
      lastStage = stage;
      debugLog(scope, stage, { debugId, ...asObject(context) });
    },
    fail(stage, error, context) {
      lastStage = stage;
      debugError({
        scope,
        error,
        context: {
          debugId,
          lastStage,
          ...asObject(context),
        },
      });
    },
  };
}

export function debugLog(scope: string, label: string, context?: unknown) {
  if (!isDevelopment) return;

  console.log("----------------------------------------");
  console.log(scope);
  console.log(label);
  if (context !== undefined) {
    console.dir(sanitizeForDebug(context), { depth: null });
  }
  console.log("----------------------------------------");
}

export function debugError({
  scope,
  error,
  context,
}: {
  scope: string;
  error: unknown;
  context?: unknown;
}) {
  if (!isDevelopment) return;

  const safeContext = asObject(context);
  const debug = buildDevelopmentDebug(error, {
    route: scope,
    method: typeof safeContext.method === "string" ? safeContext.method : undefined,
    status: typeof safeContext.status === "number" ? safeContext.status : undefined,
    debugId: typeof safeContext.debugId === "string" ? safeContext.debugId : undefined,
    lastStage:
      typeof safeContext.lastStage === "string" ? safeContext.lastStage : undefined,
    payload: "payload" in safeContext ? safeContext.payload : undefined,
    context,
  });

  console.error("========================================");
  console.error("[API ERROR]");
  console.error(`Route: ${scope}`);
  console.error(`Time: ${debug.timestamp}`);
  if (debug.debugId) console.error(`Debug ID: ${debug.debugId}`);
  if (debug.lastStage) console.error(`Last stage: ${debug.lastStage}`);
  console.error(`Type: ${debug.type}`);
  console.error(`Category: ${debug.category}`);
  if (debug.phase) console.error(`Phase: ${debug.phase}`);
  if (debug.code) console.error(`Code: ${debug.code}`);
  console.error(`Message: ${debug.message}`);

  if (debug.issues) {
    console.error("Issues:");
    console.dir(debug.issues, { depth: null });
  }

  if (debug.meta) {
    console.error("Safe metadata:");
    console.dir(debug.meta, { depth: null });
  }

  if (debug.payload) {
    console.error("Payload:");
    console.dir(debug.payload, { depth: null });
  }

  if (debug.context) {
    console.error("Context:");
    console.dir(debug.context, { depth: null });
  }

  if (error instanceof Error) {
    console.error("Stack:");
    console.error(error.stack);
  }

  console.error("========================================");
}

export function buildDevelopmentDebug(
  error: unknown,
  context: DebugContext = {},
): DevelopmentDebug {
  const timestamp = new Date().toISOString();
  const base = {
    debugId: context.debugId,
    route: context.route,
    method: context.method,
    status: context.status,
    timestamp,
    lastStage: context.lastStage,
    payload: sanitizeForDebug(context.payload),
    context: sanitizeForDebug(context.context),
  };

  if (error instanceof ZodError) {
    return {
      ...base,
      type: "ZOD_VALIDATION_ERROR",
      category: "VALIDATION_ERROR",
      message: "Validation failed",
      issues: zodIssuesToDebugIssues(error.issues),
      flattened: sanitizeForDebug(error.flatten()),
      stack: sanitizeStack(error.stack),
    };
  }

  if (isApiErrorLike(error)) {
    return {
      ...base,
      type: error.code ?? "BUSINESS_RULE_ERROR",
      category: error.code ?? "BUSINESS_RULE_ERROR",
      message: error.message,
      code: error.code,
      meta: sanitizeForDebug(error.details),
      stack: sanitizeStack(error.stack),
    };
  }

  if (isPrismaKnownRequestError(error)) {
    if (error.code === "P2028") {
      return {
        ...base,
        type: "PRISMA_TRANSACTION_ERROR",
        category: "PRISMA_TRANSACTION_ERROR",
        phase: getPrismaTransactionPhase(error.message, context.lastStage),
        message: sanitizeMessage(error.message),
        code: error.code,
        meta: sanitizeForDebug(error.meta),
        stack: sanitizeStack(error.stack),
      };
    }

    return {
      ...base,
      type: "PRISMA_KNOWN_ERROR",
      category: getPrismaCategory(error.code),
      message: sanitizeMessage(error.message),
      code: error.code,
      meta: sanitizeForDebug(error.meta),
      stack: sanitizeStack(error.stack),
    };
  }

  if (isDatabaseConnectionError(error)) {
    return {
      ...base,
      type: "DATABASE_CONNECTION_ERROR",
      category: "DATABASE_CONNECTION_ERROR",
      message: error instanceof Error ? sanitizeMessage(error.message) : "Database connection failed",
      stack: error instanceof Error ? sanitizeStack(error.stack) : undefined,
    };
  }

  return {
    ...base,
    type: "UNKNOWN_SERVER_ERROR",
    category: "UNKNOWN_SERVER_ERROR",
    message: error instanceof Error ? sanitizeMessage(error.message) : "Unknown server error",
    stack: error instanceof Error ? sanitizeStack(error.stack) : undefined,
  };
}

export function zodIssuesToFieldErrors(issues: ZodIssue[]) {
  return issues.reduce<Record<string, string[]>>((errors, issue) => {
    const path = zodPathToString(issue.path);
    const key = path || "form";
    errors[key] = [...(errors[key] ?? []), issue.message];
    return errors;
  }, {});
}

export function zodIssuesToDebugIssues(issues: ZodIssue[]): DebugZodIssue[] {
  return issues.map((issue) => ({
    path: zodPathToString(issue.path),
    code: issue.code,
    message: issue.message,
  }));
}

export function zodPathToString(path: PropertyKey[]) {
  return path.map(String).join(".");
}

export function sanitizeForDebug(value: unknown, seen = new WeakSet<object>()): unknown {
  if (value === null || value === undefined) return value;

  if (typeof value === "string") return sanitizeMessage(value);
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (typeof value === "bigint") return value.toString();
  if (value instanceof Date) return value.toISOString();

  if (Array.isArray(value)) {
    return value
      .slice(0, maxArrayLength)
      .map((item) => sanitizeForDebug(item, seen));
  }

  if (typeof value === "object") {
    if (seen.has(value)) return "[Circular]";
    seen.add(value);

    if ("toString" in value && value.constructor?.name === "Decimal") {
      return String(value);
    }

    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entry]) => [
        key,
        sensitiveKeyPattern.test(key)
          ? redactedValue
          : sanitizeForDebug(entry, seen),
      ]),
    );
  }

  return String(value);
}

function sanitizeMessage(value: string | undefined) {
  if (!value) return "";

  const withoutConnectionStrings = value
    .replace(/postgres(?:ql)?:\/\/[^\s'"]+/gi, redactedValue)
    .replace(/https:\/\/[^\s'"]*cloudflarestorage\.com[^\s'"]*/gi, "[R2_URL_REDACTED]");

  return withoutConnectionStrings.length > maxStringLength
    ? `${withoutConnectionStrings.slice(0, maxStringLength)}...`
    : withoutConnectionStrings;
}

function sanitizeStack(value: string | undefined) {
  return value ? sanitizeMessage(value) : undefined;
}

function asObject(value: unknown) {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : value === undefined
      ? {}
      : { value };
}

function isApiErrorLike(
  error: unknown,
): error is Error & { status?: number; details?: unknown; code?: string } {
  return error instanceof Error && error.name === "ApiError";
}

function isPrismaKnownRequestError(
  error: unknown,
): error is Error & { code: string; meta?: unknown } {
  return (
    error instanceof Error &&
    "code" in error &&
    typeof (error as { code?: unknown }).code === "string"
  );
}

function isDatabaseConnectionError(error: unknown) {
  if (!(error instanceof Error)) return false;

  const errorWithCode = error as Error & { code?: string };
  return (
    errorWithCode.code === "ECONNREFUSED" ||
    error.message.includes("ECONNREFUSED") ||
    error.message.includes("Can't reach database server") ||
    error.message.includes("Connection terminated")
  );
}

function getPrismaCategory(code: string) {
  const categories: Record<string, string> = {
    P1001: "DATABASE_CONNECTION_ERROR",
    P1017: "DATABASE_CONNECTION_ERROR",
    P2002: "UNIQUE_CONSTRAINT_ERROR",
    P2003: "FOREIGN_KEY_ERROR",
    P2025: "RECORD_NOT_FOUND",
    P2028: "PRISMA_TRANSACTION_ERROR",
  };

  return categories[code] ?? "PRISMA_QUERY_ERROR";
}

function getPrismaTransactionPhase(
  message: string,
  lastStage: string | undefined,
): "START" | "ACTIVE_TRANSACTION" | "UNKNOWN" {
  if (message.includes("Unable to start a transaction")) return "START";

  if (
    message.includes("expired transaction") ||
    message.includes("timeout for this transaction")
  ) {
    return "ACTIVE_TRANSACTION";
  }

  if (lastStage?.includes("[ORDER 10] Waiting for Prisma transaction")) {
    return "START";
  }

  if (lastStage?.includes("[ORDER 10.1] Prisma transaction started")) {
    return "ACTIVE_TRANSACTION";
  }

  return "UNKNOWN";
}
