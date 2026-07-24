/**
 * /admin/banners — list + add/edit/delete with optional scheduling.
 */
import { cookies } from "next/headers";
import { BannersList } from "@/components/admin/banners/banners-list";

interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string | null;
  link_url: string | null;
  is_active: boolean;
  position: number;
  starts_at: string | null;
  ends_at: string | null;
}

export const dynamic = "force-dynamic";

async function fetchBanners(): Promise<Banner[]> {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
  const cookieHeader = cookies().getAll().map((c) => `${c.name}=${c.value}`).join("; ");
  try {
    const res = await fetch(`${base}/api/admin/banners`, {
      headers: cookieHeader ? { cookie: cookieHeader } : undefined,
      cache: "no-store",
    });
    if (!res.ok) return [];
    const json = (await res.json()) as { data: Banner[] };
    return json.data ?? [];
  } catch {
    return [];
  }
}

export default async function BannersPage() {
  const banners = await fetchBanners();
  return <BannersList initial={banners} />;
}
