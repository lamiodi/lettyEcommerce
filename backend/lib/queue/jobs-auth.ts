/**
 * Authentication for background job endpoints (/api/jobs/*).
 *
 * Two ways to authorize a job call, either is sufficient:
 *  1. `x-jobs-secret` header equal to JOBS_SECRET_KEY — for external
 *     schedulers (Render cron, cron-job.org, GitHub Actions, curl).
 *  2. A valid admin session cookie — so the admin console can trigger
 *     jobs manually with the operator's own credentials.
 *
 * In production at least one is required. In development calls are allowed
 * without a configured secret so local flows work out of the box.
 */
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const encoder = new TextEncoder();

export async function isAuthorizedJobCall(req: NextRequest): Promise<boolean> {
  const secret = process.env.JOBS_SECRET_KEY;
  if (secret && req.headers.get("x-jobs-secret") === secret) {
    return true;
  }

  const token = req.cookies.get("admin_token")?.value;
  if (token) {
    try {
      await jwtVerify(token, encoder.encode(process.env.JWT_SECRET_KEY || ""), {
        issuer: "letty-backend",
      });
      return true;
    } catch {
      // fall through
    }
  }

  // No secret configured (dev) — allow. With a secret configured, reject.
  return !secret && process.env.NODE_ENV !== "production";
}
