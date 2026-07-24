"use client";

/**
 * AbandonedCartsList — visibility-only list. Tabs: Open · All.
 * Shows the cart contents inline (variant SKUs + quantities) so the
 * admin can see what each cart contains without opening a detail page.
 */
import Link from "next/link";
import { useMemo, useState } from "react";

interface CartItem {
  variant_id?: string;
  sku?: string;
  name?: string;
  quantity?: number;
  unit_price?: number;
}

interface AbandonedCart {
  id: string;
  customer_email: string | null;
  currency: string | null;
  subtotal: number | null;
  cart: any;
  recovery_token: string | null;
  last_reminder_at: string | null;
  reminder_count: number;
  recovered_at: string | null;
  created_at: string;
  updated_at: string;
}

function normaliseCart(raw: any): CartItem[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw as CartItem[];
  if (Array.isArray(raw?.items)) return raw.items as CartItem[];
  if (Array.isArray(raw?.lines)) return raw.lines as CartItem[];
  return [];
}

function summarise(items: CartItem[]): string {
  if (items.length === 0) return "—";
  const n = items.reduce((s, i) => s + (i.quantity ?? 1), 0);
  const first = items[0];
  const rest = items.length - 1;
  return `${first.name ?? first.sku ?? "Item"} × ${first.quantity ?? 1}${rest > 0 ? ` + ${rest} more (${n} total)` : ""}`;
}

export function AbandonedCartsList({
  initial,
  total,
  showAll,
}: {
  initial: AbandonedCart[];
  total: number;
  showAll: boolean;
}) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const summary = useMemo(() => {
    const open = initial.filter((c) => !c.recovered_at).length;
    const recovered = initial.filter((c) => c.recovered_at).length;
    return { open, recovered, total: total || initial.length };
  }, [initial, total]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <p className="text-sm text-stone max-w-xl">
          Customers who reached checkout but never paid. Reminders are sent automatically
          by the daily QStash job (max 2 per cart). Use the recovery link to see what was in
          the cart.
        </p>
        <div className="inline-flex items-center border border-line">
          <Link
            href="/admin/abandoned-carts"
            className={`h-8 px-4 text-[11px] uppercase tracking-[0.18em] ${
              !showAll ? "bg-ink text-ivory" : "text-stone hover:text-ink"
            }`}
          >
            Open ({summary.open})
          </Link>
          <Link
            href="/admin/abandoned-carts?all=1"
            className={`h-8 px-4 text-[11px] uppercase tracking-[0.18em] ${
              showAll ? "bg-ink text-ivory" : "text-stone hover:text-ink"
            }`}
          >
            All ({summary.total})
          </Link>
        </div>
      </div>

      <div className="border border-line bg-ivory overflow-x-auto">
        {initial.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-stone">
            {showAll ? "No abandoned carts yet." : "No open abandoned carts. Inbox zero."}
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-line">
              <tr>
                <th className="px-4 py-3 text-left text-[10px] uppercase tracking-[0.18em] text-stone">Email</th>
                <th className="px-4 py-3 text-left text-[10px] uppercase tracking-[0.18em] text-stone">Contents</th>
                <th className="px-4 py-3 text-right text-[10px] uppercase tracking-[0.18em] text-stone">Subtotal</th>
                <th className="px-4 py-3 text-right text-[10px] uppercase tracking-[0.18em] text-stone hidden md:table-cell">Reminders</th>
                <th className="px-4 py-3 text-right text-[10px] uppercase tracking-[0.18em] text-stone hidden md:table-cell">Last update</th>
                <th className="px-4 py-3 text-right text-[10px] uppercase tracking-[0.18em] text-stone">Status</th>
              </tr>
            </thead>
            <tbody>
              {initial.map((c) => {
                const items = normaliseCart(c.cart);
                const isOpen = !c.recovered_at;
                return (
                  <tr key={c.id} className="border-b border-line last:border-0 align-top">
                    <td className="px-4 py-3 text-ink">
                      {c.customer_email ?? <span className="text-stone">Guest</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-stone max-w-md">
                      <button
                        type="button"
                        onClick={() => setExpanded((m) => ({ ...m, [c.id]: !m[c.id] }))}
                        className="text-left hover:text-ink"
                      >
                        {summarise(items)}
                      </button>
                      {expanded[c.id] ? (
                        <ul className="mt-2 space-y-1 text-[11px] text-stone">
                          {items.length === 0 ? (
                            <li>—</li>
                          ) : (
                            items.map((it, i) => (
                              <li key={`${c.id}-${i}`}>
                                {it.name ?? it.sku ?? "Item"} · qty {it.quantity ?? 1}
                                {it.unit_price ? ` · ${(it.unit_price / 100).toFixed(2)}` : ""}
                              </li>
                            ))
                          )}
                        </ul>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-ink">
                      {c.subtotal != null ? `${(Number(c.subtotal) / 100).toFixed(2)} ${c.currency ?? ""}` : "—"}
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-stone hidden md:table-cell">
                      {c.reminder_count}
                      {c.last_reminder_at ? (
                        <p className="text-[10px] text-stone">{new Date(c.last_reminder_at).toLocaleDateString()}</p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-stone hidden md:table-cell">
                      {new Date(c.updated_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={`text-[10px] uppercase tracking-[0.18em] ${
                          isOpen ? "text-ink" : "text-stone"
                        }`}
                      >
                        {isOpen ? "Open" : "Recovered"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
