import { NextRequest, NextResponse } from "next/server";
import { updateOrderInStore } from "@/lib/orders/order-store";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const { note = "" } = body;

    const updated = await updateOrderInStore(id, {
      internal_notes: note,
    });

    if (!updated) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ data: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
