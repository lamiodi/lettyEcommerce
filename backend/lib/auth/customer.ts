/**
 * Edge-compatible JWT authentication for customers.
 * Uses `jose` and HTTP-only cookie `customer_token`.
 */
import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { cookies } from "next/headers";

export const CUSTOMER_COOKIE_NAME = "customer_token";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function secret(): Uint8Array {
  const key = process.env.JWT_SECRET_KEY || "letty-luxury-customer-auth-secret-key-2026";
  return new TextEncoder().encode(key);
}

export interface CustomerClaims extends JWTPayload {
  sub: string;
  email: string;
  firstName?: string;
  lastName?: string;
}

export async function signCustomerToken(customer: {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
}): Promise<string> {
  return new SignJWT({
    email: customer.email,
    firstName: customer.firstName,
    lastName: customer.lastName,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(customer.id)
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret());
}

export async function verifyCustomerToken(token: string): Promise<CustomerClaims | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload as CustomerClaims;
  } catch {
    return null;
  }
}

export function setCustomerCookie(token: string) {
  const isProd = process.env.NODE_ENV === "production";
  return {
    name: CUSTOMER_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: isProd,
    sameSite: (isProd ? "none" : "lax") as "none" | "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  };
}

export function clearCustomerCookie() {
  return {
    name: CUSTOMER_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 0,
  };
}

export async function getAuthenticatedCustomer(): Promise<CustomerClaims | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(CUSTOMER_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyCustomerToken(token);
}
