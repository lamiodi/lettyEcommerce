"use client";

import Link from "next/link";
import { DataTable, type Column } from "@/components/admin/data-table";
import { CurrencyCell, type AdminCurrency } from "@/components/admin/currency-cell";
import { StatusPill, ORDER_FULFILLMENT_TONE, ORDER_PAYMENT_TONE } from "@/components/admin/status-pill";

export interface OrderRow {
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

const columns: Column<OrderRow>[] = [
  {
    key: "order_number",
    label: "Order",
    sortable: true,
    render: (r) => (
      <Link href={`/admin/orders/${r.id}`} className="font-medium text-ink hover:underline underline-offset-2">
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

export function OrdersTableClient({ rows }: { rows: OrderRow[] }) {
  return (
    <DataTable
      rows={rows}
      columns={columns}
      rowKey={(r) => r.id}
      initialSort={{ key: "created_at", dir: "desc" }}
      emptyTitle="No orders match"
      emptyDescription="Try clearing your filters or widening the date range."
    />
  );
}
