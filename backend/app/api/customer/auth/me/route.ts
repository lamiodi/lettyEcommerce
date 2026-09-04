/**
 * GET /api/customer/auth/me
 * POST /api/customer/auth/logout
 */
import { NextRequest } from "next/server";
import { asyncHandler } from "@/lib/handler";
import { ok } from "@/lib/responses";
import { getAuthenticatedCustomer, clearCustomerCookie } from "@/lib/auth/customer";
import { supabaseAdmin } from "@/lib/supabase/server";
import { corsHeaders } from "@/lib/cors";

export const GET = asyncHandler(async (req: NextRequest) => {
  const origin = req.headers.get("origin");
  const claims = await getAuthenticatedCustomer();

  if (!claims) {
    return Response.json({ customer: null }, { headers: corsHeaders(origin) });
  }

  const { data: customer } = await supabaseAdmin()
    .from("customers")
    .select("id, email, first_name, last_name, phone, loyalty_points, store_credit_usd")
    .eq("id", claims.sub)
    .maybeSingle();

  if (!customer) {
    return Response.json({ customer: null }, { headers: corsHeaders(origin) });
  }

  return ok(
    {
      customer: {
        id: customer.id,
        email: customer.email,
        firstName: customer.first_name,
        lastName: customer.last_name,
        phone: customer.phone,
        loyaltyPoints: customer.loyalty_points,
        storeCreditUsd: customer.store_credit_usd,
      },
    },
    { headers: corsHeaders(origin) },
  );
});

export const POST = asyncHandler(async (req: NextRequest) => {
  const origin = req.headers.get("origin");
  const cookie = clearCustomerCookie();
  const res = ok({ success: true }, { headers: corsHeaders(origin) });
  res.cookies.set(cookie.name, cookie.value, {
    httpOnly: cookie.httpOnly,
    secure: cookie.secure,
    sameSite: cookie.sameSite,
    path: cookie.path,
    maxAge: 0,
  });
  return res;
});

export const OPTIONS = (req: NextRequest) =>
  new Response(null, { status: 204, headers: corsHeaders(req.headers.get("origin")) });
