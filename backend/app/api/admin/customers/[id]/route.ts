/**
 * GET /api/admin/customers/:id — full customer detail (orders, addresses,
 * wishlist, reviews).
 */
import { NextRequest } from "next/server";
import { asyncHandler } from "@/lib/handler";
import { ok } from "@/lib/responses";
import { checkPermission } from "@/lib/auth/rbac";
import { supabaseAdmin } from "@/lib/supabase/server";
import { NotFoundError } from "@/lib/errors";

type Ctx = { params: Promise<{ id: string }> };

export const GET = asyncHandler(async (_req: NextRequest, ctx: Ctx) => {
  await checkPermission("read");
  const { id } = await ctx.params;
  const { data, error } = await supabaseAdmin()
    .from("customers")
    .select(
      `id, email, first_name, last_name, phone, marketing_opt_in,
       loyalty_points, total_spent_ngn, total_spent_usd, last_order_at,
       created_at, updated_at,
       orders (id, order_number, total, currency, payment_status, fulfillment_status, created_at),
       addresses (id, type, full_name, phone, street, city, state, country, postal_code, is_default),
       wishlist (id, product_id, created_at, product:products(id, name, slug)),
       reviews (id, product_id, rating, title, body, is_approved, created_at, product:products(id, name, slug))`,
    )
    .eq("id", id)
    .single();
  if (error || !data) throw new NotFoundError("Customer not found");
  return ok(data);
});
