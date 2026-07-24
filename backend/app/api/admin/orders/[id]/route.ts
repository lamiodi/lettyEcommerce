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
    .from("orders")
    .select(
      `*,
        customers (id, email, first_name, last_name, phone),
        shipping_address:shipping_address_id (*),
        billing_address:billing_address_id (*),
        order_items (*),
        order_events (id, event_type, metadata, created_at)`,
    )
    .eq("id", id)
    .single();
  if (error || !data) throw new NotFoundError("Order not found");
  return ok(data);
});
