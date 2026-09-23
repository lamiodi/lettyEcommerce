"use client";

/**
 * Guest order tracking — /account/orders
 *
 * Email CTAs (delivered, refund, payment-retry) link here because order
 * emails are often opened by guests on a device they never signed in on.
 * Backed by the backend's rate-limited lookup endpoint: email + order
 * number is the access token, so no PII is exposed by the page itself.
 *
 * Pre-fills from ?order=…&email=… query params (what the emails send).
 */
import { Suspense, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Package, Search, ShieldCheck, Loader2 } from "lucide-react";

interface LookupOrder {
  id: string;
  order_number: string;
  currency: string;
  subtotal: number;
  shipping_total: number;
  tax_total: number;
  total: number;
  payment_status: string;
  fulfillment_status: string;
  created_at: string;
  order_items: Array<{
    id: string;
    quantity: number;
    unit_price: number;
    line_total: number;
    product_snapshot: {
      name: string;
      slug: string;
      options?: Array<{ name: string; value: string }>;
      primary_image?: string | null;
    };
  }>;
  tracking_carrier?: string | null;
  tracking_number?: string | null;
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  GBP: "£", USD: "$", EUR: "€", CAD: "CA$", NGN: "₦", GHS: "GH₵", ZAR: "R", KES: "KSh",
};

function fmt(amount: number, currency: string) {
  const symbol = CURRENCY_SYMBOLS[currency] ?? currency;
  return `${symbol}${Number(amount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function TrackOrderForm() {
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<LookupOrder | null>(null);
  const [searched, setSearched] = useState(false);

  // Pre-fill from email links: /account/orders?order=LTY-…&email=…%40…
  useEffect(() => {
    const o = params.get("order") ?? params.get("order_number");
    const e = params.get("email");
    if (o) setOrderNumber(o.toUpperCase());
    if (e) setEmail(e);
    if (o && e) void lookup(o, e);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  async function lookup(orderNum?: string, mail?: string) {
    const num = (orderNum ?? orderNumber).trim().toUpperCase();
    const mailValue = (mail ?? email).trim();
    if (!num || !mailValue) {
      setError("Enter both your email address and order number.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/customer/orders/lookup?email=${encodeURIComponent(mailValue)}&order_number=${encodeURIComponent(num)}`,
        { cache: "no-store" },
      );
      const json = (await res.json().catch(() => ({}))) as { data?: LookupOrder; error?: string };
      if (!res.ok || !json.data) {
        setOrder(null);
        setError(json.error ?? "We could not find that order. Check the number and email and try again.");
      } else {
        setOrder(json.data);
      }
    } catch {
      setError("Something went wrong. Please try again in a moment.");
    } finally {
      setLoading(false);
      setSearched(true);
    }
  }

  const isPaid = order?.payment_status === "paid";

  return (
    <div className="mx-auto max-w-2xl px-4 py-14 md:py-20">
      <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-gold text-center">
        Order Tracking
      </p>
      <h1 className="mt-2 text-center font-serif text-3xl font-medium text-ink md:text-4xl">
        Track Your Order
      </h1>
      <p className="mt-3 text-center text-sm text-stone">
        Enter the email you ordered with and the order number from your confirmation.
      </p>

      <form
        className="mx-auto mt-8 grid max-w-md grid-cols-1 gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          void lookup();
        }}
      >
        <input
          type="email"
          required
          autoComplete="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-12 w-full rounded-[2px] border border-stone/20 bg-white px-3.5 text-sm text-ink placeholder:text-stone/40 focus:border-ink focus:outline-none"
        />
        <input
          required
          placeholder="Order number (e.g. L0328159)"
          value={orderNumber}
          onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
          className="h-12 w-full rounded-[2px] border border-stone/20 bg-white px-3.5 font-mono text-sm text-ink placeholder:text-stone/40 focus:border-ink focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading}
          className="h-12 rounded-[2px] bg-ink text-xs font-medium uppercase tracking-[0.22em] text-ivory transition hover:bg-stone disabled:opacity-50 inline-flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
          Find my order
        </button>
      </form>

      {error && (
        <p role="alert" className="mx-auto mt-5 max-w-md rounded-[2px] border border-red-300 bg-red-50 p-3.5 text-center text-xs font-medium text-red-800">
          {error}
        </p>
      )}

      {order && (
        <div className="mx-auto mt-10 max-w-xl border border-line bg-card p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.25em] text-gold">Maison LETTY</p>
              <p className="mt-1 font-serif text-xl font-medium text-ink">{order.order_number}</p>
            </div>
            <div className="flex gap-2">
              <span className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider ring-1 ${
                isPaid ? "bg-emerald-50 text-emerald-800 ring-emerald-600/20" : "bg-amber-50 text-amber-800 ring-amber-600/20"
              }`}>
                {isPaid ? "Paid" : order.payment_status.replace(/_/g, " ")}
              </span>
              <span className="rounded-full bg-secondary px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-stone ring-1 ring-line">
                {(order.tracking_number ? "Shipped" : order.fulfillment_status.replace(/_/g, " "))}
              </span>
            </div>
          </div>

          <ul className="divide-y divide-line">
            {order.order_items.map((item) => (
              <li key={item.id} className="flex items-center gap-4 py-4">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md border border-line bg-secondary">
                  {item.product_snapshot.primary_image ? (
                    <Image
                      src={item.product_snapshot.primary_image}
                      alt={item.product_snapshot.name}
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  ) : (
                    <Package className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 text-stone" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">{item.product_snapshot.name}</p>
                  <p className="mt-0.5 text-[11px] text-stone">
                    {item.product_snapshot.options?.map((o) => o.value).join(" · ")} · Qty {item.quantity}
                  </p>
                </div>
                <span className="text-sm font-medium text-ink">{fmt(item.line_total, order.currency)}</span>
              </li>
            ))}
          </ul>

          <dl className="space-y-1.5 border-t border-line pt-4 text-xs text-stone">
            <div className="flex justify-between"><span>Subtotal</span><span>{fmt(order.subtotal, order.currency)}</span></div>
            <div className="flex justify-between"><span>Delivery</span><span>{Number(order.shipping_total) === 0 ? "Complimentary" : fmt(order.shipping_total, order.currency)}</span></div>
            <div className="flex justify-between border-t border-line pt-2 text-sm font-semibold text-ink">
              <span>Total</span><span className="font-serif text-base">{fmt(order.total, order.currency)}</span>
            </div>
          </dl>

          {order.tracking_number && (
            <p className="mt-4 rounded-md border border-gold/30 bg-gold/5 p-3 text-[11px] text-stone">
              Carrier: {order.tracking_carrier ?? "Express Tracked"} · Tracking{" "}
              <span className="font-mono text-ink">{order.tracking_number}</span>
            </p>
          )}
        </div>
      )}

      {searched && !order && !error ? null : null}

      <div className="mt-12 border-t border-line pt-8 text-center">
        <p className="inline-flex items-center gap-2 text-xs text-stone">
          <ShieldCheck className="h-3.5 w-3.5 text-gold" />
          Signed-in clients can see full history in the{" "}
          <Link href="/account" className="font-medium text-ink underline">client portal</Link>.
        </p>
      </div>
    </div>
  );
}

export default function GuestOrderTrackingPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-2xl px-4 py-24 text-center text-sm text-stone">Loading…</div>}>
      <TrackOrderForm />
    </Suspense>
  );
}
