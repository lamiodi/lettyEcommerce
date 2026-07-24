/**
 * /admin/orders/[id] — order detail.
 *  - Full snapshot (customer, addresses, items, events, payment timeline)
 *  - Action bar (mark shipped, mark delivered, cancel, refund, view on site)
 *  - Internal note (5.C.7)
 *
 * The action buttons are client components that call the
 * markShippedAction / markDeliveredAction / cancelOrderAction /
 * refundOrderAction / setInternalNoteAction server actions defined in
 * backend/app/admin/actions/orders.ts.
 */
import Link from "next/link";
import { cookies } from "next/headers";
import { ExternalLink } from "lucide-react";
import { CurrencyCell, type AdminCurrency } from "@/components/admin/currency-cell";
import { StatusPill, ORDER_FULFILLMENT_TONE, ORDER_PAYMENT_TONE } from "@/components/admin/status-pill";
import { OrderActionsBar } from "@/components/admin/orders/order-actions-bar";
import { InternalNoteForm } from "@/components/admin/orders/internal-note-form";

interface AdminOrder {
  id: string;
  order_number: string;
  customer_email: string;
  currency: AdminCurrency;
  subtotal: number;
  shipping_total: number;
  tax_total: number;
  total: number;
  payment_status: string;
  fulfillment_status: string;
  payment_gateway: string | null;
  payment_reference: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
  internal_notes: string | null;
  tracking_carrier: string | null;
  tracking_number: string | null;
  customers: { id: string; email: string; first_name: string | null; last_name: string | null; phone: string | null } | null;
  shipping_address: { street: string; city: string; state: string; country: string; postal_code: string | null } | null;
  billing_address: { street: string; city: string; state: string; country: string; postal_code: string | null } | null;
  order_items: Array<{
    id: string;
    quantity: number;
    unit_price: number;
    line_total: number;
    product_snapshot: {
      name: string;
      slug: string;
      primary_image: string | null;
      options?: Array<{ name: string; value: string }>;
    };
  }>;
  order_events: Array<{ id: string; event_type: string; metadata: any; created_at: string }>;
}

export const dynamic = "force-dynamic";

async function fetchOrder(id: string): Promise<AdminOrder | null> {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
  const cookieHeader = cookies().getAll().map((c) => `${c.name}=${c.value}`).join("; ");
  try {
    const res = await fetch(`${base}/api/admin/orders/${id}`, {
      headers: cookieHeader ? { cookie: cookieHeader } : undefined,
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { data: AdminOrder };
    return json.data;
  } catch {
    return null;
  }
}

export default async function OrderDetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const order = await fetchOrder(id);
  if (!order) {
    return <p className="text-sm text-stone">Order not found.</p>;
  }
  const c = order.customers;
  const ship = order.shipping_address;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main column */}
      <div className="lg:col-span-2 space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-stone">Order</p>
            <h2 className="font-serif text-2xl text-ink">{order.order_number}</h2>
            <p className="text-xs text-stone mt-1">{new Date(order.created_at).toLocaleString()}</p>
          </div>
          <div className="flex items-center gap-2">
            <StatusPill label={order.payment_status} tone={ORDER_PAYMENT_TONE[order.payment_status] ?? "neutral"} />
            <StatusPill
              label={order.fulfillment_status}
              tone={ORDER_FULFILLMENT_TONE[order.fulfillment_status] ?? "neutral"}
            />
          </div>
        </header>

        {/* Action bar */}
        <OrderActionsBar order={order} />

        {/* Items */}
        <section className="border border-line bg-ivory">
          <header className="px-4 py-3 border-b border-line">
            <span className="text-[11px] uppercase tracking-[0.18em] text-stone">Items</span>
          </header>
          <ul>
            {order.order_items.map((it) => (
              <li key={it.id} className="grid grid-cols-12 gap-3 items-center px-4 py-3 border-b border-line last:border-0">
                <div className="col-span-2 sm:col-span-1">
                  {it.product_snapshot.primary_image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={it.product_snapshot.primary_image}
                      alt=""
                      className="h-12 w-12 object-cover border border-line"
                    />
                  ) : (
                    <div className="h-12 w-12 border border-line" />
                  )}
                </div>
                <div className="col-span-10 sm:col-span-6">
                  <p className="text-sm text-ink">{it.product_snapshot.name}</p>
                  {it.product_snapshot.options && it.product_snapshot.options.length > 0 ? (
                    <p className="text-[11px] uppercase tracking-[0.18em] text-stone">
                      {it.product_snapshot.options.map((o) => `${o.name}: ${o.value}`).join(" · ")}
                    </p>
                  ) : null}
                </div>
                <div className="col-span-6 sm:col-span-2 text-right text-sm tabular-nums">{it.quantity}</div>
                <div className="col-span-6 sm:col-span-3 text-right text-sm tabular-nums">
                  <CurrencyCell amount={it.line_total} currency={order.currency} />
                </div>
              </li>
            ))}
          </ul>
          <div className="px-4 py-3 border-t border-line space-y-1.5 text-sm">
            <Row label="Subtotal" amount={order.subtotal} currency={order.currency} />
            <Row label="Shipping" amount={order.shipping_total} currency={order.currency} />
            <Row label="Tax" amount={order.tax_total} currency={order.currency} />
            <div className="pt-2 mt-2 border-t border-line flex items-center justify-between">
              <span className="text-ink font-medium">Total</span>
              <CurrencyCell amount={order.total} currency={order.currency} className="text-ink font-medium" />
            </div>
          </div>
        </section>

        {/* Payment timeline */}
        <section className="border border-line bg-ivory">
          <header className="px-4 py-3 border-b border-line">
            <span className="text-[11px] uppercase tracking-[0.18em] text-stone">Payment timeline</span>
          </header>
          <ol>
            {order.order_events
              .filter((e) => ["paid", "refunded", "dispute_opened"].includes(e.event_type))
              .map((e) => (
                <li key={e.id} className="px-4 py-2 border-b border-line last:border-0 text-xs">
                  <span className="text-stone uppercase tracking-[0.18em]">{e.event_type}</span>
                  <span className="ml-3 text-ink">{new Date(e.created_at).toLocaleString()}</span>
                </li>
              ))}
          </ol>
        </section>

        {/* Internal note */}
        <InternalNoteForm orderId={order.id} initial={order.internal_notes ?? ""} />
      </div>

      {/* Side column */}
      <aside className="space-y-6">
        <section className="border border-line bg-ivory p-4">
          <p className="text-[11px] uppercase tracking-[0.18em] text-stone mb-2">Customer</p>
          {c ? (
            <>
              <p className="text-sm text-ink">
                {c.first_name} {c.last_name}
              </p>
              <p className="text-xs text-stone">{c.email}</p>
              {c.phone ? <p className="text-xs text-stone">{c.phone}</p> : null}
            </>
          ) : (
            <p className="text-sm text-stone">{order.customer_email}</p>
          )}
        </section>

        <section className="border border-line bg-ivory p-4">
          <p className="text-[11px] uppercase tracking-[0.18em] text-stone mb-2">Shipping</p>
          {ship ? (
            <p className="text-sm text-ink leading-relaxed">
              {ship.street}<br />
              {ship.city}, {ship.state}{ship.postal_code ? ` ${ship.postal_code}` : ""}<br />
              {ship.country}
            </p>
          ) : (
            <p className="text-sm text-stone">—</p>
          )}
        </section>

        <section className="border border-line bg-ivory p-4 space-y-2">
          <p className="text-[11px] uppercase tracking-[0.18em] text-stone">Payment</p>
          <div className="flex items-center justify-between text-xs">
            <span className="text-stone">Gateway</span>
            <span className="text-ink uppercase tracking-[0.18em]">{order.payment_gateway ?? "—"}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-stone">Reference</span>
            <span className="text-ink truncate max-w-[180px]" title={order.payment_reference ?? ""}>
              {order.payment_reference ?? "—"}
            </span>
          </div>
          {order.tracking_carrier || order.tracking_number ? (
            <>
              <div className="pt-2 mt-2 border-t border-line" />
              <p className="text-[11px] uppercase tracking-[0.18em] text-stone">Shipment</p>
              <div className="flex items-center justify-between text-xs">
                <span className="text-stone">Carrier</span>
                <span className="text-ink">{order.tracking_carrier ?? "—"}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-stone">Tracking</span>
                <span className="text-ink">{order.tracking_number ?? "—"}</span>
              </div>
            </>
          ) : null}
        </section>

        <Link
          href={`/account/orders/${order.id}`}
          target="_blank"
          className="inline-flex items-center gap-1 text-[11px] uppercase tracking-[0.18em] text-stone hover:text-ink"
        >
          View on site <ExternalLink className="h-3 w-3" />
        </Link>
      </aside>
    </div>
  );
}

function Row({ label, amount, currency }: { label: string; amount: number; currency: AdminCurrency }) {
  return (
    <div className="flex items-center justify-between text-stone">
      <span>{label}</span>
      <span className="tabular-nums">
        <CurrencyCell amount={amount} currency={currency} />
      </span>
    </div>
  );
}
