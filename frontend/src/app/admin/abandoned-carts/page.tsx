/**
 * /admin/abandoned-carts — read-only list of open carts.
 * 5.O.1 — visibility only. No manual reminder / recovery actions
 * in v1 (those are owned by the QStash daily cron).
 */
import { cookies } from "next/headers";
import { AbandonedCartsList } from "@/components/admin/abandoned-carts/abandoned-carts-list";

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

interface ListResponse {
  data: AbandonedCart[];
  meta?: { total: number; page: number; per_page: number; total_pages: number };
}

export const dynamic = "force-dynamic";

async function fetchCarts(openOnly: boolean): Promise<{ data: AbandonedCart[]; total: number }> {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.getAll().map((c) => `${c.name}=${c.value}`).join("; ");
  const url = new URL(`${base}/api/admin/abandoned-carts`);
  url.searchParams.set("open", openOnly ? "true" : "false");
  url.searchParams.set("limit", "100");
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

export default async function AbandonedCartsPage(props: { searchParams: Record<string, string> }) {
  const showAll = props.searchParams.all === "1";
  const { data, total } = await fetchCarts(!showAll);
  return <AbandonedCartsList initial={data} total={total} showAll={showAll} />;
}
