/**
 * Async / sync handler wrappers. Removes repetitive try/catch.
 */
import { NextResponse, type NextRequest } from "next/server";
import { apiError } from "@/lib/errors";
import { logger } from "@/lib/logger";

type Handler<Ctx = unknown> = (req: NextRequest, ctx: Ctx) => Promise<NextResponse>;

export function asyncHandler<Ctx = unknown>(fn: Handler<Ctx>): Handler<Ctx> {
  return async (req, ctx) => {
    try {
      return await fn(req, ctx);
    } catch (err) {
      return apiError(err);
    }
  };
}

/** Wrap a Server Action so failures return a typed result instead of throwing. */
export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string; code?: string };

export async function safeAction<T>(fn: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    const data = await fn();
    return { ok: true, data };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    logger.error({ err, message }, "Server action failed");
    return { ok: false, error: message };
  }
}
