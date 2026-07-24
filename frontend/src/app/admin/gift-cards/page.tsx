/**
 * /admin/gift-cards — list + issue. Shows status, balance, recipient.
 */
import { cookies } from "next/headers";
import { GiftCardsList } from "@/components/admin/gift-cards/gift-cards-list";

interface GiftCard {
  id: string;
  code: string;
  initial_balance: number;
  current_balance: number;
  currency: string;
  recipient_email: string;
  recipient_name: string | null;
  status: string;
  expires_at: string | null;
  created_at: string;
}

export const dynamic = "force-dynamic";

async function fetchGiftCards(): Promise<GiftCard[]> {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
  const cookieHeader = cookies().getAll().map((c) => `${c.name}=${c.value}`).join("; ");
  try {
    const res = await fetch(`${base}/api/admin/gift-cards`, {
      headers: cookieHeader ? { cookie: cookieHeader } : undefined,
      cache: "no-store",
    });
    if (!res.ok) return [];
    const json = (await res.json()) as { data: GiftCard[] };
    return json.data ?? [];
  } catch {
    return [];
  }
}

export default async function GiftCardsPage() {
  const cards = await fetchGiftCards();
  return <GiftCardsList initial={cards} />;
}
