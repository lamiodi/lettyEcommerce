/**
 * /admin/orders — list view.
 * Filter by status, payment, fulfillment, gateway, currency, and free-text
 * search on `order_number` or `customer_email`. Server-side pagination via
 * ?page= — without it, orders beyond the first 50 were unreachable.
 */
import Link from "next/link";
import { cookies } from "next/headers";
import { OrdersTableClient, type OrderRow } from "@/components/admin/orders/orders-table-client";

interface ListResponse {
  data: OrderRow[];
  page: number;
  totalPages: number;
  total: number;
}

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

async function fetchOrders(searchParams: Record<string, string | undefined>): Promise<ListResponse> {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "https://lettyecommerce.onrender.com";
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
  if (searchParams.payment_gateway) url.searchParams.set("payment_gateway", searchParams.payment_gateway);
  const page = Math.max(1, Number(searchParams.page) || 1);
  url.searchParams.set("page", String(page));
  url.searchParams.set("limit", String(PAGE_SIZE));

  try {
    const res = await fetch(url.toString(), {
      headers: cookieHeader ? { cookie: cookieHeader } : undefined,
      cache: "no-store",
    });
    if (!res.ok) return { data: [], page: 1, totalPages: 1, total: 0 };
    const json = await res.json();
    const meta = json.meta ?? {};
    return {
      data: Array.isArray(json.data) ? json.data : [],
      page: Number(meta.page) || page,
      totalPages: Number(meta.total_pages) || 1,
      total: Number(meta.total) || 0,
    };
  } catch (e) {
    console.error("fetchOrders error:", e);
    return { data: [], page: 1, totalPages: 1, total: 0 };
  }
}

const PAYMENTS = ["paid", "pending", "failed", "refunded", "partially_refunded"] as const;
const FULFILLMENTS = ["unfulfilled", "partially_fulfilled", "fulfilled", "cancelled"] as const;
const CURRENCIES = ["USD", "EUR", "GBP", "NGN", "GHS", "ZAR", "KES"] as const;
const GATEWAYS = ["stripe"] as const;

function pageHref(sp: Record<string, string | undefined>, page: number): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(sp)) {
    if (value && key !== "page") params.set(key, value);
  }
  params.set("page", String(page));
  return `/admin/orders?${params.toString()}`;
}

export default async function OrdersListPage(props: {
  searchParams: Promise<Record<string, string>> | Record<string, string>;
}) {
  const sp = (await props.searchParams) || {};
  const { data, page, totalPages, total } = await fetchOrders(sp);

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

      <div className="flex items-center justify-between border-t border-line pt-3 text-xs text-stone">
        <span>
          {total} order{total === 1 ? "" : "s"} · page {page} of {totalPages}
        </span>
        <div className="flex items-center gap-3">
          {page > 1 ? (
            <Link href={pageHref(sp, page - 1)} className="uppercase tracking-[0.18em] hover:text-ink">
              ← Previous
            </Link>
          ) : null}
          {page < totalPages ? (
            <Link href={pageHref(sp, page + 1)} className="uppercase tracking-[0.18em] hover:text-ink">
              Next →
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
