/**
 * POST /api/jobs/database-keepalive
 *
 * Daily liveness query for the primary database. The query is deliberately
 * read-only and returns aggregate metadata only; no product or customer rows
 * are exposed to the scheduler.
 */
import { NextRequest } from "next/server";
import { asyncHandler } from "@/lib/handler";
import { logger } from "@/lib/logger";
import { isAuthorizedJobCall } from "@/lib/queue/jobs-auth";
import { supabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const POST = asyncHandler(async (req: NextRequest) => {
  if (!(await isAuthorizedJobCall(req))) {
    return new Response("Unauthorized", { status: 401 });
  }

  const startedAt = Date.now();
  const { count, error } = await supabaseAdmin()
    .from("products")
    .select("id", { count: "exact", head: true });

  if (error) {
    logger.error({ error }, "database-keepalive: database query failed");
    return Response.json(
      {
        ok: false,
        database: "unreachable",
        checkedAt: new Date().toISOString(),
      },
      { status: 503 },
    );
  }

  const durationMs = Date.now() - startedAt;
  logger.info({ productCount: count ?? 0, durationMs }, "database-keepalive: query succeeded");

  return Response.json({
    ok: true,
    database: "reachable",
    productCount: count ?? 0,
    checkedAt: new Date().toISOString(),
    durationMs,
  });
});
