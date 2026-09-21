import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { cookies } from "next/headers";
import {
  CheckCircle2,
  Package,
  Truck,
  Clock,
  ExternalLink,
  ArrowLeft,
  Mail,
  ShieldCheck,
  Sparkles,
  MapPin,
  FileText,
  Lock,
} from "lucide-react";
import { getBackendUrl } from "@/lib/backend";

interface OrderPageProps {
  params: Promise<{ id: string }>;
}

interface CustomerOrder {
  id: string;
  order_number: string;
  customer_email: string;
  currency: string;
  subtotal: number;
  discount_total: number;
  shipping_total: number;
  tax_total: number;
  total: number;
  payment_status: string;
  fulfillment_status: string;
  created_at: string;
  tracking_carrier?: string | null;
  tracking_number?: string | null;
  shipping_address: {
    first_name: string | null;
    last_name: string | null;
    phone?: string | null;
    street: string;
    city: string;
    state: string | null;
    postal_code: string | null;
    country: string;
  } | null;
  customer: {
    first_name: string | null;
    last_name: string | null;
    phone: string | null;
  } | null;
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
  order_events: Array<{ event_type: string; created_at: string }>;
}

export const dynamic = "force-dynamic";

export async function generateMetadata(props: OrderPageProps): Promise<Metadata> {
  const { id } = await props.params;
  return {
    title: `Order #${id} | LETTY Maison`,
    description: "View and track your LETTY ritual order status and delivery updates.",
    robots: { index: false, follow: false },
  };
}

function getCarrierTrackingUrl(carrier: string | null, trackingNumber: string | null): string | null {
  if (!carrier || !trackingNumber) return null;
  const c = carrier.toLowerCase();
  const num = encodeURIComponent(trackingNumber.trim());
  if (c.includes("royal") || c.includes("rm")) {
    return `https://www.royalmail.com/track-your-item#/tracking-results/${num}`;
  }
  if (c.includes("dpd")) {
    return `https://track.dpd.co.uk/search?parcel=${num}`;
  }
  if (c.includes("dhl")) {
    return `https://www.dhl.com/en/express/tracking.html?AWB=${num}`;
  }
  if (c.includes("fedex")) {
    return `https://www.fedex.com/fedextrack/?trknbr=${num}`;
  }
  if (c.includes("usps")) {
    return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${num}`;
  }
  return null;
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  GBP: "£",
  USD: "$",
  EUR: "€",
  CAD: "CA$",
  NGN: "₦",
  GHS: "GH₵",
  ZAR: "R",
  KES: "KSh",
};

function formatCurrency(amount: number, currencyCode: string): string {
  const symbol = CURRENCY_SYMBOLS[currencyCode] || currencyCode;
  return `${symbol}${Number(amount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Orders contain customer PII, so the page is gated on the customer session
 * cookie (`customer_token`, set by the backend on login). An id alone — even a
 * valid one — never returns order data.
 */
async function fetchOrderForSession(id: string): Promise<CustomerOrder | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("customer_token")?.value;
  if (!token) return null;

  const backend = getBackendUrl();
  const res = await fetch(
    `${backend}/api/customer/orders?order_id=${encodeURIComponent(id)}`,
    {
      headers: { cookie: `customer_token=${token}` },
      cache: "no-store",
    },
  ).catch(() => null);
  if (!res || !res.ok) return null;

  const json = (await res.json().catch(() => null)) as { data?: CustomerOrder } | null;
  return json?.data ?? null;
}

export default async function CustomerOrderDetailPage(props: OrderPageProps) {
  const { id } = await props.params;
  const order = await fetchOrderForSession(id);

  if (!order) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center md:py-24">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-secondary text-stone">
          {id ? <Lock className="h-8 w-8" /> : <FileText className="h-8 w-8" />}
        </div>
        <p className="mt-6 text-[10px] font-semibold uppercase tracking-[0.25em] text-gold">
          Order Verification
        </p>
        <h1 className="mt-2 font-serif text-3xl font-medium text-ink md:text-4xl">
          Sign In To View Your Order
        </h1>
        <p className="mt-3 text-xs sm:text-sm text-stone max-w-md mx-auto leading-relaxed">
          For your privacy, order details are only available to signed-in clients. Please
          access the client portal to view order <span className="font-mono text-ink font-medium">&ldquo;{id}&rdquo;</span>.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/login"
            className="inline-flex h-11 items-center rounded-md bg-ink px-6 text-xs font-semibold uppercase tracking-luxe text-ivory transition hover:bg-ink/90"
          >
            Access Client Portal
          </Link>
          <Link
            href="/shop"
            className="inline-flex h-11 items-center rounded-md border border-line bg-card px-6 text-xs font-semibold uppercase tracking-luxe text-ink transition hover:bg-secondary"
          >
            Return to Boutique
          </Link>
        </div>

        <div className="mt-12 border-t border-line pt-8 text-center text-xs text-stone">
          <p>Need concierge assistance? Email us at{" "}
            <a href="mailto:lettybeautyco@gmail.com" className="font-medium text-ink underline">
              lettybeautyco@gmail.com
            </a>{" "}
            or WhatsApp{" "}
            <a href="https://wa.me/447311564331" target="_blank" rel="noopener noreferrer" className="font-medium text-ink underline">
              +44 7311 564331
            </a>
          </p>
        </div>
      </div>
    );
  }

  const trackingUrl = getCarrierTrackingUrl(order.tracking_carrier ?? null, order.tracking_number ?? null);
  const isPaid = order.payment_status === "paid";
  const hasEvent = (type: string) => order.order_events?.some((e) => e.event_type === type);
  const isFulfilled = order.fulfillment_status === "fulfilled" || hasEvent("delivered");
  const isShipped = Boolean(order.tracking_number) || hasEvent("shipped") || isFulfilled;
  const isProcessing = order.fulfillment_status === "partially_fulfilled" || hasEvent("packed") || isShipped;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 md:px-8 md:py-16">
      {/* Top back navigation & print action */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
        <Link
          href="/shop"
          className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-luxe text-stone hover:text-ink transition"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Boutique</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-xs font-medium uppercase tracking-luxe text-stone hover:text-ink transition"
          >
            Client Portal
          </Link>
        </div>
      </div>

      {/* Main Order Header */}
      <div className="border border-line bg-card p-6 sm:p-10 shadow-subtle mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-line pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-gold">
                Maison LETTY
              </span>
              <span className="text-stone">·</span>
              <span className="text-[10px] uppercase tracking-wider text-stone">Official Receipt</span>
            </div>
            <h1 className="mt-1 font-serif text-2xl sm:text-3xl font-medium text-ink">
              Order {order.order_number}
            </h1>
            <p className="mt-1 text-xs text-stone">
              Placed on {new Date(order.created_at).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:self-start">
            <span
              className={`inline-flex items-center px-3 py-1 text-[11px] font-semibold uppercase tracking-wider rounded-full ${
                isPaid
                  ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-600/20"
                  : "bg-amber-50 text-amber-800 ring-1 ring-amber-600/20"
              }`}
            >
              {isPaid ? "Payment Confirmed" : "Payment Pending"}
            </span>
            <span className="inline-flex items-center px-3 py-1 text-[11px] font-semibold uppercase tracking-wider rounded-full bg-secondary text-stone ring-1 ring-line">
              {order.fulfillment_status.replace(/_/g, " ").toUpperCase()}
            </span>
          </div>
        </div>

        {/* Live Tracking Progress Bar */}
        <div className="py-8 border-b border-line">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-stone mb-6">
            Ritual Progress &amp; Fulfillment
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-2">
            {/* Step 1: Placed */}
            <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-ivory mb-2">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <span className="text-xs font-semibold text-ink">Order Placed</span>
              <span className="text-[10px] text-stone">Payment Authorised</span>
            </div>

            {/* Step 2: Atelier Preparation */}
            <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full mb-2 ${
                  isProcessing ? "bg-ink text-ivory" : "bg-secondary text-stone"
                }`}
              >
                {isProcessing ? <CheckCircle2 className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
              </div>
              <span className={`text-xs font-semibold ${isProcessing ? "text-ink" : "text-stone"}`}>
                Atelier Assembly
              </span>
              <span className="text-[10px] text-stone">Signature Packaging</span>
            </div>

            {/* Step 3: Dispatched */}
            <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full mb-2 ${
                  isShipped ? "bg-ink text-ivory" : "bg-secondary text-stone"
                }`}
              >
                {isShipped ? <CheckCircle2 className="h-4 w-4" /> : <Truck className="h-4 w-4" />}
              </div>
              <span className={`text-xs font-semibold ${isShipped ? "text-ink" : "text-stone"}`}>
                Dispatched
              </span>
              <span className="text-[10px] text-stone">
                {order.tracking_carrier ? order.tracking_carrier : "Royal Mail 48 / DPD"}
              </span>
            </div>

            {/* Step 4: Delivered */}
            <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full mb-2 ${
                  isFulfilled ? "bg-emerald-800 text-ivory" : "bg-secondary text-stone"
                }`}
              >
                <Package className="h-4 w-4" />
              </div>
              <span className={`text-xs font-semibold ${isFulfilled ? "text-emerald-800" : "text-stone"}`}>
                Delivered
              </span>
              <span className="text-[10px] text-stone">Direct to Client</span>
            </div>
          </div>

          {/* Tracking Carrier Card if dispatched */}
          {order.tracking_number && (
            <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-lg border border-gold/30 bg-gold/5 p-4">
              <div className="flex items-center gap-3">
                <Truck className="h-5 w-5 text-gold shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-ink">
                    Package Tracking Number: <span className="font-mono">{order.tracking_number}</span>
                  </p>
                  <p className="text-[11px] text-stone">
                    Carrier: {order.tracking_carrier || "Express Tracked Delivery"}
                  </p>
                </div>
              </div>
              {trackingUrl ? (
                <a
                  href={trackingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded bg-ink px-3.5 py-1.5 text-xs font-semibold text-ivory uppercase tracking-luxe hover:bg-gold hover:text-ink transition shrink-0"
                >
                  Track on {order.tracking_carrier || "Carrier"} <ExternalLink className="h-3.5 w-3.5" />
                </a>
              ) : null}
            </div>
          )}
        </div>

        {/* Items List */}
        <div className="py-6 border-b border-line">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-stone mb-4">
            Curated Selection ({order.order_items.length} {order.order_items.length === 1 ? "Item" : "Items"})
          </p>

          <div className="divide-y divide-line">
            {order.order_items.map((item) => {
              const snapshot = item.product_snapshot;
              const shadeOpt = snapshot.options?.find((o) => o.name.toLowerCase().includes("shade"))?.value;
              const imageUrl = snapshot.primary_image || "/products/lip-liner/01-cafe-creme/IMG_6625_clean.jpg";

              return (
                <div key={item.id} className="flex items-center justify-between gap-4 py-4">
                  <div className="flex items-center gap-4">
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md border border-line bg-secondary">
                      <Image
                        src={imageUrl}
                        alt={snapshot.name}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <Link
                        href={`/products/${snapshot.slug}`}
                        className="text-xs sm:text-sm font-serif font-medium text-ink hover:text-gold transition"
                      >
                        {snapshot.name}
                      </Link>
                      {shadeOpt && (
                        <p className="text-[11px] text-stone mt-0.5">Shade: {shadeOpt}</p>
                      )}
                      <p className="text-[11px] text-stone mt-0.5">Quantity: {item.quantity}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-xs sm:text-sm font-semibold text-ink">
                      {formatCurrency(item.line_total, order.currency)}
                    </p>
                    {item.quantity > 1 && (
                      <p className="text-[10px] text-stone">
                        {formatCurrency(item.unit_price, order.currency)} each
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Summary Grid: Delivery Address & Totals */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="h-3.5 w-3.5 text-gold" />
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-stone">
                Delivery Address
              </p>
            </div>
            {order.shipping_address ? (
              <div className="text-xs text-stone space-y-0.5">
                <p className="font-medium text-ink">
                  {order.shipping_address.first_name || order.customer?.first_name || ""}{" "}
                  {order.shipping_address.last_name || order.customer?.last_name || ""}
                </p>
                <p>{order.shipping_address.street}</p>
                <p>
                  {order.shipping_address.city}
                  {order.shipping_address.state ? `, ${order.shipping_address.state}` : ""}
                  {order.shipping_address.postal_code ? ` ${order.shipping_address.postal_code}` : ""}
                </p>
                <p>{order.shipping_address.country}</p>
                {(order.shipping_address.phone || order.customer?.phone) && (
                  <p className="mt-1 text-[11px]">
                    Tel: {order.shipping_address.phone || order.customer?.phone}
                  </p>
                )}
                <p className="text-[11px] text-stone/80 mt-1">Recipient: {order.customer_email}</p>
              </div>
            ) : (
              <p className="text-xs text-stone">Address on file with payment issuer.</p>
            )}
          </div>

          <div className="space-y-2 text-xs">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-stone mb-2">
              Financial Breakdown
            </p>
            <div className="flex justify-between text-stone">
              <span>Subtotal</span>
              <span>{formatCurrency(order.subtotal, order.currency)}</span>
            </div>
            {Number(order.discount_total) > 0 && (
              <div className="flex justify-between text-emerald-800">
                <span>Savings</span>
                <span>−{formatCurrency(order.discount_total, order.currency)}</span>
              </div>
            )}
            <div className="flex justify-between text-stone">
              <span>Complimentary / Tracked Delivery</span>
              <span>
                {Number(order.shipping_total) === 0 ? "Complimentary" : formatCurrency(order.shipping_total, order.currency)}
              </span>
            </div>
            {Number(order.tax_total) > 0 && (
              <div className="flex justify-between text-stone">
                <span>Estimated Tax (Included)</span>
                <span>{formatCurrency(order.tax_total, order.currency)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-line pt-2 text-sm font-semibold text-ink">
              <span>Grand Total</span>
              <span className="font-serif text-base">{formatCurrency(order.total, order.currency)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Concierge & Reassurance Footer */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
        <div className="border border-line bg-card p-4 rounded-lg">
          <ShieldCheck className="mx-auto h-5 w-5 text-gold mb-2" />
          <p className="text-xs font-semibold text-ink">Authentic Formulations</p>
          <p className="text-[11px] text-stone mt-1">Direct from the Maison atelier</p>
        </div>
        <div className="border border-line bg-card p-4 rounded-lg">
          <Mail className="mx-auto h-5 w-5 text-gold mb-2" />
          <p className="text-xs font-semibold text-ink">Client Care Concierge</p>
          <a href="mailto:lettybeautyco@gmail.com" className="text-[11px] text-stone underline hover:text-ink mt-1 block">
            lettybeautyco@gmail.com
          </a>
        </div>
        <div className="border border-line bg-card p-4 rounded-lg">
          <Sparkles className="mx-auto h-5 w-5 text-gold mb-2" />
          <p className="text-xs font-semibold text-ink">Private Consultations</p>
          <a href="https://wa.me/447311564331" target="_blank" rel="noopener noreferrer" className="text-[11px] text-stone underline hover:text-ink mt-1 block">
            WhatsApp Concierge Line
          </a>
        </div>
      </div>
    </div>
  );
}
