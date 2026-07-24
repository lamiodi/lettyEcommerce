/**
 * Stripe client + helpers.
 * Lazy-initialised; throws a clear error if STRIPE_SECRET_KEY is missing.
 */
import Stripe from "stripe";
import { env } from "@/lib/env";
import { toMinorUnits } from "@/lib/utils/currency";
import type { Currency } from "@/lib/validations";

let _stripe: Stripe | null = null;
export function stripe(): Stripe {
  if (_stripe) return _stripe;
  const cfg = env();
  if (!cfg.STRIPE_SECRET_KEY) throw new Error("STRIPE_SECRET_KEY is not configured");
  _stripe = new Stripe(cfg.STRIPE_SECRET_KEY, {
    // Pin the API version to make upgrades explicit and tested.
    apiVersion: "2024-12-18.acacia" as Stripe.LatestApiVersion,
    typescript: true,
    appInfo: { name: "letty-backend", version: "1.0.0" },
    maxNetworkRetries: 2,
    timeout: 20_000,
  });
  return _stripe;
}

export interface CreatePaymentIntentInput {
  amount: number; // major units
  currency: Currency;
  orderId: string;
  orderNumber: string;
  customerEmail: string;
  metadata?: Record<string, string>;
}

export interface CreatePaymentIntentResult {
  paymentIntentId: string;
  clientSecret: string;
  reference: string;
}

export async function createPaymentIntent(
  input: CreatePaymentIntentInput,
): Promise<CreatePaymentIntentResult> {
  const intent = await stripe().paymentIntents.create({
    amount: toMinorUnits(input.amount, input.currency),
    currency: input.currency.toLowerCase(),
    receipt_email: input.customerEmail,
    automatic_payment_methods: { enabled: true },
    metadata: {
      order_id: input.orderId,
      order_number: input.orderNumber,
      ...input.metadata,
    },
  });

  if (!intent.client_secret) {
    throw new Error("Stripe did not return a client_secret");
  }

  return {
    paymentIntentId: intent.id,
    clientSecret: intent.client_secret,
    reference: intent.id,
  };
}

export function verifyStripeWebhook(rawBody: string, signature: string): Stripe.Event {
  const cfg = env();
  if (!cfg.STRIPE_WEBHOOK_SECRET) throw new Error("STRIPE_WEBHOOK_SECRET is not configured");
  return stripe().webhooks.constructEvent(rawBody, signature, cfg.STRIPE_WEBHOOK_SECRET);
}

/**
 * Refund a Stripe PaymentIntent, fully or partially.
 * `amount` is in major units; converted to minor units using the order's currency.
 * Returns the gateway refund id. Throws on failure (caller should revert the
 * local refund state).
 */
export async function refundPaymentIntent(opts: {
  paymentIntentId: string;
  amount: number; // major units
  currency: Currency;
  reason?: string;
}): Promise<{ refundId: string }> {
  const refund = await stripe().refunds.create({
    payment_intent: opts.paymentIntentId,
    amount: toMinorUnits(opts.amount, opts.currency),
    reason: "requested_by_customer",
    metadata: opts.reason ? { reason: opts.reason } : undefined,
  });
  return { refundId: refund.id };
}
