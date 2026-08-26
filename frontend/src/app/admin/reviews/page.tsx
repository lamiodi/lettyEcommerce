/**
 * /admin/reviews — moderation queue. Default tab is "pending"; you can
 * also switch to "approved" or "all". Inline approve / unapprove /
 * delete.
 */
import Link from "next/link";
import { cookies } from "next/headers";
import { Star } from "lucide-react";
import { DataTable, type Column } from "@/components/admin/data-table";
import { ReviewRowActions } from "@/components/admin/reviews/review-row-actions";

interface ReviewRow {
  id: string;
  rating: number;
  title: string | null;
  body: string | null;
  is_approved: boolean;
  verified_purchase: boolean;
  created_at: string;
  product: { id: string; name: string; slug: string } | null;
  customer: { id: string; first_name: string | null; last_name: string | null; email: string } | null;
}

interface ListResponse {
  data: ReviewRow[];
  meta?: { total: number; page: number; per_page: number; total_pages: number };
}

export const dynamic = "force-dynamic";

async function fetchReviews(sp: Record<string, string | undefined>) {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.getAll().map((c) => `${c.name}=${c.value}`).join("; ");
  const url = new URL(`${base}/api/admin/reviews`);
  if (sp.status) url.searchParams.set("status", sp.status);
  if (sp.query) url.searchParams.set("query", sp.query);
  try {
    const res = await fetch(url, {
      headers: cookieHeader ? { cookie: cookieHeader } : undefined,
      cache: "no-store",
    });
    if (!res.ok) return { data: [] as ReviewRow[] };
    const json = (await res.json()) as ListResponse;
    return { data: json.data ?? [] };
  } catch {
    return { data: [] as ReviewRow[] };
  }
}

export default async function ReviewsPage(props: { searchParams: Record<string, string> }) {
  const sp = props.searchParams;
  const status = sp.status ?? "pending";
  const { data } = await fetchReviews(sp);

  const columns: Column<ReviewRow>[] = [
    {
      key: "rating",
      label: "Rating",
      align: "center",
      sortable: true,
      render: (r) => (
        <div className="inline-flex items-center gap-0.5">
          {[1, 2, 3, 4, 5].map((i) => (
            <Star
              key={i}
              className={`h-3 w-3 ${i <= r.rating ? "text-gold fill-gold" : "text-stone/30"}`}
            />
          ))}
        </div>
      ),
    },
    {
      key: "body",
      label: "Review",
      render: (r) => (
        <div className="min-w-0">
          {r.title ? <p className="text-sm text-ink">{r.title}</p> : null}
          {r.body ? (
            <p className="text-xs text-stone line-clamp-2 max-w-md">{r.body}</p>
          ) : null}
          <p className="text-[11px] uppercase tracking-[0.18em] text-stone mt-1">
            {r.product?.name ?? "—"} · {r.customer?.first_name ?? r.customer?.email ?? "—"}
            {r.verified_purchase ? (
              <span className="ml-2 inline-block text-gold">verified</span>
            ) : null}
          </p>
        </div>
      ),
    },
    {
      key: "is_approved",
      label: "Status",
      hideOnMobile: true,
      render: (r) =>
        r.is_approved ? (
          <span className="text-[11px] uppercase tracking-[0.18em] text-ink">approved</span>
        ) : (
          <span className="text-[11px] uppercase tracking-[0.18em] text-stone">pending</span>
        ),
    },
    {
      key: "created_at",
      label: "Date",
      align: "right",
      hideOnMobile: true,
      sortable: true,
      render: (r) => <span className="text-xs text-stone">{new Date(r.created_at).toLocaleDateString()}</span>,
    },
    {
      key: "_actions",
      label: "",
      align: "right",
      render: (r) => <ReviewRowActions review={r} />,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <form className="grid grid-cols-2 sm:grid-cols-3 gap-3 flex-1 min-w-0">
          <select name="status" defaultValue={status} className="h-10 px-3 border border-line bg-ivory text-sm">
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="all">All</option>
          </select>
          <input
            name="query"
            defaultValue={sp.query ?? ""}
            placeholder="Search title or body"
            className="h-10 px-3 border border-line bg-ivory text-sm focus:border-ink focus:outline-none"
          />
          <button type="submit" className="h-10 text-[11px] uppercase tracking-[0.18em] bg-ink text-ivory">
            Apply
          </button>
        </form>
        {status === "pending" ? (
          <p className="text-[11px] uppercase tracking-[0.18em] text-stone">
            Approve to publish on the storefront
          </p>
        ) : null}
      </div>

      <DataTable
        rows={data}
        columns={columns}
        rowKey={(r) => r.id}
        initialSort={{ key: "created_at", dir: "desc" }}
        emptyTitle="No reviews in this view"
        emptyDescription="Try a different status."
      />
    </div>
  );
}
