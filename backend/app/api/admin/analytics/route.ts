/**
 * GET /api/admin/analytics
 *   ?range=7d|30d|90d
 *
 * Heavy reports — split out of the dashboard so the home page
 * stays fast.
 *
 *  - revenue_by_day:  { date, USD, NGN, EUR, GBP, GHS, ZAR, KES }
 *  - top_products:    top 10 by paid-order quantity, with revenue
 *  - gateway_mix:     { stripe: { count, total_usd }, paystack: {…} }
 *  - currency_mix:    { USD: count, NGN: count, … }
 *  - fulfillment_mix: { unfulfilled: n, fulfilled: n, … }
 */
import { NextRequest } from "next/server";
import { z } from "zod";
import { asyncHandler } from "@/lib/handler";
import { ok } from "@/lib/responses";
import { checkPermission } from "@/lib/auth/rbac";
import { supabaseAdmin } from "@/lib/supabase/server";

const querySchema = z.object({
  range: z.enum(["7d", "30d", "90d"]).default("30d"),
});

type Currency = "USD" | "EUR" | "GBP" | "NGN" | "GHS" | "ZAR" | "KES";
const CURRENCIES: Currency[] = ["USD", "EUR", "GBP", "NGN", "GHS", "ZAR", "KES"];

export const GET = asyncHandler(async (req: NextRequest) => {
  await checkPermission("read");
  const params = Object.fromEntries(new URL(req.url).searchParams.entries());
  const parsed = querySchema.safeParse(params);
  if (!parsed.success) return Response.json({ error: "Invalid query" }, { status: 400 });
  const { range } = parsed.data;
  const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const [{ data: orders, error: ordersErr }, { data: items, error: itemsErr }] = await Promise.all([
    supabaseAdmin()
      .from("orders")
      .select("id, total, currency, payment_status, payment_gateway, fulfillment_status, created_at, paid_at")
      .gte("created_at", since),
    supabaseAdmin()
      .from("order_items")
      .select("id, product_id, quantity, unit_price, product_snapshot, order:orders!inner(created_at, payment_status, currency)")
      .gte("order.created_at", since),
  ]);
  if (ordersErr) throw new Error(ordersErr.message);
  if (itemsErr) throw new Error(itemsErr.message);

  const paid = (orders ?? []).filter((o) => o.payment_status === "paid");

  // Revenue by day
  const byDay: Record<string, Record<string, number>> = {};
  for (const o of paid) {
    const d = (o.paid_at ?? o.created_at).slice(0, 10);
    if (!byDay[d]) {
      byDay[d] = Object.fromEntries(CURRENCIES.map((c) => [c, 0]));
    }
    byDay[d][o.currency as Currency] = (byDay[d][o.currency as Currency] ?? 0) + Number(o.total);
  }
  const revenueByDay = Object.entries(byDay)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, totals]) => ({ date, ...totals }));

  // Top products (sum quantity + revenue_usd-equivalent? We keep per-currency)
  const byProduct: Record<string, { product_id: string; quantity: number; revenue: Record<string, number>; name: string; slug: string }> = {};
  for (const it of (items ?? []) as Array<any>) {
    const order = it.order;
    if (!order || order.payment_status !== "paid") continue;
    const pid = it.product_id;
    if (!byProduct[pid]) {
      const s = it.product_snapshot ?? {};
      byProduct[pid] = {
        product_id: pid,
        quantity: 0,
        revenue: Object.fromEntries(CURRENCIES.map((c) => [c, 0])),
        name: s.name ?? "—",
        slug: s.slug ?? "",
      };
    }
    byProduct[pid].quantity += it.quantity;
    const c = order.currency as Currency;
    byProduct[pid].revenue[c] = (byProduct[pid].revenue[c] ?? 0) + Number(it.unit_price) * it.quantity;
  }
  const topProducts = Object.values(byProduct)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 10);

  // Gateway mix
  const gatewayMix: Record<string, { count: number; byCurrency: Record<string, number> }> = {
    stripe: { count: 0, byCurrency: Object.fromEntries(CURRENCIES.map((c) => [c, 0])) },
    paystack: { count: 0, byCurrency: Object.fromEntries(CURRENCIES.map((c) => [c, 0])) },
  };
  for (const o of paid) {
    const gw = (o.payment_gateway as "stripe" | "paystack") ?? "stripe";
    const slot = gatewayMix[gw];
    if (!slot) continue;
    slot.count += 1;
    const c = o.currency as Currency;
    slot.byCurrency[c] = (slot.byCurrency[c] ?? 0) + Number(o.total);
  }

  // Currency mix
  const currencyMix: Record<string, number> = Object.fromEntries(CURRENCIES.map((c) => [c, 0]));
  for (const o of paid) {
    const c = o.currency as Currency;
    currencyMix[c] = (currencyMix[c] ?? 0) + 1;
  }

  // Fulfillment mix (on all orders, not just paid — pending = unfulfilled)
  const fulfillmentMix: Record<string, number> = {
    unfulfilled: 0,
    partially_fulfilled: 0,
    fulfilled: 0,
    returned: 0,
    cancelled: 0,
  };
  for (const o of (orders ?? [])) {
    const s = o.fulfillment_status as keyof typeof fulfillmentMix;
    if (fulfillmentMix[s] != null) fulfillmentMix[s] += 1;
  }

  return ok({
    range,
    days,
    revenueByDay,
    topProducts,
    gatewayMix,
    currencyMix,
    fulfillmentMix,
  });
});
