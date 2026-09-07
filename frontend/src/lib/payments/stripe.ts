/**
 * Stripe Payment Service for LETTY Checkout.
 * Utilizes direct Stripe API v1 with the provided test restricted key.
 */

export interface CreatePaymentIntentParams {
  amount: number; // in major units (e.g., 28.00)
  currency: string; // e.g. "USD", "EUR", "GBP"
  customerEmail: string;
  orderNumber: string;
  metadata?: Record<string, string>;
}

export interface StripePaymentIntentResult {
  id: string;
  clientSecret: string;
}

export async function createStripePaymentIntent(
  params: CreatePaymentIntentParams
): Promise<StripePaymentIntentResult> {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY is not configured.");
  }

  // Convert major units to minor units (cents / pence)
  const minorUnits = Math.round(params.amount * 100);

  const body = new URLSearchParams();
  body.append("amount", minorUnits.toString());
  body.append("currency", params.currency.toLowerCase());
  body.append("automatic_payment_methods[enabled]", "true");
  body.append("receipt_email", params.customerEmail);
  body.append("metadata[order_number]", params.orderNumber);

  if (params.metadata) {
    for (const [key, val] of Object.entries(params.metadata)) {
      body.append(`metadata[${key}]`, String(val));
    }
  }

  const response = await fetch("https://api.stripe.com/v1/payment_intents", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  const data = await response.json();

  if (!response.ok) {
    const errorMsg = data.error?.message || `Stripe API error: ${response.statusText}`;
    throw new Error(errorMsg);
  }

  return {
    id: data.id,
    clientSecret: data.client_secret,
  };
}
