/**
 * /admin/notifications — full inbox of admin notifications.
 * Reuses the bell data shape, just with tabs (unread / all).
 */
import { cookies } from "next/headers";
import Link from "next/link";
import { NotificationsInbox } from "@/components/admin/notifications/notifications-inbox";

interface Notification {
  id: string;
  type: string;
  entity_id: string | null;
  title: string;
  body: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

export const dynamic = "force-dynamic";

async function fetchNotifications(): Promise<Notification[]> {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.getAll().map((c) => `${c.name}=${c.value}`).join("; ");
  try {
    const res = await fetch(`${base}/api/admin/notifications?unread=false&limit=200`, {
      headers: cookieHeader ? { cookie: cookieHeader } : undefined,
      cache: "no-store",
    });
    if (!res.ok) return [];
    const json = (await res.json()) as { data: Notification[] };
    return json.data ?? [];
  } catch {
    return [];
  }
}

export default async function NotificationsPage() {
  const all = await fetchNotifications();
  return <NotificationsInbox initial={all} />;
}
