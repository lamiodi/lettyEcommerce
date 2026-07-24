/**
 * /admin/customers/[id] — full customer detail. Sections: profile,
 * addresses, orders, wishlist, reviews. No editing in v1.
 */
import Link from "next/link";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { ArrowLeft, Star } from "lucide-react";
import { CurrencyCell, type AdminCurrency } from "@/components/admin/currency-cell";
import { StatusPill, ORDER_PAYMENT_TONE, ORDER_FULFILLMENT_TONE } from "@/components/admin/status-pill";

interface Address {
  id: string;
  type: string;
  full_name: string;
  phone: string | null;
  street: string;
  city: string;
  state: string;
  country: string;
  postal_code: string | null;
  is_default: boolean;
}
interface Order {
  id: string;
  order_number: string;
  total: number;
  currency: AdminCurrency;
  payment_status: string;
  fulfillment_status: string;
  created_at: string;
}
interface Wishlist {
  id: string;
  product_id: string;
  created_at: string;
  product: { id: string; name: string; slug: string } | null;
}
interface Review {
  id: string;
  product_id: string;
  rating: number;
  title: string | null;
  body: string | null;
  is_approved: boolean;
  created_at: string;
  product: { id: string; name: string; slug: string } | null;
}
interface Customer {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  marketing_opt_in: boolean;
  loyalty_points: number;
  total_spent_ngn: number;
  total_spent_usd: number;
  last_order_at: string | null;
  created_at: string;
  orders: Order[];
  addresses: Address[];
  wishlist: Wishlist[];
  reviews: Review[];
}

export const dynamic = "force-dynamic";

async function fetchCustomer(id: string): Promise<Customer | null> {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
  const cookieHeader = cookies().getAll().map((c) => `${c.name}=${c.value}`).join("; ");
  try {
    const res = await fetch(`${base}/api/admin/customers/${id}`, {
      headers: cookieHeader ? { cookie: cookieHeader } : undefined,
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { data: Customer };
    return json.data;
  } catch {
    return null;
  }
}

export default async function CustomerDetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const c = await fetchCustomer(id);
  if (!c) notFound();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <header>
          <Link
            href="/admin/customers"
            className="inline-flex items-center gap-1 text-[11px] uppercase tracking-[0.18em] text-stone hover:text-ink"
          >
            <ArrowLeft className="h-3 w-3" />
            Back to customers
          </Link>
          <h2 className="font-serif text-2xl text-ink mt-2">
            {c.first_name ?? ""} {c.last_name ?? ""}
          </h2>
          <p className="text-xs text-stone mt-1">
            {c.email} · joined {new Date(c.created_at).toLocaleDateString()}
          </p>
        </header>

        <Section title="Orders">
          {c.orders.length === 0 ? (
            <p className="text-sm text-stone">No orders yet.</p>
          ) : (
            <ul>
              {c.orders.map((o) => (
                <li key={o.id} className="border-b border-line last:border-0 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
                  <Link href={`/admin/orders/${o.id}`} className="text-ink hover:underline underline-offset-2 font-mono text-xs">
                    {o.order_number}
                  </Link>
                  <span className="text-xs text-stone">
                    {new Date(o.created_at).toLocaleDateString()}
                  </span>
                  <div className="flex items-center gap-2">
                    <StatusPill label={o.payment_status} tone={ORDER_PAYMENT_TONE[o.payment_status] ?? "neutral"} />
                    <StatusPill label={o.fulfillment_status} tone={ORDER_FULFILLMENT_TONE[o.fulfillment_status] ?? "neutral"} />
                  </div>
                  <CurrencyCell amount={o.total} currency={o.currency} className="text-sm" />
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title="Wishlist">
          {c.wishlist.length === 0 ? (
            <p className="text-sm text-stone">No items saved.</p>
          ) : (
            <ul>
              {c.wishlist.map((w) => (
                <li key={w.id} className="border-b border-line last:border-0 px-4 py-2.5 text-sm">
                  <Link
                    href={`/admin/products/${w.product_id}`}
                    className="text-ink hover:underline underline-offset-2"
                  >
                    {w.product?.name ?? "—"}
                  </Link>
                  <span className="ml-2 text-[11px] uppercase tracking-[0.18em] text-stone">
                    {new Date(w.created_at).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title="Reviews">
          {c.reviews.length === 0 ? (
            <p className="text-sm text-stone">No reviews.</p>
          ) : (
            <ul>
              {c.reviews.map((r) => (
                <li key={r.id} className="border-b border-line last:border-0 px-4 py-3 space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star
                          key={i}
                          className={`h-3 w-3 ${i <= r.rating ? "text-gold fill-gold" : "text-stone/30"}`}
                        />
                      ))}
                    </div>
                    <Link
                      href={`/admin/products/${r.product_id}`}
                      className="text-ink hover:underline underline-offset-2 text-sm"
                    >
                      {r.product?.name ?? "—"}
                    </Link>
                    {r.is_approved ? (
                      <StatusPill label="approved" tone="positive" />
                    ) : (
                      <StatusPill label="pending" tone="pending" />
                    )}
                  </div>
                  {r.title ? <p className="text-sm text-ink">{r.title}</p> : null}
                  {r.body ? <p className="text-xs text-stone leading-relaxed">{r.body}</p> : null}
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>

      <aside className="space-y-6">
        <Section title="Contact">
          <p className="text-sm text-ink">{c.email}</p>
          {c.phone ? <p className="text-xs text-stone mt-1">{c.phone}</p> : null}
          <p className="text-[11px] uppercase tracking-[0.18em] text-stone mt-3">
            Marketing opt-in: {c.marketing_opt_in ? "Yes" : "No"}
          </p>
        </Section>

        <Section title="Lifetime value">
          <CurrencyCell amount={c.total_spent_usd} currency={"USD" as AdminCurrency} className="text-xl" />
          <p className="text-[11px] uppercase tracking-[0.18em] text-stone mt-1">USD</p>
          <div className="mt-3">
            <CurrencyCell amount={c.total_spent_ngn} currency={"NGN" as AdminCurrency} className="text-sm" />
            <p className="text-[11px] uppercase tracking-[0.18em] text-stone mt-1">NGN</p>
          </div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-stone mt-3">
            Loyalty points: {c.loyalty_points}
          </p>
        </Section>

        <Section title="Addresses">
          {c.addresses.length === 0 ? (
            <p className="text-sm text-stone">No saved addresses.</p>
          ) : (
            <ul className="space-y-3">
              {c.addresses.map((a) => (
                <li key={a.id} className="text-sm">
                  <p className="text-ink">
                    {a.full_name}
                    {a.is_default ? (
                      <span className="ml-2 text-[10px] uppercase tracking-[0.18em] text-stone">default</span>
                    ) : null}
                  </p>
                  <p className="text-xs text-stone leading-relaxed">
                    {a.street}<br />
                    {a.city}, {a.state}{a.postal_code ? ` ${a.postal_code}` : ""}<br />
                    {a.country}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </aside>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border border-line bg-ivory">
      <header className="px-4 py-3 border-b border-line">
        <span className="text-[11px] uppercase tracking-[0.18em] text-stone">{title}</span>
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}
