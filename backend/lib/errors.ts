/**
 * Typed application errors. Each variant maps to an HTTP status.
 * Use `apiError()` in route handlers to produce uniform JSON responses.
 */
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { logger } from "@/lib/logger";

export class AppError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(message: string, status = 500, code = "internal_error", details?: unknown) {
    super(message);
    this.name = "AppError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export class ValidationError extends AppError {
  constructor(details: unknown) {
    super("Validation failed", 400, "validation_error", details);
    this.name = "ValidationError";
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized") {
    super(message, 401, "unauthorized");
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden") {
    super(message, 403, "forbidden");
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Not found") {
    super(message, 404, "not_found");
    this.name = "NotFoundError";
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, "conflict");
    this.name = "ConflictError";
  }
}

export class RateLimitError extends AppError {
  constructor(message = "Too many requests") {
    super(message, 429, "rate_limited");
    this.name = "RateLimitError";
  }
}

/**
 * Convert any thrown value into a safe HTTP response.
 * Never leaks stack traces to the client in production.
 */
export function apiError(err: unknown): NextResponse {
  if (err instanceof ZodError) {
    return NextResponse.json(
      { error: "Validation failed", code: "validation_error", details: err.flatten() },
      { status: 400 },
    );
  }

  if (err instanceof AppError) {
    return NextResponse.json(
      {
        error: err.message,
        code: err.code,
        ...(err.details !== undefined ? { details: err.details } : {}),
      },
      { status: err.status },
    );
  }

  const message = err instanceof Error ? err.message : "Internal server error";
  logger.error({ err, message }, "Unhandled error in route handler");
  return NextResponse.json(
    { error: "Internal server error", code: "internal_error" },
    { status: 500 },
  );
}
