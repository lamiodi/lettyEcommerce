import { NextRequest, NextResponse } from "next/server";
import { getOrderFromStore } from "@/lib/orders/order-store";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const order = await getOrderFromStore(id);

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ data: order });
  } catch (err: any) {
    console.error("Admin order detail error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
