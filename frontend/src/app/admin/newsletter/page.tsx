/**
 * /admin/newsletter — list subscribers, add manually, toggle/delete.
 */
import { cookies } from "next/headers";
import { NewsletterList } from "@/components/admin/newsletter/newsletter-list";

interface Subscriber {
  id: string;
  email: string;
  source: string | null;
  is_subscribed: boolean;
  created_at: string;
}

interface ListResponse {
  data: Subscriber[];
  meta?: { total: number; page: number; per_page: number; total_pages: number };
}

export const dynamic = "force-dynamic";

async function fetchSubscribers(sp: Record<string, string | undefined>) {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "https://lettyecommerce.onrender.com";
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.getAll().map((c) => `${c.name}=${c.value}`).join("; ");
  const url = new URL(`${base}/api/admin/newsletter`);
  if (sp.query) url.searchParams.set("query", sp.query);
  try {
    const res = await fetch(url, {
      headers: cookieHeader ? { cookie: cookieHeader } : undefined,
      cache: "no-store",
    });
    if (!res.ok) return { data: [] as Subscriber[] };
    const json = (await res.json()) as ListResponse;
    return { data: json.data ?? [] };
  } catch {
    return { data: [] as Subscriber[] };
  }
}

export default async function NewsletterPage(props: { searchParams: Promise<Record<string, string>> }) {
  // Next 15: searchParams is a Promise — awaiting it is what makes the
  // filters actually read the URL (previously every filter silently no-oped).
  const sp = await props.searchParams;
  const { data } = await fetchSubscribers(sp);
  return <NewsletterList initial={data} />;
}
