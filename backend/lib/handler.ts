/**
 * Async / sync handler wrappers. Removes repetitive try/catch.
 */
import { NextResponse, type NextRequest } from "next/server";
import { apiError, AppError } from "@/lib/errors";
import { logger } from "@/lib/logger";

type Handler<Ctx = unknown> = (
  req: NextRequest,
  ctx: Ctx,
) => Promise<Response | NextResponse> | Response | NextResponse;

export function asyncHandler<Ctx = unknown>(fn: Handler<Ctx>): (req: NextRequest, ctx: Ctx) => Promise<Response> {
  return async (req, ctx) => {
    try {
      return await fn(req, ctx);
    } catch (err) {
      return apiError(err);
    }
  };
}

/** Wrap a Server Action so failures return a typed result instead of throwing. */
export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; code?: string; status?: number };

export async function safeAction<T>(fn: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    const data = await fn();
    return { ok: true, data };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    logger.error({ err, message }, "Server action failed");
    return {
      ok: false,
      error: message,
      // Propagate typed error info so REST wrappers can answer with a real
      // HTTP status instead of a 200 that contains a failure.
      ...(err instanceof AppError ? { code: err.code, status: err.status } : {}),
    };
  }
}
