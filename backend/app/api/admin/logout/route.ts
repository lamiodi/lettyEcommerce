/**
 * POST /api/admin/logout — clears the admin token cookie.
 */
import { NextRequest } from "next/server";
import { asyncHandler } from "@/lib/handler";
import { ok } from "@/lib/responses";
import { clearAdminCookie, ADMIN_COOKIE_NAME } from "@/lib/auth/rbac";

export const POST = asyncHandler(async (_req: NextRequest) => {
  const cookie = clearAdminCookie();
  const res = ok({ logged_out: true });
  res.cookies.set(cookie.name, cookie.value, {
    httpOnly: cookie.httpOnly,
    secure: cookie.secure,
    sameSite: cookie.sameSite,
    path: cookie.path,
    maxAge: cookie.maxAge,
  });
  return res;
});
