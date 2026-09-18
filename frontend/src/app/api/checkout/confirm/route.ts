import { NextRequest, NextResponse } from "next/server";
import { updateOrderInStore, getOrderFromStore } from "@/lib/orders/order-store";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || !body.orderId) {
      return NextResponse.json({ error: "Missing required field: orderId" }, { status: 400 });
    }

    const { orderId, paymentIntentId } = body;

    const updated = await updateOrderInStore(orderId, {
      payment_status: "paid",
      payment_reference: paymentIntentId || undefined,
      event: {
        type: "paid",
        metadata: {
          paymentIntentId,
          confirmed_at: new Date().toISOString(),
          channel: "web_checkout",
        },
      },
    });

    if (!updated) {
      console.warn(`Order ${orderId} not found during payment confirmation, trying fetch.`);
      const order = await getOrderFromStore(orderId);
      return NextResponse.json({ success: true, data: { orderId, order } });
    }

    return NextResponse.json({
      success: true,
      data: {
        order_id: updated.id,
        order_number: updated.order_number,
        payment_status: updated.payment_status,
      },
    });
  } catch (error: any) {
    console.error("Payment confirmation error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error during payment confirmation" },
      { status: 500 }
    );
  }
}
