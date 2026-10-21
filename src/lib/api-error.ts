import { ZodError } from "zod";

/**
 * Format error standar (PRD §11):
 * { "error": { "code": "...", "message": "...", "field": "..." } }
 */

export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "PLAN_CAT_LIMIT"
  | "CAT_FROZEN"
  | "TRANSFER_NOT_ALLOWED"
  | "TOO_MANY_REQUESTS"
  | "INTERNAL_ERROR";

const DEFAULT_STATUS: Record<ApiErrorCode, number> = {
  VALIDATION_ERROR: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  PLAN_CAT_LIMIT: 403,
  CAT_FROZEN: 403,
  TRANSFER_NOT_ALLOWED: 409,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_ERROR: 500,
};

export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly status: number;
  readonly field?: string;

  constructor(
    code: ApiErrorCode,
    message: string,
    options?: { status?: number; field?: string },
  ) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = options?.status ?? DEFAULT_STATUS[code];
    this.field = options?.field;
  }
}

export function errorResponse(
  code: ApiErrorCode,
  message: string,
  options?: { status?: number; field?: string },
) {
  const status = options?.status ?? DEFAULT_STATUS[code];
  return Response.json(
    { error: { code, message, ...(options?.field ? { field: options.field } : {}) } },
    { status },
  );
}

/** Ubah error apa pun menjadi response standar. */
export function handleRouteError(error: unknown) {
  if (error instanceof ApiError) {
    return errorResponse(error.code, error.message, {
      status: error.status,
      field: error.field,
    });
  }

  if (error instanceof ZodError) {
    const issue = error.issues[0];
    return errorResponse("VALIDATION_ERROR", issue?.message ?? "Data tidak valid.", {
      field: issue?.path.join(".") || undefined,
    });
  }

  console.error("[api] unhandled error:", error);
  return errorResponse("INTERNAL_ERROR", "Terjadi kesalahan pada server.");
}
