import { NextResponse } from "next/server";

/**
 * Standardized API error responses for the MizoramStay platform.
 * All route handlers should return errors through these helpers so the
 * client can rely on a consistent shape:
 *
 *   { error: { code, message, details? } }
 */

export type ApiErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "INTERNAL_ERROR";

export type ApiErrorBody = {
  error: {
    code: ApiErrorCode;
    message: string;
    details?: unknown;
  };
};

export function apiError(
  code: ApiErrorCode,
  message: string,
  details?: unknown,
  status?: number
): NextResponse<ApiErrorBody> {
  const statusMap: Record<ApiErrorCode, number> = {
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    VALIDATION_ERROR: 400,
    CONFLICT: 409,
    RATE_LIMITED: 429,
    INTERNAL_ERROR: 500,
  };

  return NextResponse.json(
    { error: { code, message, ...(details !== undefined ? { details } : {}) } },
    { status: status ?? statusMap[code] }
  );
}

export function unauthorized(message = "Authentication required") {
  return apiError("UNAUTHORIZED", message);
}

export function forbidden(message = "You don't have permission to do that") {
  return apiError("FORBIDDEN", message);
}

export function notFound(message = "Resource not found") {
  return apiError("NOT_FOUND", message);
}

export function validationError(message: string, details?: unknown) {
  return apiError("VALIDATION_ERROR", message, details);
}

export function conflict(message: string) {
  return apiError("CONFLICT", message);
}

export function internalError(message = "Something went wrong") {
  return apiError("INTERNAL_ERROR", message);
}

/**
 * Wrap a route handler body so unexpected errors become a consistent
 * 500 response instead of leaking stack traces.
 */
export function handleApiError(error: unknown): NextResponse<ApiErrorBody> {
  console.error("API error:", error);
  return internalError();
}