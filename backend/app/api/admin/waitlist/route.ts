/**
 * GET /api/admin/waitlist?variant_id=&notified=
 *
 * Read-only list of waitlist signups per variant. 5.P.1.
 * Admin use only — customer-facing waitlist is wired via the
 * storefront's PDP.
 */
import { NextRequest } from "next/server";
import { z } from "zod";
import { asyncHandler } from "@/lib/handler";
import { paginated } from "@/lib/responses";
import { checkPermission } from "@/lib/auth/rbac";
import { supabaseAdmin } from "@/lib/supabase/server";

const querySchema = z.object({
  variant_id: z.string().uuid().optional(),
  notified: z.enum(["true", "false"]).optional(),
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(500).default(200),
});

export const GET = asyncHandler(async (req: NextRequest) => {
  await checkPermission("read");
  const params = Object.fromEntries(new URL(req.url).searchParams.entries());
  const parsed = querySchema.safeParse(params);
  if (!parsed.success) {
    return Response.json({ error: "Invalid query" }, { status: 400 });
  }
  const { variant_id, notified, cursor, limit } = parsed.data;

  let q = supabaseAdmin()
    .from("waitlist")
    .select(
      "id, email, variant_id, notified_at, created_at, variant:product_variants(sku, product:products(name, slug))",
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .limit(limit);
  if (variant_id) q = q.eq("variant_id", variant_id);
  if (notified === "true") q = q.not("notified_at", "is", null);
  if (notified === "false") q = q.is("notified_at", null);
  if (cursor) q = q.lt("id", cursor);

  const { data, count } = await q;
  return paginated(data ?? [], count ?? 0, 1, limit);
});
