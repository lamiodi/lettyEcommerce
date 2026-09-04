/**
 * POST /api/customer/auth/login
 *
 * Customer login with email and password.
 */
import { NextRequest } from "next/server";
import { asyncHandler } from "@/lib/handler";
import { ok } from "@/lib/responses";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { supabaseAdmin } from "@/lib/supabase/server";
import { signCustomerToken, setCustomerCookie } from "@/lib/auth/customer";
import { corsHeaders } from "@/lib/cors";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Password is required"),
});

export const POST = asyncHandler(async (req: NextRequest) => {
  const origin = req.headers.get("origin");
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return Response.json(
      { error: "Invalid email or password format" },
      { status: 400, headers: corsHeaders(origin) },
    );
  }

  const { email, password } = parsed.data;

  const { data: customer } = await supabaseAdmin()
    .from("customers")
    .select("id, email, password_hash, first_name, last_name, is_active, loyalty_points, store_credit_usd")
    .eq("email", email.toLowerCase())
    .maybeSingle();

  const DUMMY_HASH = "$2a$10$CwTycUXWue0Thq9StjUM0uJ8pP3Wv6Z9YJjA4VTk1t2sGqE7Q3h8a";
  const hashToCompare = customer?.password_hash ?? DUMMY_HASH;
  const ok_ = await bcrypt.compare(password, hashToCompare);

  if (!customer || !customer.password_hash || !customer.is_active || !ok_) {
    return Response.json(
      { error: "Incorrect email or password" },
      { status: 401, headers: corsHeaders(origin) },
    );
  }

  const token = await signCustomerToken({
    id: customer.id,
    email: customer.email,
    firstName: customer.first_name,
    lastName: customer.last_name,
  });

  const cookie = setCustomerCookie(token);
  const res = ok(
    {
      customer: {
        id: customer.id,
        email: customer.email,
        firstName: customer.first_name,
        lastName: customer.last_name,
        loyaltyPoints: customer.loyalty_points,
        storeCreditUsd: customer.store_credit_usd,
      },
    },
    { headers: corsHeaders(origin) },
  );

  res.cookies.set(cookie.name, cookie.value, {
    httpOnly: cookie.httpOnly,
    secure: cookie.secure,
    sameSite: cookie.sameSite,
    path: cookie.path,
    maxAge: cookie.maxAge,
  });

  return res;
});

export const OPTIONS = (req: NextRequest) =>
  new Response(null, { status: 204, headers: corsHeaders(req.headers.get("origin")) });
