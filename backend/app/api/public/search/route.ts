/**
 * GET /api/public/search?q=...&type=products
 * Algolia-backed full-text search. Optional `type` limits to an index.
 *
 * The `q` parameter is capped to 256 characters to bound the index scan.
 */
import { NextRequest } from "next/server";
import { asyncHandler } from "@/lib/handler";
import { ok } from "@/lib/responses";
import { publicAlgolia, ADMIN_INDEX } from "@/lib/algolia";
import { corsHeaders } from "@/lib/cors";
import { enforceRateLimit } from "@/lib/cache/redis";
import { RateLimitError } from "@/lib/errors";

const MAX_Q_LENGTH = 256;

export const GET = asyncHandler(async (req: NextRequest) => {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? req.headers.get("x-real-ip") ?? "anon";
  const { success } = await enforceRateLimit("public", `search:${ip}`);
  if (!success) throw new RateLimitError();

  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim().slice(0, MAX_Q_LENGTH);
  const type = (url.searchParams.get("type") ?? "products").toLowerCase();
  const limit = Math.min(50, Math.max(1, Number(url.searchParams.get("limit") ?? 20)));

  if (q.length === 0) return ok({ hits: [], query: q, nbHits: 0 });

  let indexName: string;
  switch (type) {
    case "collections":
      indexName = ADMIN_INDEX.collections();
      break;
    case "brands":
      indexName = ADMIN_INDEX.brands();
      break;
    case "products":
    default:
      indexName = ADMIN_INDEX.products();
  }

  try {
    const index = publicAlgolia().initIndex(indexName);
    const res = await index.search(q, { hitsPerPage: limit });
    return Response.json(
      { hits: res.hits, query: q, nbHits: res.nbHits, processingTimeMS: res.processingTimeMS },
      { headers: corsHeaders(req.headers.get("origin")) },
    );
  } catch (err) {
    return Response.json(
      { hits: [], query: q, nbHits: 0, error: "Search service unavailable" },
      { status: 200, headers: corsHeaders(req.headers.get("origin")) },
    );
  }
});
