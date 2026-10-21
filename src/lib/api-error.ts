import { ZodError, type ZodType } from "zod";

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

function isPrerenderBailout(error: unknown): boolean {
  if (typeof error !== "object" || error === null || !("digest" in error)) {
    return false;
  }

  const digest = (error as { digest?: unknown }).digest;

  return (
    digest === "HANGING_PROMISE_REJECTION" ||
    digest === "NEXT_PRERENDER_INTERRUPTED" ||
    digest === "DYNAMIC_SERVER_USAGE"
  );
}

/** Ubah error apa pun menjadi response standar. */
export function handleRouteError(error: unknown) {
  // Saat build, Next memakai error khusus untuk membatalkan prerender.
  // Jangan ditelan sebagai 500 — teruskan agar route tetap dinamis.
  if (isPrerenderBailout(error)) {
    throw error;
  }

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

/**
 * Baca + validasi body JSON dengan Zod.
 * Melempar ApiError VALIDATION_ERROR dengan `field` terkait.
 */
export async function parseBody<T>(request: Request, schema: ZodType<T>): Promise<T> {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    throw new ApiError("VALIDATION_ERROR", "Body JSON tidak valid.");
  }

  const result = schema.safeParse(payload);

  if (!result.success) {
    const issue = result.error.issues[0];
    throw new ApiError("VALIDATION_ERROR", issue?.message ?? "Data tidak valid.", {
      field: issue?.path.join(".") || undefined,
    });
  }

  return result.data;
}
