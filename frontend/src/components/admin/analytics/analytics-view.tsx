"use client";

/**
 * AnalyticsView — top products, gateway mix, currency mix, fulfillment
 * mix. Renders simple bar visualizations using only Tailwind classes
 * (no charting library).
 */
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CurrencyCell, type AdminCurrency } from "@/components/admin/currency-cell";
import { fetchAnalyticsAction } from "@/lib/actions/admin-analytics";

interface AnalyticsPayload {
  range: string;
  days: number;
  revenueByDay: Array<Record<string, number | string>>;
  topProducts: Array<{ product_id: string; name: string; slug: string; quantity: number; revenue: Record<string, number> }>;
  gatewayMix: { stripe: { count: number; byCurrency: Record<string, number> }; paystack: { count: number; byCurrency: Record<string, number> } };
  currencyMix: Record<string, number>;
  fulfillmentMix: Record<string, number>;
}

const CURRENCIES: AdminCurrency[] = ["USD", "EUR", "GBP", "NGN", "GHS", "ZAR", "KES"];

export function AnalyticsView({ initialRange, initialData }: { initialRange: string; initialData: AnalyticsPayload | null }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [data, setData] = useState<AnalyticsPayload | null>(initialData);
  const [range, setRange] = useState<string>(initialRange);

  function switchRange(next: "7d" | "30d" | "90d") {
    setRange(next);
    startTransition(async () => {
      const res = await fetchAnalyticsAction(next);
      if (res.data) setData(res.data);
      router.replace(`/admin/analytics?range=${next}`);
    });
  }

  if (!data) {
    return <p className="text-sm text-stone">No data available.</p>;
  }

  const totalOrders = Object.values(data.currencyMix).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-2xl text-ink">Analytics</h2>
        <div className="inline-flex items-center border border-line">
          {(["7d", "30d", "90d"] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => switchRange(r)}
              disabled={pending}
              className={`h-8 px-4 text-[11px] uppercase tracking-[0.18em] ${
                range === r ? "bg-ink text-ivory" : "text-stone hover:text-ink"
              } disabled:opacity-60`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Section title="Top products">
          {data.topProducts.length === 0 ? (
            <p className="text-sm text-stone">No sales in this period.</p>
          ) : (
            <ul>
              {data.topProducts.map((p, i) => (
                <li key={p.product_id} className="border-b border-line last:border-0 px-4 py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-mono text-xs text-stone w-6">{i + 1}.</span>
                    <Link
                      href={`/admin/products/${p.product_id}`}
                      className="text-ink hover:underline underline-offset-2 truncate"
                    >
                      {p.name}
                    </Link>
                  </div>
                  <div className="flex items-center gap-3 text-right">
                    <span className="text-xs text-stone tabular-nums">×{p.quantity}</span>
                    {Object.entries(p.revenue).filter(([, v]) => v > 0).map(([c, v]) => (
                      <CurrencyCell key={c} amount={v} currency={c as AdminCurrency} className="text-sm" />
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title="Gateway mix">
          {(["stripe", "paystack"] as const).map((gw) => {
            const slot = data.gatewayMix[gw];
            const total = slot.byCurrency
              ? Object.values(slot.byCurrency).reduce((a, b) => a + b, 0)
              : 0;
            const pct = totalOrders > 0 ? (slot.count / totalOrders) * 100 : 0;
            return (
              <div key={gw} className="border-b border-line last:border-0 px-4 py-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-ink capitalize">{gw}</p>
                  <p className="text-xs text-stone tabular-nums">
                    {slot.count} orders · {pct.toFixed(1)}%
                  </p>
                </div>
                <div className="mt-2 h-1 bg-ivory border border-line">
                  <div className="h-full bg-ink" style={{ width: `${pct}%` }} />
                </div>
                <div className="mt-2 grid grid-cols-7 gap-2 text-[10px]">
                  {CURRENCIES.map((c) => (
                    <div key={c}>
                      <p className="text-stone">{c}</p>
                      <CurrencyCell amount={slot.byCurrency?.[c] ?? 0} currency={c} className="text-xs" />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </Section>

        <Section title="Currency mix">
          <ul>
            {CURRENCIES.map((c) => {
              const n = data.currencyMix[c] ?? 0;
              const pct = totalOrders > 0 ? (n / totalOrders) * 100 : 0;
              return (
                <li key={c} className="border-b border-line last:border-0 px-4 py-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-ink">{c}</span>
                    <span className="text-stone tabular-nums">
                      {n} · {pct.toFixed(1)}%
                    </span>
                  </div>
                  <div className="mt-1 h-1 bg-ivory border border-line">
                    <div className="h-full bg-ink" style={{ width: `${pct}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        </Section>

        <Section title="Fulfillment">
          {Object.entries(data.fulfillmentMix).map(([k, v]) => {
            const total = Object.values(data.fulfillmentMix).reduce((a, b) => a + b, 0);
            const pct = total > 0 ? (v / total) * 100 : 0;
            return (
              <div key={k} className="border-b border-line last:border-0 px-4 py-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-ink">{k.replace(/_/g, " ")}</span>
                  <span className="text-stone tabular-nums">
                    {v} · {pct.toFixed(1)}%
                  </span>
                </div>
                <div className="mt-1 h-1 bg-ivory border border-line">
                  <div className="h-full bg-ink" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border border-line bg-ivory">
      <header className="px-4 py-3 border-b border-line">
        <span className="text-[11px] uppercase tracking-[0.18em] text-stone">{title}</span>
      </header>
      <div>{children}</div>
    </section>
  );
}
