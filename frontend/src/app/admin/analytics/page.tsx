/**
 * /admin/analytics — three sections: top products, gateway mix,
 * fulfillment / currency mix. Range selector at the top.
 */
import { cookies } from "next/headers";
import Link from "next/link";
import { AnalyticsView } from "@/components/admin/analytics/analytics-view";

interface AnalyticsPayload {
  range: string;
  days: number;
  revenueByDay: Array<Record<string, number | string>>;
  topProducts: Array<{ product_id: string; name: string; slug: string; quantity: number; revenue: Record<string, number> }>;
  gatewayMix: Record<string, { count: number; byCurrency: Record<string, number> }>;
  currencyMix: Record<string, number>;
  fulfillmentMix: Record<string, number>;
}

export const dynamic = "force-dynamic";

async function fetchAnalytics(range: string): Promise<AnalyticsPayload | null> {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "https://lettyecommerce.onrender.com";
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.getAll().map((c) => `${c.name}=${c.value}`).join("; ");
  try {
    const res = await fetch(`${base}/api/admin/analytics?range=${range}`, {
      headers: cookieHeader ? { cookie: cookieHeader } : undefined,
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { data: AnalyticsPayload };
    return json.data;
  } catch {
    return null;
  }
}

export default async function AnalyticsPage(props: { searchParams: Promise<Record<string, string>> }) {
  // Next 15: searchParams is a Promise and must be awaited.
  const sp = await props.searchParams;
  const range = (sp.range === "7d" || sp.range === "90d") ? sp.range : "30d";
  const data = await fetchAnalytics(range);
  return <AnalyticsView initialRange={range} initialData={data} />;
}
