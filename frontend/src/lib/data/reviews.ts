import type { Review } from "@/types";
import { getBackendUrl } from "@/lib/backend";

/**
 * Customer reviews come from the backend's review system (only real verified
 * purchases get the verified badge). There is deliberately NO fabricated
 * fallback: a product with no reviews yet shows no social proof.
 */

interface ApiReviewRow {
  id: string;
  rating: number;
  title: string | null;
  body: string | null;
  verified_purchase: boolean;
  created_at: string;
  customers: { first_name: string | null; last_name: string | null } | Array<{ first_name: string | null; last_name: string | null }> | null;
}

const cache = new Map<string, { data: Review[]; fetchedAt: number }>();
const TTL_MS = 5 * 60 * 1000;
const pending = new Map<string, Promise<Review[]>>();
const retryAfter = new Map<string, number>();

export async function getReviewsByProduct(productId: string): Promise<Review[]> {
  const hit = cache.get(productId);
  if (hit && Date.now() - hit.fetchedAt < TTL_MS) return hit.data;
  if (Date.now() < (retryAfter.get(productId) ?? 0)) return hit?.data ?? [];
  const inFlight = pending.get(productId);
  if (inFlight) return inFlight;
  const request = fetchReviews(productId).finally(() => pending.delete(productId));
  pending.set(productId, request);
  return request;
}

async function fetchReviews(productId: string): Promise<Review[]> {
  const hit = cache.get(productId);
  try {
    const res = await fetch(
      `${getBackendUrl()}/api/public/reviews?product_id=${encodeURIComponent(productId)}&limit=50`,
      { next: { revalidate: 300 }, signal: AbortSignal.timeout(3_000) },
    );
    if (!res.ok) throw new Error("Reviews unavailable");
    const json = (await res.json()) as { data?: ApiReviewRow[] };

    const data: Review[] = (json.data ?? []).map((row) => {
      const customer = Array.isArray(row.customers) ? row.customers[0] : row.customers;
      const first = customer?.first_name?.trim() || "";
      const lastInitial = customer?.last_name?.trim()?.[0];
      const author = [first, lastInitial ? `${lastInitial}.` : ""].filter(Boolean).join(" ") || "LETTY Client";
      return {
        id: row.id,
        productId,
        rating: row.rating,
        title: row.title ?? "",
        body: row.body ?? "",
        author,
        verified: Boolean(row.verified_purchase),
        date: row.created_at,
      };
    });

    cache.set(productId, { data, fetchedAt: Date.now() });
    return data;
  } catch {
    retryAfter.set(productId, Date.now() + 15_000);
    return hit?.data ?? [];
  }
}
