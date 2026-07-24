/**
 * GET /api/admin/dashboard
 *
 * Aggregates the figures shown on the admin home:
 *  - revenue today / 7d / 30d, split by currency
 *  - AOV (all-time, paid orders)
 *  - last 20 paid orders
 *  - low-stock variants (stock_quantity - reserved <= low_stock_threshold)
 *
 * Designed for v1: one round trip per page load. Heavy reports are
 * split into /api/admin/analytics.
 */
import { NextRequest } from "next/server";
import { asyncHandler } from "@/lib/handler";
import { checkPermission } from "@/lib/auth/rbac";
import { supabaseAdmin } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

type Currency = "USD" | "EUR" | "GBP" | "NGN" | "GHS" | "ZAR" | "KES";
const CURRENCIES: Currency[] = ["USD", "EUR", "GBP", "NGN", "GHS", "ZAR", "KES"];

export const GET = asyncHandler(async (_req: NextRequest) => {
  await checkPermission("read");

  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const start7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const start30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

  // Fetch the relevant order set in a single query. Use a window of 30d
  // (covers today, 7d, 30d in one shot) then bucket in JS.
  const { data: orders, error: ordersErr } = await supabaseAdmin()
    .from("orders")
    .select("id, order_number, total, currency, customer_email, payment_status, fulfillment_status, created_at, paid_at")
    .gte("created_at", start30d)
    .order("created_at", { ascending: false })
    .limit(5000);
  if (ordersErr) {
    logger.error({ error: ordersErr }, "dashboard: orders fetch failed");
  }

  const paid = (orders ?? []).filter((o) => o.payment_status === "paid");
  const sumByCurrency = (predicate: (o: any) => boolean) => {
    const totals: Record<string, number> = {};
    for (const c of CURRENCIES) totals[c] = 0;
    for (const o of paid) {
      if (!predicate(o)) continue;
      const c = o.currency as Currency;
      if (totals[c] == null) totals[c] = 0;
      totals[c] += Number(o.total) || 0;
    }
    return totals;
  };
  const countByCurrency = (predicate: (o: any) => boolean) => {
    const counts: Record<string, number> = {};
    for (const c of CURRENCIES) counts[c] = 0;
    for (const o of paid) {
      if (!predicate(o)) continue;
      const c = o.currency as Currency;
      if (counts[c] == null) counts[c] = 0;
      counts[c] += 1;
    }
    return counts;
  };

  const revenue = {
    today: sumByCurrency((o) => o.created_at >= startToday),
    d7: sumByCurrency((o) => o.created_at >= start7d),
    d30: sumByCurrency((o) => o.created_at >= start30d),
  };
  const orderCount = {
    today: countByCurrency((o) => o.created_at >= startToday),
    d7: countByCurrency((o) => o.created_at >= start7d),
    d30: countByCurrency((o) => o.created_at >= start30d),
  };
  const aov = {
    d30: Object.fromEntries(
      CURRENCIES.map((c) => {
        const sum = revenue.d30[c] ?? 0;
        const n = orderCount.d30[c] ?? 0;
        return [c, n > 0 ? sum / n : 0];
      }),
    ),
  };

  // Live orders (last 20 paid).
  const live = (orders ?? [])
    .filter((o) => o.payment_status === "paid")
    .slice(0, 20)
    .map((o) => ({
      id: o.id,
      order_number: o.order_number,
      customer_email: o.customer_email,
      total: Number(o.total),
      currency: o.currency as Currency,
      fulfillment_status: o.fulfillment_status,
      created_at: o.created_at,
    }));

  // Low-stock variants: stock <= low_stock_threshold (or default 5 if null).
  const { data: lowStock, error: lowErr } = await supabaseAdmin()
    .from("product_variants")
    .select("id, sku, stock_quantity, reserved_quantity, low_stock_threshold, product:products(name, slug, primary_image), price_usd, price_ngn")
    .gt("stock_quantity", 0)
    .limit(20);
  if (lowErr) {
    logger.warn({ error: lowErr }, "dashboard: low-stock fetch failed");
  }
  const lowStockList = (lowStock ?? [])
    .map((v: any) => {
      const threshold = v.low_stock_threshold ?? 5;
      const available = (v.stock_quantity ?? 0) - (v.reserved_quantity ?? 0);
      return {
        id: v.id,
        sku: v.sku,
        name: v.product?.name ?? "—",
        slug: v.product?.slug ?? "",
        primary_image: v.product?.primary_image ?? null,
        stock: v.stock_quantity ?? 0,
        available,
        threshold,
        price: v.price_usd ?? v.price_ngn ?? 0,
        currency: v.price_usd ? "USD" : "NGN",
        isLow: available <= threshold,
      };
    })
    .filter((v) => v.isLow)
    .sort((a, b) => a.available - b.available)
    .slice(0, 10);

  return Response.json({
    data: {
      revenue,
      orderCount,
      aov,
      live,
      lowStock: lowStockList,
      fetchedAt: now.toISOString(),
    },
  });
});
