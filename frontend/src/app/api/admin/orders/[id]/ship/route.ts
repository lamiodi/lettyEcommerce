import { NextRequest, NextResponse } from "next/server";
import { updateOrderInStore } from "@/lib/orders/order-store";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const { carrier = "DHL Express", tracking_number = "TRACK-123456" } = body;

    const updated = await updateOrderInStore(id, {
      fulfillment_status: "fulfilled",
      tracking_carrier: carrier,
      tracking_number: tracking_number,
      event: {
        type: "shipped",
        metadata: { carrier, tracking_number },
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
