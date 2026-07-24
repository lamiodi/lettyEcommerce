/**
 * Edge-compatible RBAC for admin staff.
 *
 * - Uses `jose` (works in Edge runtime where `jsonwebtoken` does not).
 * - Stores the token in an `admin_token` HTTP-only cookie.
 * - `checkPermission()` throws a typed error on unauthorized access.
 */
import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { cookies } from "next/headers";
import { env } from "@/lib/env";
import { ForbiddenError, UnauthorizedError } from "@/lib/errors";

const COOKIE_NAME = "admin_token";
const COOKIE_MAX_AGE = 60 * 60 * 24; // 1 day

export const ADMIN_ROLES = [
  "owner",
  "admin",
  "manager",
  "inventory",
  "support",
  "marketing",
  "editor",
] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

export const PERMISSIONS = [
  "*",
  "read",
  "create",
  "update",
  "delete",
  "update_inventory",
  "update_orders",
  "manage_cms",
  "manage_coupons",
  "update_products",
  "refund_orders",
  "manage_settings",
] as const;
export type Permission = (typeof PERMISSIONS)[number];

const ROLE_PERMISSIONS: Record<AdminRole, Permission[]> = {
  owner: ["*"],
  admin: ["*"],
  manager: ["read", "create", "update"],
  inventory: ["read", "update_inventory"],
  support: ["read", "update_orders", "refund_orders"],
  marketing: ["read", "manage_cms", "manage_coupons"],
  editor: ["read", "manage_cms", "update_products"],
};

function secret(): Uint8Array {
  return new TextEncoder().encode(env().JWT_SECRET_KEY);
}

export interface AdminClaims extends JWTPayload {
  sub: string;
  email: string;
  role: AdminRole;
}

export async function signAdminToken(payload: {
  id: string;
  email: string;
  role: AdminRole;
}): Promise<string> {
  return new SignJWT({ email: payload.email, role: payload.role })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(payload.id)
    .setIssuedAt()
    .setExpirationTime(`${COOKIE_MAX_AGE}s`)
    .setIssuer("letty-backend")
    .sign(secret());
}

export async function verifyAdminToken(token: string): Promise<AdminClaims | null> {
  try {
    const { payload } = await jwtVerify<AdminClaims>(token, secret(), { issuer: "letty-backend" });
    return payload;
  } catch {
    return null;
  }
}

/** Read the admin from cookies, or null. */
export async function getAdmin(): Promise<AdminClaims | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyAdminToken(token);
}

/** Read the admin from cookies, throwing if not present. */
export async function requireAdmin(): Promise<AdminClaims> {
  const admin = await getAdmin();
  if (!admin) throw new UnauthorizedError();
  return admin;
}

export function setAdminCookie(token: string) {
  // The cookie is set on the response from the route handler; the helper exists
  // for documentation. The actual set is done via NextResponse.cookies.
  return {
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: env().NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  };
}

export function clearAdminCookie() {
  return {
    name: COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: env().NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 0,
  };
}

export function hasPermission(role: AdminRole, action: Permission): boolean {
  const allowed = ROLE_PERMISSIONS[role] ?? [];
  return allowed.includes("*") || allowed.includes(action);
}

/** Throws if the current admin lacks the permission. */
export async function checkPermission(action: Permission): Promise<AdminClaims> {
  const admin = await requireAdmin();
  if (!hasPermission(admin.role, action)) {
    throw new ForbiddenError(`Role '${admin.role}' cannot perform '${action}'`);
  }
  return admin;
}

export { COOKIE_NAME as ADMIN_COOKIE_NAME };
