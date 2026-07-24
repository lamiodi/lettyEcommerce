"use client";

/**
 * WaitlistList — visibility per variant signups. Grouped by product
 * (collapsible) so the admin can see the most-asked-for items first.
 */
import Link from "next/link";
import { useMemo, useState } from "react";

interface Variant {
  sku: string;
  product?: { name?: string; slug?: string } | null;
}

interface WaitlistRow {
  id: string;
  email: string;
  variant_id: string;
  notified_at: string | null;
  created_at: string;
  variant: Variant | null;
}

export function WaitlistList({ initial, total }: { initial: WaitlistRow[]; total: number }) {
  const [filter, setFilter] = useState<"all" | "open" | "notified">("open");
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    return initial.filter((r) => {
      if (filter === "open" && r.notified_at) return false;
      if (filter === "notified" && !r.notified_at) return false;
      if (q && !r.email.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [initial, filter, q]);

  const grouped = useMemo(() => {
    const map = new Map<string, { productName: string; slug: string | null; sku: string; rows: WaitlistRow[] }>();
    for (const r of filtered) {
      const key = r.variant?.sku ?? r.variant_id;
      const productName = r.variant?.product?.name ?? "Unknown product";
      const slug = r.variant?.product?.slug ?? null;
      if (!map.has(key)) {
        map.set(key, { productName, slug, sku: r.variant?.sku ?? "—", rows: [] });
      }
      map.get(key)!.rows.push(r);
    }
    return Array.from(map.entries())
      .map(([key, v]) => ({ key, ...v }))
      .sort((a, b) => b.rows.length - a.rows.length);
  }, [filtered]);

  return (
    <div className="space-y-4">
      <p className="text-sm text-stone max-w-xl">
        Customers waiting for an out-of-stock variant to come back. Use this list to plan
        restocks and to know who to email when a SKU is replenished.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search email"
          className="h-10 px-3 border border-line bg-ivory text-sm focus:border-ink focus:outline-none"
        />
        <div className="inline-flex items-center border border-line sm:col-span-2">
          <button
            type="button"
            onClick={() => setFilter("open")}
            className={`h-10 px-4 text-[11px] uppercase tracking-[0.18em] ${
              filter === "open" ? "bg-ink text-ivory" : "text-stone hover:text-ink"
            }`}
          >
            Open
          </button>
          <button
            type="button"
            onClick={() => setFilter("notified")}
            className={`h-10 px-4 text-[11px] uppercase tracking-[0.18em] ${
              filter === "notified" ? "bg-ink text-ivory" : "text-stone hover:text-ink"
            }`}
          >
            Notified
          </button>
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`h-10 px-4 text-[11px] uppercase tracking-[0.18em] ${
              filter === "all" ? "bg-ink text-ivory" : "text-stone hover:text-ink"
            }`}
          >
            All
          </button>
        </div>
      </div>

      {grouped.length === 0 ? (
        <div className="border border-line bg-ivory px-4 py-10 text-center text-sm text-stone">
          {initial.length === 0 ? "No waitlist signups yet." : "No matches."}
        </div>
      ) : (
        <div className="space-y-3">
          {grouped.map((g) => (
            <details
              key={g.key}
              className="border border-line bg-ivory"
              open={g.rows.length > 0 && grouped.indexOf(g) < 5}
            >
              <summary className="cursor-pointer list-none px-4 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm text-ink truncate">
                    {g.slug ? (
                      <Link href={`/admin/products/${g.slug}`} className="hover:underline underline-offset-2">
                        {g.productName}
                      </Link>
                    ) : (
                      g.productName
                    )}
                  </p>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-stone">
                    SKU {g.sku}
                  </p>
                </div>
                <span className="text-[11px] uppercase tracking-[0.18em] text-stone">
                  {g.rows.length} {g.rows.length === 1 ? "signup" : "signups"}
                </span>
              </summary>
              <ul className="border-t border-line">
                {g.rows.map((r) => (
                  <li key={r.id} className="px-4 py-2 border-b border-line last:border-0 flex items-center justify-between gap-3">
                    <span className="text-sm text-ink">{r.email}</span>
                    <span className="text-[10px] uppercase tracking-[0.18em] text-stone">
                      {r.notified_at
                        ? `Notified ${new Date(r.notified_at).toLocaleDateString()}`
                        : `Joined ${new Date(r.created_at).toLocaleDateString()}`}
                    </span>
                  </li>
                ))}
              </ul>
            </details>
          ))}
        </div>
      )}

      <p className="text-[11px] uppercase tracking-[0.18em] text-stone">
        {total} total signups
      </p>
    </div>
  );
}
