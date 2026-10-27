import Stripe from "stripe";
import dotenv from "dotenv";
dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

async function testExplicitTypes() {
  for (const curr of ["usd", "cad", "aud", "eur", "gbp"]) {
    try {
      const intent = await stripe.paymentIntents.create({
        amount: 1500,
        currency: curr,
        payment_method_types: ["card", "klarna"],
      });
      console.log(`Explicit klarna for ${curr}: SUCCESS!`);
    } catch (err: any) {
      console.log(`Explicit klarna for ${curr}: FAILED - ${err.message}`);
    }
  }
}

testExplicitTypes();
