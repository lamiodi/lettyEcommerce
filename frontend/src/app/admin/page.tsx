/**
 * /admin — dashboard.
 * KPI tiles (revenue today/7d/30d, AOV), live orders stream (last 20
 * paid), low-stock alerts.
 */
import Link from "next/link";
import { cookies } from "next/headers";
import { ArrowUpRight, AlertTriangle, TrendingUp, Clock } from "lucide-react";
import { CurrencyCell, type AdminCurrency } from "@/components/admin/currency-cell";
import { StatusPill } from "@/components/admin/status-pill";

type Currency = AdminCurrency;
const ALL_CURRENCIES: Currency[] = ["USD", "EUR", "GBP", "NGN", "GHS", "ZAR", "KES"];

interface LiveOrder {
  id: string;
  order_number: string;
  customer_email: string;
  total: number;
  currency: Currency;
  fulfillment_status: string;
  created_at: string;
}

interface LowStock {
  id: string;
  sku: string;
  name: string;
  slug: string;
  primary_image: string | null;
  available: number;
  threshold: number;
  price: number;
  currency: Currency;
}

interface DashboardData {
  revenue: { today: Record<string, number>; d7: Record<string, number>; d30: Record<string, number> };
  orderCount: { today: Record<string, number>; d7: Record<string, number>; d30: Record<string, number> };
  aov: { d30: Record<string, number> };
  live: LiveOrder[];
  lowStock: LowStock[];
  fetchedAt: string;
}

export const dynamic = "force-dynamic";

async function fetchDashboard(): Promise<DashboardData | null> {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");
  try {
    const res = await fetch(`${base}/api/admin/dashboard`, {
      headers: cookieHeader ? { cookie: cookieHeader } : undefined,
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { data: DashboardData };
    return json.data;
  } catch {
    return null;
  }
}

function rel(iso: string): string {
  const s = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.round(s / 60)}m`;
  if (s < 86400) return `${Math.round(s / 3600)}h`;
  return `${Math.round(s / 86400)}d`;
}

function primaryCurrency(amounts: Record<string, number>): Currency {
  // Pick the currency with the largest revenue in the period.
  let best: Currency = "USD";
  let bestV = -1;
  for (const c of ALL_CURRENCIES) {
    const v = amounts[c] ?? 0;
    if (v > bestV) {
      bestV = v;
      best = c;
    }
  }
  return best;
}

export default async function AdminDashboardPage() {
  const data = await fetchDashboard();
  if (!data) {
    return (
      <div className="p-6 border border-line bg-ivory text-sm text-stone">
        Could not load the dashboard. Try again in a moment.
      </div>
    );
  }
  const today = primaryCurrency(data.revenue.today);
  const d7 = primaryCurrency(data.revenue.d7);
  const d30 = primaryCurrency(data.revenue.d30);

  return (
    <div className="space-y-8">
      {/* KPI tiles */}
      <section>
        <h2 className="text-[11px] uppercase tracking-[0.18em] text-stone mb-4">Today</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiTile
            label="Revenue"
            value={<CurrencyCell amount={data.revenue.today[today]} currency={today} />}
            sub={`${data.orderCount.today[today] ?? 0} orders · ${today}`}
            icon={<TrendingUp className="h-4 w-4" />}
          />
          <KpiTile
            label="Revenue · 7d"
            value={<CurrencyCell amount={data.revenue.d7[d7]} currency={d7} />}
            sub={`${data.orderCount.d7[d7] ?? 0} orders · ${d7}`}
          />
          <KpiTile
            label="Revenue · 30d"
            value={<CurrencyCell amount={data.revenue.d30[d30]} currency={d30} />}
            sub={`${data.orderCount.d30[d30] ?? 0} orders · ${d30}`}
          />
          <KpiTile
            label="AOV · 30d"
            value={<CurrencyCell amount={data.aov.d30[d30]} currency={d30} />}
            sub={`Across ${d30}`}
          />
        </div>
      </section>

      {/* Live orders + low stock */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 border border-line bg-ivory">
          <header className="flex items-center justify-between px-4 py-3 border-b border-line">
            <span className="text-[11px] uppercase tracking-[0.18em] text-stone">Live orders</span>
            <Link href="/admin/orders" className="text-[11px] uppercase tracking-[0.18em] text-stone hover:text-ink">
              View all
            </Link>
          </header>
          {data.live.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-stone">No paid orders yet.</p>
          ) : (
            <ul>
              {data.live.map((o) => (
                <li key={o.id} className="border-b border-line last:border-0">
                  <Link
                    href={`/admin/orders/${o.id}`}
                    className="grid grid-cols-12 items-center gap-3 px-4 py-3 hover:bg-ivory/60 transition"
                  >
                    <div className="col-span-4 sm:col-span-3 text-sm text-ink">{o.order_number}</div>
                    <div className="hidden sm:block col-span-5 text-xs text-stone truncate">
                      {o.customer_email}
                    </div>
                    <div className="col-span-4 sm:col-span-2 text-right text-sm">
                      <CurrencyCell amount={o.total} currency={o.currency} />
                    </div>
                    <div className="col-span-2 sm:col-span-1 flex justify-end">
                      <StatusPill
                        label={o.fulfillment_status}
                        tone={o.fulfillment_status === "fulfilled" ? "positive" : "pending"}
                      />
                    </div>
                    <div className="col-span-2 sm:col-span-1 flex items-center justify-end gap-1 text-[11px] uppercase tracking-[0.18em] text-stone">
                      <Clock className="h-3 w-3" />
                      {rel(o.created_at)}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border border-line bg-ivory">
          <header className="flex items-center justify-between px-4 py-3 border-b border-line">
            <span className="text-[11px] uppercase tracking-[0.18em] text-stone">Low stock</span>
            <Link href="/admin/inventory" className="text-[11px] uppercase tracking-[0.18em] text-stone hover:text-ink">
              Inventory
            </Link>
          </header>
          {data.lowStock.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-stone">All variants are healthy.</p>
          ) : (
            <ul>
              {data.lowStock.map((v) => (
                <li key={v.id} className="border-b border-line last:border-0">
                  <Link
                    href={`/admin/inventory?variant=${v.id}`}
                    className="flex items-start gap-3 px-4 py-3 hover:bg-ivory/60 transition"
                  >
                    {v.primary_image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={v.primary_image} alt="" className="h-10 w-10 object-cover border border-line" />
                    ) : (
                      <div className="h-10 w-10 bg-ivory border border-line" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-ink truncate">{v.name}</p>
                      <p className="text-[11px] uppercase tracking-[0.18em] text-stone">{v.sku}</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-xs text-ink">
                        <AlertTriangle className="h-3 w-3 text-stone" />
                        <span className="tabular-nums">{v.available}</span>
                      </div>
                      <p className="text-[10px] uppercase tracking-[0.18em] text-stone">≤ {v.threshold}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Tip card */}
      <section className="border border-line bg-ivory p-6 flex items-center gap-3">
        <ArrowUpRight className="h-5 w-5 text-stone" />
        <p className="text-sm text-stone">
          Detailed revenue charts and gateway mix are on the{" "}
          <Link href="/admin/analytics" className="text-ink underline underline-offset-2">
            Analytics page
          </Link>
          .
        </p>
      </section>
    </div>
  );
}

function KpiTile({
  label,
  value,
  sub,
  icon,
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="border border-line bg-ivory p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] uppercase tracking-[0.18em] text-stone">{label}</p>
        {icon ? <span className="text-stone">{icon}</span> : null}
      </div>
      <p className="font-serif text-2xl text-ink">{value}</p>
      {sub ? <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-stone">{sub}</p> : null}
    </div>
  );
}
