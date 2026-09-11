import { NextRequest, NextResponse } from "next/server";
import { updateOrderInStore, getOrderFromStore } from "@/lib/orders/order-store";
import { decrementInventory } from "@/lib/inventory/inventory-store";

interface StripePaymentIntent {
  id: string;
  status: string;
  amount_received: number;
  currency: string;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Failed to confirm payment";
}

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

    const order = await getOrderFromStore(orderId);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    if (order.payment_reference !== paymentIntentId) {
      return NextResponse.json(
        { error: "Payment reference does not match this order" },
        { status: 400 },
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
      const errData = (await stripeRes.json().catch(() => ({}))) as {
        error?: { message?: string };
      };
      return NextResponse.json(
        { error: errData.error?.message || "Failed to verify payment with Stripe" },
        { status: 400 }
      );
    }

    const intent = (await stripeRes.json()) as StripePaymentIntent;
    if (intent.status !== "succeeded") {
      return NextResponse.json(
        {
          error: `Payment is not completed. Current status: ${intent.status}`,
          status: intent.status,
        },
        { status: 402 }
      );
    }

    // Do not append duplicate events when the client retries confirmation.
    const updated =
      order.payment_status === "paid"
        ? order
        : await updateOrderInStore(orderId, {
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

    const confirmedOrder = updated ?? order;
    if (confirmedOrder.order_items.length > 0) {
      const itemsToDecrement = confirmedOrder.order_items.map((item) => ({
        variantId: item.product_snapshot.variant_id,
        productSlug: item.product_snapshot.slug,
        quantity: item.quantity,
      }));

      try {
        await decrementInventory(itemsToDecrement, confirmedOrder.id);
      } catch (inventoryError) {
        await updateOrderInStore(orderId, {
          event: {
            type: "inventory_commit_failed",
            metadata: {
              message: errorMessage(inventoryError),
            },
          },
        });
        return NextResponse.json(
          {
            error: "Payment succeeded, but inventory reconciliation requires attention.",
            orderId: confirmedOrder.order_number,
            paymentStatus: "paid",
          },
          { status: 409 },
        );
      }
    }

    return NextResponse.json({
      success: true,
      orderId: confirmedOrder.order_number,
      paymentStatus: "paid",
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: errorMessage(error) },
      { status: 500 },
    );
  }
}
