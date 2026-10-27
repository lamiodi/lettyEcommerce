import Stripe from "stripe";
import dotenv from "dotenv";
dotenv.config();

const key = process.env.STRIPE_SECRET_KEY;
if (!key) {
  console.error("Missing STRIPE_SECRET_KEY");
  process.exit(1);
}

const stripe = new Stripe(key);

async function check() {
  try {
    const account = await stripe.accounts.retrieve();
    console.log("Account ID:", account.id);
    console.log("Country:", account.country);
    console.log("Capabilities:", account.capabilities);

    try {
      const configs = await stripe.paymentMethodConfigurations.list();
      console.log("\nPayment Method Configurations count:", configs.data.length);
      for (const c of configs.data) {
        console.log(`\nConfig: ${c.id} (${c.name ?? "default"}) [is_default: ${c.is_default}]`);
        console.log("  klarna:", JSON.stringify(c.klarna));
        console.log("  paypal:", JSON.stringify(c.paypal));
        console.log("  afterpay_clearpay:", JSON.stringify(c.afterpay_clearpay));
        console.log("  revolut_pay:", JSON.stringify(c.revolut_pay));
        console.log("  link:", JSON.stringify(c.link));
        console.log("  card:", JSON.stringify(c.card));
      }
    } catch (e: any) {
      console.log("Could not list payment method configurations:", e.message);
    }
  } catch (err) {
    console.error("Account error:", err);
  }
}

check();
