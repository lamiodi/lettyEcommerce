/**
 * GET /api/admin/reviews?status=pending|approved|all&query=
 */
import { NextRequest } from "next/server";
import { z } from "zod";
import { asyncHandler } from "@/lib/handler";
import { paginated } from "@/lib/responses";
import { checkPermission } from "@/lib/auth/rbac";
import { supabaseAdmin } from "@/lib/supabase/server";

const querySchema = z.object({
  status: z.enum(["pending", "approved", "all"]).default("pending"),
  query: z.string().max(200).optional(),
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

export const GET = asyncHandler(async (req: NextRequest) => {
  await checkPermission("read");
  const params = Object.fromEntries(new URL(req.url).searchParams.entries());
  const parsed = querySchema.safeParse(params);
  if (!parsed.success) return Response.json({ error: "Invalid query" }, { status: 400 });
  const { status, query, cursor, limit } = parsed.data;

  let q = supabaseAdmin()
    .from("reviews")
    .select(
      `id, rating, title, body, is_approved, verified_purchase, created_at,
       product:products (id, name, slug, is_active, deleted_at),
       customer:customers (id, first_name, last_name, email)`,
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (status === "pending") q = q.eq("is_approved", false);
  if (status === "approved") q = q.eq("is_approved", true);
  if (cursor) q = q.lt("id", cursor);
  if (query) {
    const safe = query.replace(/[%_]/g, "\\$&");
    q = q.or(`title.ilike.%${safe}%,body.ilike.%${safe}%`);
  }

  const { data, count } = await q;
  // Filter out reviews of deleted products.
  const rows = (data ?? []).filter((r) => !(r as any).product?.deleted_at);
  return paginated(rows, count ?? 0, 1, limit);
});
