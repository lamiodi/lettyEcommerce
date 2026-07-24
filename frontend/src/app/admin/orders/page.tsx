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
import { StatusPill, ORDER_FULFILLMENT_TONE, ORDER_PAYMENT_TONE } from "@/components/admin/status-pill";

interface OrderRow {
  id: string;
  order_number: string;
  customer_email: string;
  total: number;
  currency: AdminCurrency;
  payment_status: string;
  fulfillment_status: string;
  payment_gateway: string;
  created_at: string;
}

interface ListResponse {
  data: OrderRow[];
  nextCursor: string | null;
}

export const dynamic = "force-dynamic";

async function fetchOrders(searchParams: Record<string, string | undefined>): Promise<ListResponse> {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
  const cookieHeader = cookies().getAll().map((c) => `${c.name}=${c.value}`).join("; ");
  const url = new URL(`${base}/api/admin/orders`);
  for (const [k, v] of Object.entries(searchParams)) {
    if (v) url.searchParams.set(k, v);
  }
  try {
    const res = await fetch(url, {
      headers: cookieHeader ? { cookie: cookieHeader } : undefined,
      cache: "no-store",
    });
    if (!res.ok) return { data: [], nextCursor: null };
    return (await res.json()) as ListResponse;
  } catch {
    return { data: [], nextCursor: null };
  }
}

const PAYMENTS = ["paid", "pending", "failed", "refunded", "partially_refunded"] as const;
const FULFILLMENTS = ["unfulfilled", "partially_fulfilled", "fulfilled", "cancelled"] as const;
const CURRENCIES = ["USD", "EUR", "GBP", "NGN", "GHS", "ZAR", "KES"] as const;
const GATEWAYS = ["stripe", "paystack"] as const;

export default async function OrdersListPage(props: { searchParams: Record<string, string> }) {
  const sp = props.searchParams;
  const { data } = await fetchOrders(sp);

  const columns: Column<OrderRow>[] = [
    {
      key: "order_number",
      label: "Order",
      sortable: true,
      render: (r) => (
        <Link href={`/admin/orders/${r.id}`} className="text-ink hover:underline underline-offset-2">
          {r.order_number}
        </Link>
      ),
    },
    {
      key: "customer_email",
      label: "Customer",
      hideOnMobile: true,
      render: (r) => <span className="text-stone text-xs">{r.customer_email}</span>,
    },
    {
      key: "total",
      label: "Total",
      align: "right",
      sortable: true,
      render: (r) => <CurrencyCell amount={r.total} currency={r.currency} />,
    },
    {
      key: "payment_gateway",
      label: "Gateway",
      hideOnMobile: true,
      render: (r) => <span className="text-[11px] uppercase tracking-[0.18em] text-stone">{r.payment_gateway}</span>,
    },
    {
      key: "payment_status",
      label: "Payment",
      render: (r) => <StatusPill label={r.payment_status} tone={ORDER_PAYMENT_TONE[r.payment_status] ?? "neutral"} />,
    },
    {
      key: "fulfillment_status",
      label: "Fulfillment",
      render: (r) => (
        <StatusPill label={r.fulfillment_status} tone={ORDER_FULFILLMENT_TONE[r.fulfillment_status] ?? "neutral"} />
      ),
    },
    {
      key: "created_at",
      label: "Created",
      align: "right",
      sortable: true,
      render: (r) => <span className="text-xs text-stone">{new Date(r.created_at).toLocaleString()}</span>,
    },
  ];

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

      <DataTable
        rows={data}
        columns={columns}
        rowKey={(r) => r.id}
        initialSort={{ key: "created_at", dir: "desc" }}
        emptyTitle="No orders match"
        emptyDescription="Try clearing your filters or widening the date range."
      />
    </div>
  );
}
