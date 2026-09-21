/**
 * POST /api/customer/auth/logout — clears the customer token cookie.
 */
import { NextRequest } from "next/server";
import { asyncHandler } from "@/lib/handler";
import { ok } from "@/lib/responses";
import { clearCustomerCookie } from "@/lib/auth/customer";

export const POST = asyncHandler(async (_req: NextRequest) => {
  const cookie = clearCustomerCookie();
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
