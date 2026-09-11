import { NextRequest, NextResponse } from "next/server";
import { updateOrderInStore, getOrderFromStore } from "@/lib/orders/order-store";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, paymentIntentId } = body;

    if (!orderId || !paymentIntentId) {
      return NextResponse.json(
        { error: "orderId and paymentIntentId are required" },
        { status: 400 }
      );
    }

    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json(
        { error: "Stripe configuration missing on server" },
        { status: 500 }
      );
    }

    // Verify PaymentIntent status directly with Stripe API
    const stripeRes = await fetch(
      `https://api.stripe.com/v1/payment_intents/${encodeURIComponent(paymentIntentId)}`,
      {
        headers: {
          Authorization: `Bearer ${secretKey}`,
        },
      }
    );

    if (!stripeRes.ok) {
      const errData = await stripeRes.json().catch(() => ({}));
      return NextResponse.json(
        { error: errData.error?.message || "Failed to verify payment with Stripe" },
        { status: 400 }
      );
    }

    const intent = await stripeRes.json();
    if (intent.status !== "succeeded") {
      return NextResponse.json(
        {
          error: `Payment is not completed. Current status: ${intent.status}`,
          status: intent.status,
        },
        { status: 402 }
      );
    }

    // Update order in store to paid
    const updated = await updateOrderInStore(orderId, {
      payment_status: "paid",
      event: {
        type: "payment_confirmed",
        metadata: {
          gateway: "stripe",
          payment_intent_id: intent.id,
          amount_received: intent.amount_received,
          currency: intent.currency,
        },
      },
    });

    return NextResponse.json({
      success: true,
      orderId: updated?.order_number || orderId,
      paymentStatus: "paid",
    });
  } catch (error: any) {
    console.error("Checkout confirm error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to confirm payment" },
      { status: 500 }
    );
  }
}
