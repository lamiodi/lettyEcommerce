/**
 * /admin/orders — list view.
 * Filter by status, payment, fulfillment, gateway, currency, date, and
 * free-text search on `order_number` or `customer_email`. The
 * DataTable supports sort, pagination, bulk-select, and a click that
 * pushes to the detail page.
 */
import Link from "next/link";
import { cookies } from "next/headers";
import { DataTable, type Column } from "@/components/admin/data-table";
import { CurrencyCell, type AdminCurrency } from "@/components/admin/currency-cell";
import { OrdersTableClient, type OrderRow } from "@/components/admin/orders/orders-table-client";

interface ListResponse {
  data: OrderRow[];
  nextCursor: string | null;
}

export const dynamic = "force-dynamic";

async function fetchOrders(searchParams: Record<string, string | undefined>): Promise<ListResponse> {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.getAll().map((c) => `${c.name}=${c.value}`).join("; ");
  const url = new URL(`${base}/api/admin/orders`);
  if (searchParams.query) url.searchParams.set("query", searchParams.query);
  if (searchParams.payment_status || searchParams.status) {
    url.searchParams.set("payment_status", (searchParams.payment_status || searchParams.status)!);
  }
  if (searchParams.fulfillment_status || searchParams.fulfillment) {
    url.searchParams.set("fulfillment_status", (searchParams.fulfillment_status || searchParams.fulfillment)!);
  }
  if (searchParams.currency) url.searchParams.set("currency", searchParams.currency);
  if (searchParams.cursor) url.searchParams.set("cursor", searchParams.cursor);
  if (searchParams.limit) url.searchParams.set("limit", searchParams.limit);

  try {
    const res = await fetch(url.toString(), {
      headers: cookieHeader ? { cookie: cookieHeader } : undefined,
      cache: "no-store",
    });
    if (!res.ok) return { data: [], nextCursor: null };
    const json = await res.json();
    return {
      data: Array.isArray(json.data) ? json.data : [],
      nextCursor: json.nextCursor ?? null,
    };
  } catch (e) {
    console.error("fetchOrders error:", e);
    return { data: [], nextCursor: null };
  }
}

const PAYMENTS = ["paid", "pending", "failed", "refunded", "partially_refunded"] as const;
const FULFILLMENTS = ["unfulfilled", "partially_fulfilled", "fulfilled", "cancelled"] as const;
const CURRENCIES = ["USD", "EUR", "GBP", "NGN", "GHS", "ZAR", "KES"] as const;
const GATEWAYS = ["stripe"] as const;

export default async function OrdersListPage(props: {
  searchParams: Promise<Record<string, string>> | Record<string, string>;
}) {
  const sp = (await props.searchParams) || {};
  const { data } = await fetchOrders(sp);

  return (
    <div className="space-y-4">
      <form className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <input
          name="query"
          defaultValue={sp.query ?? ""}
          placeholder="Order or email"
          className="h-10 px-3 border border-line bg-ivory text-sm focus:border-ink focus:outline-none"
        />
        <select name="payment_status" defaultValue={sp.payment_status ?? ""} className="h-10 px-3 border border-line bg-ivory text-sm">
          <option value="">All payments</option>
          {PAYMENTS.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <select name="fulfillment_status" defaultValue={sp.fulfillment_status ?? ""} className="h-10 px-3 border border-line bg-ivory text-sm">
          <option value="">All fulfillments</option>
          {FULFILLMENTS.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <select name="currency" defaultValue={sp.currency ?? ""} className="h-10 px-3 border border-line bg-ivory text-sm">
          <option value="">All currencies</option>
          {CURRENCIES.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <select name="payment_gateway" defaultValue={sp.payment_gateway ?? ""} className="h-10 px-3 border border-line bg-ivory text-sm">
          <option value="">All gateways</option>
          {GATEWAYS.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <button type="submit" className="h-10 text-[11px] uppercase tracking-[0.18em] bg-ink text-ivory">
          Apply
        </button>
      </form>

      <OrdersTableClient rows={data} />
    </div>
  );
}
