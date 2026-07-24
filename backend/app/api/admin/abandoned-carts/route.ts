/**
 * GET /api/admin/abandoned-carts?cursor=&limit=&recovered=
 *
 * Read-only list of abandoned carts. 5.O.1 — manual reminder
 * and recovery are out of scope (LEAVE). The page is for
 * visibility only.
 */
import { NextRequest } from "next/server";
import { z } from "zod";
import { asyncHandler } from "@/lib/handler";
import { paginated } from "@/lib/responses";
import { checkPermission } from "@/lib/auth/rbac";
import { supabaseAdmin } from "@/lib/supabase/server";

const querySchema = z.object({
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  /** When true, only show non-recovered carts. Default true. */
  open: z.coerce.boolean().optional().default(true),
});

export const GET = asyncHandler(async (req: NextRequest) => {
  await checkPermission("read");
  const params = Object.fromEntries(new URL(req.url).searchParams.entries());
  const parsed = querySchema.safeParse(params);
  if (!parsed.success) {
    return Response.json({ error: "Invalid query" }, { status: 400 });
  }
  const { cursor, limit, open } = parsed.data;

  let q = supabaseAdmin()
    .from("abandoned_carts")
    .select(
      "id, customer_email, currency, subtotal, cart, recovery_token, last_reminder_at, reminder_count, recovered_at, created_at, updated_at",
      { count: "exact" },
    )
    .order("updated_at", { ascending: false })
    .limit(limit);
  if (open) q = q.is("recovered_at", null);
  if (cursor) q = q.lt("id", cursor);

  const { data, count } = await q;
  return paginated(data ?? [], count ?? 0, 1, limit);
});
