/**
 * /admin/waitlist — read-only list of waitlist signups per variant.
 * 5.P.1 — visibility only. The customer-facing waitlist form lives
 * on the PDP when a variant is out of stock.
 */
import { cookies } from "next/headers";
import { WaitlistList } from "@/components/admin/waitlist/waitlist-list";

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

interface ListResponse {
  data: WaitlistRow[];
  meta?: { total: number; page: number; per_page: number; total_pages: number };
}

export const dynamic = "force-dynamic";

async function fetchWaitlist(): Promise<{ data: WaitlistRow[]; total: number }> {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.getAll().map((c) => `${c.name}=${c.value}`).join("; ");
  const url = new URL(`${base}/api/admin/waitlist`);
  url.searchParams.set("limit", "200");
  try {
    const res = await fetch(url, {
      headers: cookieHeader ? { cookie: cookieHeader } : undefined,
      cache: "no-store",
    });
    if (!res.ok) return { data: [], total: 0 };
    const json = (await res.json()) as ListResponse;
    return { data: json.data ?? [], total: json.meta?.total ?? json.data?.length ?? 0 };
  } catch {
    return { data: [], total: 0 };
  }
}

export default async function WaitlistPage() {
  const { data, total } = await fetchWaitlist();
  return <WaitlistList initial={data} total={total} />;
}
