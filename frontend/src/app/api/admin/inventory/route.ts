import { NextRequest, NextResponse } from "next/server";
import { listAllInventory, updateVariantStock } from "@/lib/inventory/inventory-store";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query") || undefined;
    const lowOnly = searchParams.get("lowOnly") === "true" || searchParams.get("lowOnly") === "1";

    const rows = await listAllInventory({ query, lowOnly });

    return NextResponse.json({
      data: rows.map((r) => ({
        id: r.variantId,
        sku: r.sku,
        stock_quantity: r.stockQuantity,
        reserved_quantity: r.reservedQuantity,
        low_stock_threshold: r.lowStockThreshold,
        is_active: true,
        product_id: r.productSlug,
        product: {
          id: r.productSlug,
          slug: r.productSlug,
          name: r.productName,
          is_active: true,
        },
        variant_options: [
          {
            id: `opt-${r.variantId}`,
            option_name: "Shade",
            option_value: r.shadeName,
          },
        ],
      })),
      meta: {
        total: rows.length,
        page: 1,
        per_page: rows.length,
        total_pages: 1,
      },
    });
  } catch (err: any) {
    console.error("Admin inventory GET error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to fetch inventory" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const variantId = body.variantId || body.variant_id;
    const op = body.op || body.action || "set";

    let quantity = typeof body.quantity === "number" ? body.quantity : undefined;
    if (typeof body.new_quantity === "number") {
      quantity = body.new_quantity;
    }

    if (!variantId || quantity === undefined) {
      return NextResponse.json(
        { error: "variant_id and numeric quantity are required" },
        { status: 400 }
      );
    }

    const currentRows = await listAllInventory();
    const current = currentRows.find((r) => r.variantId === variantId || r.sku === variantId);
    
    let targetStock: number;
    if (op === "restock" || op === "add") {
      targetStock = (current?.stockQuantity || 0) + quantity;
    } else {
      // "adjust" or "set"
      targetStock = quantity;
    }

    const updated = await updateVariantStock(variantId, targetStock);
    if (!updated) {
      return NextResponse.json(
        { error: `Variant ${variantId} not found` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: updated.variantId,
        new_stock: updated.stockQuantity,
        new_quantity: updated.stockQuantity,
        stock_quantity: updated.stockQuantity,
      },
    });
  } catch (err: any) {
    console.error("Admin inventory POST error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to update inventory" },
      { status: 500 }
    );
  }
}
