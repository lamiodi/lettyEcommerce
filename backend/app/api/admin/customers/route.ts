/**
 * GET /api/admin/customers?cursor=&limit=&query=
 */
import { NextRequest } from "next/server";
import { z } from "zod";
import { asyncHandler } from "@/lib/handler";
import { paginated } from "@/lib/responses";
import { checkPermission } from "@/lib/auth/rbac";
import { supabaseAdmin } from "@/lib/supabase/server";

const querySchema = z.object({
  query: z.string().max(200).optional(),
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

export const GET = asyncHandler(async (req: NextRequest) => {
  await checkPermission("read");
  const params = Object.fromEntries(new URL(req.url).searchParams.entries());
  const parsed = querySchema.safeParse(params);
  if (!parsed.success) {
    return Response.json({ error: "Invalid query" }, { status: 400 });
  }
  const { query, cursor, limit } = parsed.data;

  let q = supabaseAdmin()
    .from("customers")
    .select(
      "id, email, first_name, last_name, phone, loyalty_points, total_spent_ngn, total_spent_usd, last_order_at, created_at",
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .limit(limit);
  if (query) {
    q = q.or(`email.ilike.%${query}%,first_name.ilike.%${query}%,last_name.ilike.%${query}%`);
  }
  if (cursor) q = q.lt("id", cursor);

  const { data, count } = await q;
  return paginated(data ?? [], count ?? 0, 1, limit);
});
