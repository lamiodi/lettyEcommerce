/**
 * /admin/shipping — zones + methods, side by side. Two-column layout
 * on desktop, stacked on mobile. Editing happens in inline forms
 * below each list row.
 */
import { cookies } from "next/headers";
import { ShippingManager } from "@/components/admin/shipping/shipping-manager";

interface Zone {
  id: string;
  name: string;
  countries: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
  shipping_methods: Array<{ id: string; name: string; is_active: boolean }>;
}
interface Method {
  id: string;
  zone_id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  rate_ngn: number;
  rate_usd: number;
  rate_eur: number;
  rate_gbp: number;
  rate_ghs: number;
  rate_zar: number;
  rate_kes: number;
  free_over_ngn: number | null;
  free_over_usd: number | null;
  free_over_eur: number | null;
  free_over_gbp: number | null;
  free_over_ghs: number | null;
  free_over_zar: number | null;
  free_over_kes: number | null;
  zone: { id: string; name: string } | null;
}

export const dynamic = "force-dynamic";

async function fetchJSON<T>(path: string): Promise<T | null> {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
  const cookieHeader = cookies().getAll().map((c) => `${c.name}=${c.value}`).join("; ");
  try {
    const res = await fetch(`${base}${path}`, {
      headers: cookieHeader ? { cookie: cookieHeader } : undefined,
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { data: T };
    return json.data;
  } catch {
    return null;
  }
}

export default async function ShippingPage() {
  const [zones, methods] = await Promise.all([
    fetchJSON<Zone[]>(`/api/admin/shipping/zones`),
    fetchJSON<Method[]>(`/api/admin/shipping/methods`),
  ]);
  return (
    <ShippingManager
      initialZones={zones ?? []}
      initialMethods={methods ?? []}
    />
  );
}
