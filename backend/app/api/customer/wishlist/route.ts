/**
 * POST /api/customer/wishlist
 * { email, product_id, action: "add" | "remove" }
 */
import { NextRequest } from "next/server";
import { asyncHandler } from "@/lib/handler";
import { ok } from "@/lib/responses";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/server";
import { enforceRateLimit } from "@/lib/cache/redis";
import { RateLimitError } from "@/lib/errors";
import { corsHeaders } from "@/lib/cors";

const bodySchema = z.object({
  email: z.string().email(),
  product_id: z.string().uuid(),
  action: z.enum(["add", "remove"]),
});

export const POST = asyncHandler(async (req: NextRequest) => {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? req.headers.get("x-real-ip") ?? "anon";
  const { success } = await enforceRateLimit("public", `wishlist:${ip}`);
  if (!success) throw new RateLimitError();

  const body = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400, headers: corsHeaders(req.headers.get("origin")) },
    );
  }
  const { email, product_id, action } = parsed.data;

  const { data: customer } = await supabaseAdmin()
    .from("customers")
    .select("id")
    .eq("email", email)
    .single();
  if (!customer) return Response.json({ error: "Customer not found" }, { status: 404 });

  if (action === "add") {
    await supabaseAdmin()
      .from("wishlists")
      .upsert(
        { customer_id: customer.id, product_id },
        { onConflict: "customer_id,product_id", ignoreDuplicates: true },
      );
  } else {
    await supabaseAdmin()
      .from("wishlists")
      .delete()
      .eq("customer_id", customer.id)
      .eq("product_id", product_id);
  }

  return Response.json({ data: { ok: true } }, { headers: corsHeaders(req.headers.get("origin")) });
});
