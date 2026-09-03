/**
 * CORS helpers for the API surface. The frontend is the only allowed origin.
 *
 * When `Access-Control-Allow-Credentials: true` is set, the spec forbids
 * `Access-Control-Allow-Origin: *`. We either echo the validated origin or
 * — in the rare case the caller sends no Origin — use the first configured
 * frontend origin (never `*`).
 */
import { NextResponse } from "next/server";

export function frontendOrigins(): string[] {
  return (process.env.FRONTEND_ORIGINS ?? "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
}

function pickOrigin(origin: string | null | undefined): string {
  const allowed = frontendOrigins();
  if (origin && allowed.includes(origin)) return origin;
  // No valid origin in the request — return the first configured frontend.
  // This is the documented fallback for the no-Origin server-to-server case.
  return allowed[0] ?? "http://localhost:3000";
}

export function corsHeaders(origin?: string | null): HeadersInit {
  return {
    "Access-Control-Allow-Origin": pickOrigin(origin),
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With, Idempotency-Key",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

export function preflight(req: Request): NextResponse {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(req.headers.get("origin")),
  });
}

export function withCors(res: NextResponse, req: Request): NextResponse {
  const headers = corsHeaders(req.headers.get("origin"));
  for (const [k, v] of Object.entries(headers)) {
    res.headers.set(k, v as string);
  }
  return res;
}
