/**
 * /admin/tax — flat list of tax rules. Country + optional state +
 * rate + inclusive flag. Inline edit.
 */
import { cookies } from "next/headers";
import { TaxRulesList } from "@/components/admin/tax/tax-rules-list";

interface TaxRule {
  id: string;
  country: string;
  state: string | null;
  rate: number;
  is_inclusive: boolean;
  created_at: string;
  updated_at: string;
}

export const dynamic = "force-dynamic";

async function fetchTax(): Promise<TaxRule[]> {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
  const cookieHeader = cookies().getAll().map((c) => `${c.name}=${c.value}`).join("; ");
  try {
    const res = await fetch(`${base}/api/admin/tax`, {
      headers: cookieHeader ? { cookie: cookieHeader } : undefined,
      cache: "no-store",
    });
    if (!res.ok) return [];
    const json = (await res.json()) as { data: TaxRule[] };
    return json.data ?? [];
  } catch {
    return [];
  }
}

export default async function TaxPage() {
  const rules = await fetchTax();
  return <TaxRulesList initial={rules} />;
}
