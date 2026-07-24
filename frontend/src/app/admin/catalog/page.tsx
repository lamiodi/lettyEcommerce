/**
 * /admin/catalog — brands + categories side by side.
 */
import { cookies } from "next/headers";
import { CatalogManager } from "@/components/admin/catalog/catalog-manager";

interface Brand {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  created_at: string;
}
interface Category {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  is_active: boolean;
  position: number;
  created_at: string;
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

export default async function CatalogPage() {
  const [brands, categories] = await Promise.all([
    fetchJSON<Brand[]>(`/api/admin/brands`),
    fetchJSON<Category[]>(`/api/admin/categories`),
  ]);
  return <CatalogManager initialBrands={brands ?? []} initialCategories={categories ?? []} />;
}
