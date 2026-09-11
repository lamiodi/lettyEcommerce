import { NextRequest, NextResponse } from "next/server";
import {
  incrementVariantStock,
  listAllInventory,
  updateVariantStock,
} from "@/lib/inventory/inventory-store";

export const dynamic = "force-dynamic";

interface InventoryMutationBody {
  variantId?: unknown;
  variant_id?: unknown;
  op?: unknown;
  action?: unknown;
  quantity?: unknown;
  new_quantity?: unknown;
}

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query") || undefined;
    const lowOnly = searchParams.get("lowOnly") === "true" || searchParams.get("lowOnly") === "1";
    const rows = await listAllInventory({ query, lowOnly });

    return NextResponse.json({
      data: rows.map((row) => ({
        id: row.variantId,
        sku: row.sku,
        stock_quantity: row.stockQuantity,
        reserved_quantity: row.reservedQuantity,
        low_stock_threshold: row.lowStockThreshold,
        is_active: true,
        product_id: row.productSlug,
        product: {
          id: row.productSlug,
          slug: row.productSlug,
          name: row.productName,
          is_active: true,
        },
        variant_options: [
          {
            id: `opt-${row.variantId}`,
            option_name: "Shade",
            option_value: row.shadeName,
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
  } catch (error: unknown) {
    return NextResponse.json(
      { error: errorMessage(error, "Failed to fetch inventory") },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as InventoryMutationBody;
    const rawVariantId = body.variantId ?? body.variant_id;
    const variantId = typeof rawVariantId === "string" ? rawVariantId.trim() : "";
    const rawOperation = body.op ?? body.action ?? "adjust";
    const operation = typeof rawOperation === "string" ? rawOperation : "";
    const rawQuantity = body.new_quantity ?? body.quantity;

    if (!variantId || typeof rawQuantity !== "number" || !Number.isInteger(rawQuantity)) {
      return NextResponse.json(
        { error: "variant_id and an integer quantity are required" },
        { status: 400 },
      );
    }
    if (operation !== "restock" && operation !== "add" && operation !== "adjust" && operation !== "set") {
      return NextResponse.json({ error: "Unsupported inventory operation" }, { status: 400 });
    }
    if (rawQuantity < 0 || ((operation === "restock" || operation === "add") && rawQuantity === 0)) {
      return NextResponse.json(
        { error: operation === "restock" || operation === "add"
          ? "Restock quantity must be greater than zero"
          : "Stock quantity cannot be negative" },
        { status: 400 },
      );
    }

    const updated =
      operation === "restock" || operation === "add"
        ? await incrementVariantStock(variantId, rawQuantity)
        : await updateVariantStock(variantId, rawQuantity);
    if (!updated) {
      return NextResponse.json({ error: `Variant ${variantId} not found` }, { status: 404 });
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
  } catch (error: unknown) {
    return NextResponse.json(
      { error: errorMessage(error, "Failed to update inventory") },
      { status: 500 },
    );
  }
}
