/**
 * GET   /api/admin/orders?status=&from=&to=&cursor=&limit=
 * Returns a paginated, filterable list of orders.
 */
import { NextRequest } from "next/server";
import { z } from "zod";
import { asyncHandler } from "@/lib/handler";
import { paginated } from "@/lib/responses";
import { checkPermission } from "@/lib/auth/rbac";
import { supabaseAdmin } from "@/lib/supabase/server";

const querySchema = z.object({
  status: z.enum(["pending", "paid", "failed", "refunded", "partially_refunded"]).optional(),
  fulfillment: z
    .enum(["unfulfilled", "partially_fulfilled", "fulfilled", "returned", "cancelled"])
    .optional(),
  // 5.C.1 — additional filters used by the admin list page.
  payment_status: z.enum(["pending", "paid", "failed", "refunded", "partially_refunded"]).optional(),
  fulfillment_status: z
    .enum(["unfulfilled", "partially_fulfilled", "fulfilled", "returned", "cancelled"])
    .optional(),
  currency: z
    .enum(["USD", "EUR", "GBP", "NGN", "GHS", "ZAR", "KES"])
    .optional(),
  payment_gateway: z.enum(["stripe", "paystack"]).optional(),
  query: z.string().min(1).max(200).optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

export const GET = asyncHandler(async (req: NextRequest) => {
  await checkPermission("read");
  const params = Object.fromEntries(new URL(req.url).searchParams.entries());
  const parsed = querySchema.safeParse(params);
  if (!parsed.success) {
    return Response.json({ error: "Invalid query", details: parsed.error.flatten() }, { status: 400 });
  }
  const {
    status,
    fulfillment,
    payment_status,
    fulfillment_status,
    currency,
    payment_gateway,
    query,
    from,
    to,
    cursor,
    limit,
  } = parsed.data;

  let q = supabaseAdmin()
    .from("orders")
    .select(
      "id, order_number, customer_email, currency, total, payment_status, fulfillment_status, payment_gateway, created_at, updated_at",
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(limit);

  // `status` and `fulfillment` are kept for backward compatibility; the
  // admin list page uses the underscored variants.
  const pay = payment_status ?? status;
  const ful = fulfillment_status ?? fulfillment;
  if (pay) q = q.eq("payment_status", pay);
  if (ful) q = q.eq("fulfillment_status", ful);
  if (currency) q = q.eq("currency", currency);
  if (payment_gateway) q = q.eq("payment_gateway", payment_gateway);
  if (query) {
    // Free-text match on order_number OR customer_email.
    // Escape % and _ for ilike.
    const safe = query.replace(/[%_]/g, "\\$&");
    q = q.or(`order_number.ilike.%${safe}%,customer_email.ilike.%${safe}%`);
  }
  if (from) q = q.gte("created_at", from);
  if (to) q = q.lte("created_at", to);
  if (cursor) q = q.lt("id", cursor);

  const { data, count } = await q;
  return paginated(data ?? [], count ?? 0, 1, limit);
});
