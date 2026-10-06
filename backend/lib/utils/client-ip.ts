import type { NextRequest } from "next/server";

/**
 * Best-effort client IP for rate limiting and audit trails.
 *
 * Proxies APPEND to x-forwarded-for, so the LAST entry is the one added by
 * our own edge (Render). Earlier entries are client-controlled — trusting
 * the leftmost value let an attacker rotate fake IPs and defeat every
 * rate limit in the app.
 */
export function clientIp(req: NextRequest): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const entries = xff
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const last = entries[entries.length - 1];
    if (last) return last;
  }
  return req.headers.get("x-real-ip") ?? "anon";
}
