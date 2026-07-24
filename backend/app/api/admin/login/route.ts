/**
 * POST /api/admin/login
 * { email, password } → sets the `admin_token` HTTP-only cookie.
 */
import { NextRequest } from "next/server";
import { asyncHandler } from "@/lib/handler";
import { ok } from "@/lib/responses";
import { adminLoginSchema } from "@/lib/validations";
import { supabaseAdmin } from "@/lib/supabase/server";
import { signAdminToken, setAdminCookie, ADMIN_COOKIE_NAME } from "@/lib/auth/rbac";
import { UnauthorizedError } from "@/lib/errors";
import { enforceRateLimit } from "@/lib/cache/redis";
import { RateLimitError } from "@/lib/errors";
import bcrypt from "bcryptjs";

export const POST = asyncHandler(async (req: NextRequest) => {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? req.headers.get("x-real-ip") ?? "anon";
  const { success } = await enforceRateLimit("auth", `login:${ip}`);
  if (!success) throw new RateLimitError();

  const body = await req.json().catch(() => null);
  const parsed = adminLoginSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid credentials" }, { status: 400 });
  }
  const { email, password } = parsed.data;

  const { data: admin, error } = await supabaseAdmin()
    .from("admins")
    .select("id, email, password_hash, role, is_active")
    .eq("email", email)
    .maybeSingle();

  // Always run bcrypt.compare with a known dummy hash to keep the request
  // timing constant whether the email exists or not. The throwaway hash
  // below is a real bcrypt hash of "decoy" — it never matches the user's
  // password, but it forces the same CPU cost as a real compare.
  const DUMMY_HASH = "$2a$10$CwTycUXWue0Thq9StjUM0uJ8pP3Wv6Z9YJjA4VTk1t2sGqE7Q3h8a";
  const hashToCompare = admin?.password_hash ?? DUMMY_HASH;
  const ok_ = await bcrypt.compare(password, hashToCompare);

  if (error || !admin || !admin.is_active || !ok_) {
    // Single error path for: missing email, inactive admin, wrong password.
    // All return the same generic 401 to avoid leaking which one failed.
    throw new UnauthorizedError();
  }

  const token = await signAdminToken({ id: admin.id, email: admin.email, role: admin.role });

  // Update last_login_at
  await supabaseAdmin()
    .from("admins")
    .update({ last_login_at: new Date().toISOString() })
    .eq("id", admin.id);

  // Audit
  await supabaseAdmin().from("audit_logs").insert({
    admin_id: admin.id,
    action: "LOGIN",
    entity_type: "admin",
    entity_id: admin.id,
    ip_address: ip,
  });

  const cookie = setAdminCookie(token);
  const res = ok({ admin: { id: admin.id, email: admin.email, role: admin.role } });
  res.cookies.set(cookie.name, cookie.value, {
    httpOnly: cookie.httpOnly,
    secure: cookie.secure,
    sameSite: cookie.sameSite,
    path: cookie.path,
    maxAge: cookie.maxAge,
  });
  return res;
});
