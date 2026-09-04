/**
 * POST /api/customer/auth/register
 *
 * Register a customer account with email and password.
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
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().min(1).optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  marketingConsent: z.boolean().optional().default(false),
});

export const POST = asyncHandler(async (req: NextRequest) => {
  const origin = req.headers.get("origin");
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return Response.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400, headers: corsHeaders(origin) },
    );
  }

  const { email, password, firstName, lastName, phone, marketingConsent } = parsed.data;

  // Check if customer already exists
  const { data: existing } = await supabaseAdmin()
    .from("customers")
    .select("id, email, password_hash")
    .eq("email", email.toLowerCase())
    .maybeSingle();

  if (existing && existing.password_hash) {
    return Response.json(
      { error: "An account with this email already exists. Please sign in." },
      { status: 409, headers: corsHeaders(origin) },
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);

  let customerId = existing?.id;
  if (existing) {
    // If guest existed without password, update them
    await supabaseAdmin()
      .from("customers")
      .update({
        password_hash: passwordHash,
        first_name: firstName ?? existing.first_name,
        last_name: lastName ?? existing.last_name,
        phone: phone ?? existing.phone,
        marketing_consent: marketingConsent,
        is_active: true,
      })
      .eq("id", existing.id);
  } else {
    // Create new customer
    const { data: created, error } = await supabaseAdmin()
      .from("customers")
      .insert({
        email: email.toLowerCase(),
        password_hash: passwordHash,
        first_name: firstName ?? null,
        last_name: lastName ?? null,
        phone: phone ?? null,
        marketing_consent: marketingConsent,
        is_active: true,
      })
      .select("id")
      .single();

    if (error || !created) {
      return Response.json(
        { error: "Could not create account" },
        { status: 500, headers: corsHeaders(origin) },
      );
    }
    customerId = created.id;
  }

  const token = await signCustomerToken({
    id: customerId!,
    email,
    firstName,
    lastName,
  });

  const cookie = setCustomerCookie(token);
  const res = ok(
    {
      customer: {
        id: customerId,
        email,
        firstName,
        lastName,
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
