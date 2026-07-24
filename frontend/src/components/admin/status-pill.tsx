/**
 * StatusPill — small uppercase status label used across the admin.
 * Each value gets a tone (paid/pending/refunded/etc.) with the right
 * brand colour. The tone is intentionally minimal: no rounded
 * corners, no fills, just a hairline border and tracking — matches
 * the storefront's editorial aesthetic.
 */

type Tone = "neutral" | "positive" | "negative" | "pending" | "gold" | "ink";

interface StatusPillProps {
  /** The label to show, e.g. "Paid", "Refunded". */
  label: string;
  /** Tone palette. Defaults to neutral. */
  tone?: Tone;
  className?: string;
}

const TONE_CLASS: Record<Tone, string> = {
  neutral: "border-line text-stone",
  positive: "border-ink/30 text-ink",
  negative: "border-ink text-ink bg-ink/[0.04]",
  pending: "border-stone/40 text-stone",
  gold: "border-gold text-gold",
  ink: "border-ink bg-ink text-ivory",
};

/** Pre-baked mappings for common domain values. */
export const ORDER_PAYMENT_TONE: Record<string, Tone> = {
  paid: "positive",
  pending: "pending",
  failed: "negative",
  refunded: "negative",
  partially_refunded: "neutral",
  unpaid: "pending",
};

export const ORDER_FULFILLMENT_TONE: Record<string, Tone> = {
  unfulfilled: "pending",
  partially_fulfilled: "pending",
  fulfilled: "positive",
  cancelled: "negative",
};

export const PRODUCT_STATUS_TONE: Record<string, Tone> = {
  active: "positive",
  draft: "pending",
  archived: "neutral",
};

export function StatusPill({ label, tone = "neutral", className = "" }: StatusPillProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.18em] border ${TONE_CLASS[tone]} ${className}`}
    >
      {label}
    </span>
  );
}
