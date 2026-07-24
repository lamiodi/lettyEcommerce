/**
 * Paystack client + helpers.
 * Paystack uses minor units already (kobo for NGN, pesewas for GHS, cents for ZAR/KES).
 */
import crypto from "node:crypto";
import { env } from "@/lib/env";
import { toMinorUnits } from "@/lib/utils/currency";
import { logger } from "@/lib/logger";
import type { Currency } from "@/lib/validations";

const PAYSTACK_BASE = "https://api.paystack.co";

function authHeader(): string {
  const key = env().PAYSTACK_SECRET_KEY;
  if (!key) throw new Error("PAYSTACK_SECRET_KEY is not configured");
  return `Bearer ${key}`;
}

export interface InitializeTransactionInput {
  amount: number; // major units
  currency: Currency;
  email: string;
  orderId: string;
  orderNumber: string;
  callbackUrl?: string;
  metadata?: Record<string, unknown>;
}

export interface InitializeTransactionResult {
  reference: string;
  authorizationUrl: string;
  accessCode: string;
}

export async function initializeTransaction(
  input: InitializeTransactionInput,
): Promise<InitializeTransactionResult> {
  const res = await fetch(`${PAYSTACK_BASE}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: toMinorUnits(input.amount, input.currency),
      currency: input.currency,
      email: input.email,
      reference: input.orderNumber, // Use the order number as the Paystack reference
      callback_url: input.callbackUrl,
      metadata: {
        order_id: input.orderId,
        ...input.metadata,
      },
    }),
  });

  const json = (await res.json()) as {
    status: boolean;
    message: string;
    data?: { reference: string; authorization_url: string; access_code: string };
  };
  if (!res.ok || !json.status || !json.data) {
    logger.error({ status: res.status, body: json }, "Paystack initialize failed");
    throw new Error(`Paystack: ${json.message ?? "initialize failed"}`);
  }
  return {
    reference: json.data.reference,
    authorizationUrl: json.data.authorization_url,
    accessCode: json.data.access_code,
  };
}

export interface VerifyTransactionResult {
  reference: string;
  status: "success" | "failed" | "abandoned" | "pending";
  amount: number;
  currency: Currency;
  paidAt?: string;
  channel?: string;
  gatewayResponse?: string;
}

export async function verifyTransaction(reference: string): Promise<VerifyTransactionResult> {
  const res = await fetch(`${PAYSTACK_BASE}/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: authHeader() },
  });
  const json = (await res.json()) as {
    status: boolean;
    message: string;
    data?: {
      reference: string;
      status: string;
      amount: number;
      currency: string;
      paid_at?: string;
      channel?: string;
      gateway_response?: string;
    };
  };
  if (!res.ok || !json.status || !json.data) {
    throw new Error(`Paystack verify failed: ${json.message ?? res.statusText}`);
  }
  return {
    reference: json.data.reference,
    status: json.data.status as VerifyTransactionResult["status"],
    amount: json.data.amount / 100,
    currency: json.data.currency as Currency,
    paidAt: json.data.paid_at,
    channel: json.data.channel,
    gatewayResponse: json.data.gateway_response,
  };
}

export function verifyPaystackWebhook(rawBody: string, signature: string): boolean {
  const key = env().PAYSTACK_SECRET_KEY;
  if (!key) throw new Error("PAYSTACK_SECRET_KEY is not configured");
  const computed = crypto.createHmac("sha512", key).update(rawBody).digest("hex");
  // constant-time compare
  const a = Buffer.from(computed, "hex");
  const b = Buffer.from(signature, "hex");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/**
 * Refund a Paystack transaction by reference. Paystack expects minor units.
 * Returns the refund reference id. Throws on failure.
 */
export async function refundTransaction(opts: {
  reference: string;       // Paystack transaction reference
  amount: number;          // major units
  currency: Currency;
}): Promise<{ refundId: string }> {
  const res = await fetch(`${PAYSTACK_BASE}/refund`, {
    method: "POST",
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      transaction: opts.reference,
      amount: toMinorUnits(opts.amount, opts.currency),
      currency: opts.currency,
    }),
  });
  const json = (await res.json()) as {
    status: boolean;
    message: string;
    data?: { id: number | string; refund_reference?: string };
  };
  if (!res.ok || !json.status || !json.data) {
    logger.error({ status: res.status, body: json }, "Paystack refund failed");
    throw new Error(`Paystack refund: ${json.message ?? "failed"}`);
  }
  return { refundId: String(json.data.id ?? json.data.refund_reference ?? "") };
}
