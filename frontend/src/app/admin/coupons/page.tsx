/**
 * /admin/coupons — list with inline add/edit. Open the row to edit it,
 * or click "New" to insert.
 */
import { cookies } from "next/headers";
import { CouponsList } from "@/components/admin/coupons/coupons-list";

interface Coupon {
  id: string;
  code: string;
  description: string | null;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  is_active: boolean;
  starts_at: string | null;
  expires_at: string | null;
  usage_limit: number | null;
  times_used: number;
  created_at: string;
}

export const dynamic = "force-dynamic";

async function fetchCoupons(): Promise<Coupon[]> {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.getAll().map((c) => `${c.name}=${c.value}`).join("; ");
  try {
    const res = await fetch(`${base}/api/admin/coupons`, {
      headers: cookieHeader ? { cookie: cookieHeader } : undefined,
      cache: "no-store",
    });
    if (!res.ok) return [];
    const json = (await res.json()) as { data: Coupon[] };
    return json.data ?? [];
  } catch {
    return [];
  }
}

export default async function CouponsPage() {
  const coupons = await fetchCoupons();
  return <CouponsList initial={coupons} />;
}
