/**
 * Edge middleware for the backend service.
 *
 * - Preflight (OPTIONS) returns 204 with CORS headers.
 * - Public API routes pass through; per-route handlers enforce their own auth.
 * - Admin API routes require a valid `admin_token` JWT in the cookie.
 * - The login endpoint and all checkout endpoints are rate-limited via
 *   Upstash at the edge (cheap reject before the route handler runs).
 *
 * Heavy per-route validation happens in the route handlers themselves.
 * Middleware is a coarse gate — it is intentionally cheap.
 */
import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { env, frontendOrigins } from "@/lib/env";
import { enforceRateLimit } from "@/lib/cache/redis";

const encodedSecret = new TextEncoder().encode(env().JWT_SECRET_KEY);

const ADMIN_PREFIX = "/api/admin";
const ADMIN_LOGIN = "/api/admin/login";
const CHECKOUT_PREFIX = "/api/checkout";

function corsHeadersFor(req: NextRequest): HeadersInit {
  const origin = req.headers.get("origin");
  const allowed = frontendOrigins();
  // Never `*` here — credentials are allowed, which the spec forbids with `*`.
  const allowOrigin =
    origin && allowed.includes(origin) ? origin : allowed[0] ?? "http://localhost:3000";
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With, Idempotency-Key",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

function clientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "anon"
  );
}

export async function middleware(req: NextRequest) {
  // Preflight
  if (req.method === "OPTIONS") {
    return new NextResponse(null, { status: 204, headers: corsHeadersFor(req) });
  }

  const { pathname } = req.nextUrl;

  // M4: Edge-level rate limit on the most sensitive paths. The login route
  // also has an in-handler limit — the edge limit just rejects obvious
  // bursts before they reach the Node runtime.
  if (pathname === ADMIN_LOGIN) {
    const { success } = await enforceRateLimit("auth", `login:${clientIp(req)}`);
    if (!success) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429, headers: corsHeadersFor(req) },
      );
    }
  }
  if (pathname.startsWith(CHECKOUT_PREFIX)) {
    const { success } = await enforceRateLimit("checkout", `checkout:${clientIp(req)}`);
    if (!success) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429, headers: corsHeadersFor(req) },
      );
    }
  }

  // --- Admin protection ---
  if (pathname.startsWith(ADMIN_PREFIX) && pathname !== ADMIN_LOGIN) {
    const token = req.cookies.get("admin_token")?.value;
    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers: corsHeadersFor(req) },
      );
    }
    try {
      await jwtVerify(token, encodedSecret, { issuer: "letty-backend" });
    } catch {
      return NextResponse.json(
        { error: "Invalid session" },
        { status: 401, headers: corsHeadersFor(req) },
      );
    }
  }

  // Pass through; downstream route handlers do the real work.
  const res = NextResponse.next();
  for (const [k, v] of Object.entries(corsHeadersFor(req))) {
    res.headers.set(k, v as string);
  }
  return res;
}

export const config = {
  matcher: [
    // Run on all API routes; cheap enough.
    "/api/:path*",
  ],
};
