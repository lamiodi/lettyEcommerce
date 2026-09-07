import { NextRequest, NextResponse } from "next/server";
import { updateOrderInStore } from "@/lib/orders/order-store";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const updated = await updateOrderInStore(id, {
      fulfillment_status: "fulfilled",
      event: {
        type: "delivered",
        metadata: { delivered_at: new Date().toISOString() },
      },
    });

    if (!updated) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ data: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
