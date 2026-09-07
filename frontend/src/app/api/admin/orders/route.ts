import { NextRequest, NextResponse } from "next/server";
import { listOrdersFromStore } from "@/lib/orders/order-store";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const query = searchParams.get("query") || undefined;
    const payment_status = searchParams.get("payment_status") || searchParams.get("status") || undefined;
    const fulfillment_status = searchParams.get("fulfillment_status") || searchParams.get("fulfillment") || undefined;
    const currency = searchParams.get("currency") || undefined;

    const orders = await listOrdersFromStore({
      query,
      payment_status,
      fulfillment_status,
      currency,
    });

    const rows = orders.map((o) => ({
      id: o.id,
      order_number: o.order_number,
      customer_email: o.customer_email,
      total: o.total,
      currency: o.currency,
      payment_status: o.payment_status,
      fulfillment_status: o.fulfillment_status,
      payment_gateway: o.payment_gateway || "stripe",
      created_at: o.created_at,
    }));

    return NextResponse.json({
      data: rows,
      nextCursor: null,
    });
  } catch (err: any) {
    console.error("Admin orders list error:", err);
    return NextResponse.json({ error: err.message, data: [] }, { status: 500 });
  }
}
