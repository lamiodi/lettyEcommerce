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

  // Currencies supported by Stripe GB account
  let chargeCurrency = (params.currency || "USD").toLowerCase();
  let chargeAmount = params.amount;

  // Fallback conversion for currencies unsupported by Stripe GB account (e.g. GHS)
  if (chargeCurrency === "ghs") {
    chargeCurrency = "usd";
    // Convert GHS to USD using exchange rates (1 GBP = 19.5 GHS, 1 GBP = 1.28 USD)
    chargeAmount = Math.max(1, Math.round((params.amount / 19.5) * 1.28 * 100) / 100);
  }

  // Convert major units to minor units (cents / pence / kobo)
  const minorUnits = Math.round(chargeAmount * 100);

  const body = new URLSearchParams();
  body.append("amount", minorUnits.toString());
  body.append("currency", chargeCurrency);
  body.append("automatic_payment_methods[enabled]", "true");
  body.append("receipt_email", params.customerEmail);
  body.append("metadata[order_number]", params.orderNumber);
  body.append("metadata[payment_gateway]", "stripe");

  if (params.currency.toLowerCase() !== chargeCurrency) {
    body.append("metadata[original_currency]", params.currency.toUpperCase());
    body.append("metadata[original_amount]", params.amount.toString());
  }

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
