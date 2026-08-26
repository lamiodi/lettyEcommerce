/**
 * /admin/settings — store, contact, shipping defaults, payments,
 * marketing knobs. JSON-style editors kept deliberately minimal —
 * the values are validated by Zod on the server.
 */
import { cookies } from "next/headers";
import { SettingsForm } from "@/components/admin/settings/settings-form";

interface Settings {
  store: { value: any; description: string | null; updated_at: string };
  contact: { value: any; description: string | null; updated_at: string };
  shipping: { value: any; description: string | null; updated_at: string };
  payments: { value: any; description: string | null; updated_at: string };
  marketing: { value: any; description: string | null; updated_at: string };
}

export const dynamic = "force-dynamic";

async function fetchSettings(): Promise<Settings | null> {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.getAll().map((c) => `${c.name}=${c.value}`).join("; ");
  try {
    const res = await fetch(`${base}/api/admin/settings`, {
      headers: cookieHeader ? { cookie: cookieHeader } : undefined,
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { data: Settings };
    return json.data;
  } catch {
    return null;
  }
}

export default async function SettingsPage() {
  const s = await fetchSettings();
  return <SettingsForm initial={s} />;
}
