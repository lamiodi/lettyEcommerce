/**
 * /admin/products — product list with search, status, brand, category
 * filters and bulk activate/deactivate. Soft-deleted products can be
 * toggled into view via the "Show deleted" checkbox, and restored
 * in-place.
 */
import Link from "next/link";
import { cookies } from "next/headers";
import { Plus } from "lucide-react";
import { DataTable, type Column } from "@/components/admin/data-table";
import { CurrencyCell, type AdminCurrency } from "@/components/admin/currency-cell";
import { StatusPill, PRODUCT_STATUS_TONE } from "@/components/admin/status-pill";
import { ProductRowActions } from "@/components/admin/products/product-row-actions";

interface ProductRow {
  id: string;
  slug: string;
  name: string;
  is_active: boolean;
  is_featured: boolean;
  is_new: boolean;
  is_bestseller: boolean;
  base_price_ngn: number;
  base_price_usd: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  brand: { id: string; name: string } | null;
  category: { id: string; name: string } | null;
}

interface ListResponse {
  data: ProductRow[];
  meta?: { total: number; page: number; per_page: number; total_pages: number };
}

export const dynamic = "force-dynamic";

async function fetchProducts(sp: Record<string, string | undefined>): Promise<{ data: ProductRow[]; total: number; page: number; totalPages: number }> {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "https://lettyecommerce.onrender.com";
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.getAll().map((c) => `${c.name}=${c.value}`).join("; ");
  const url = new URL(`${base}/api/admin/products`);
  if (sp.query) url.searchParams.set("query", sp.query);
  if (sp.status && sp.status !== "all") url.searchParams.set("status", sp.status);
  if (sp.includeDeleted === "1") url.searchParams.set("includeDeleted", "true");
  const page = Math.max(1, Number(sp.page) || 1);
  url.searchParams.set("page", String(page));
  url.searchParams.set("limit", "50");
  try {
    const res = await fetch(url, {
      headers: cookieHeader ? { cookie: cookieHeader } : undefined,
      cache: "no-store",
    });
    if (!res.ok) return { data: [], total: 0, page: 1, totalPages: 1 };
    const json = (await res.json()) as ListResponse;
    return {
      data: json.data ?? [],
      total: json.meta?.total ?? 0,
      page: Number(json.meta?.page) || page,
      totalPages: Number(json.meta?.total_pages) || 1,
    };
  } catch {
    return { data: [], total: 0, page: 1, totalPages: 1 };
  }
}

function pageHref(sp: Record<string, string | undefined>, page: number): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(sp)) {
    if (value && key !== "page") params.set(key, value);
  }
  params.set("page", String(page));
  return `/admin/products?${params.toString()}`;
}

export default async function ProductsListPage(props: { searchParams: Promise<Record<string, string>> }) {
  // Next 15: searchParams is a Promise — awaiting it is what makes the
  // filters actually read the URL (previously every filter silently no-oped).
  const sp = await props.searchParams;
  const { data, total, page, totalPages } = await fetchProducts(sp);

  const columns: Column<ProductRow>[] = [
    {
      key: "name",
      label: "Product",
      sortable: true,
      render: (r) => (
        <div className="flex items-center gap-3 min-w-0">
          <div className="min-w-0">
            <Link
              href={`/admin/products/${r.id}`}
              className="text-ink hover:underline underline-offset-2 truncate block"
            >
              {r.name}
            </Link>
            <p className="text-[11px] uppercase tracking-[0.18em] text-stone">
              {r.brand?.name ?? "—"} · {r.category?.name ?? "—"}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "base_price_usd",
      label: "Price",
      align: "right",
      hideOnMobile: true,
      render: (r) => <CurrencyCell amount={r.base_price_usd} currency={"USD" as AdminCurrency} />,
    },
    {
      key: "is_active",
      label: "Status",
      render: (r) => (
        <StatusPill
          label={r.is_active ? "active" : "draft"}
          tone={r.is_active ? PRODUCT_STATUS_TONE.active : PRODUCT_STATUS_TONE.draft}
        />
      ),
    },
    {
      key: "flags",
      label: "Flags",
      hideOnMobile: true,
      render: (r) => (
        <div className="flex items-center gap-1 flex-wrap">
          {r.is_featured ? <StatusPill label="featured" tone="gold" /> : null}
          {r.is_new ? <StatusPill label="new" tone="positive" /> : null}
          {r.is_bestseller ? <StatusPill label="bestseller" tone="ink" /> : null}
          {r.deleted_at ? <StatusPill label="deleted" tone="negative" /> : null}
        </div>
      ),
    },
    {
      key: "updated_at",
      label: "Updated",
      align: "right",
      hideOnMobile: true,
      sortable: true,
      render: (r) => <span className="text-xs text-stone">{new Date(r.updated_at).toLocaleDateString()}</span>,
    },
    {
      key: "_actions",
      label: "",
      align: "right",
      render: (r) => <ProductRowActions product={r} />,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <form className="grid grid-cols-2 sm:grid-cols-4 gap-3 flex-1 min-w-0">
          <input
            name="query"
            defaultValue={sp.query ?? ""}
            placeholder="Name or slug"
            className="h-10 px-3 border border-line bg-ivory text-sm focus:border-ink focus:outline-none"
          />
          <select name="status" defaultValue={sp.status ?? "all"} className="h-10 px-3 border border-line bg-ivory text-sm">
            <option value="all">All status</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
          </select>
          <label className="h-10 px-3 border border-line bg-ivory text-sm flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              name="includeDeleted"
              value="1"
              defaultChecked={sp.includeDeleted === "1"}
              className="h-3.5 w-3.5 accent-ink"
            />
            <span className="text-stone">Show deleted</span>
          </label>
          <button
            type="submit"
            className="h-10 text-[11px] uppercase tracking-[0.18em] bg-ink text-ivory"
          >
            Apply
          </button>
        </form>
        <Link
          href="/admin/products/new"
          className="inline-flex items-center gap-2 h-10 px-5 text-[11px] uppercase tracking-[0.18em] bg-ink text-ivory"
        >
          <Plus className="h-3.5 w-3.5" />
          New product
        </Link>
      </div>

      <DataTable
        rows={data}
        columns={columns}
        rowKey={(r) => r.id}
        initialSort={{ key: "updated_at", dir: "desc" }}
        emptyTitle={total === 0 ? "No products yet" : "No products match"}
        emptyDescription="Create your first product or adjust the filters."
        emptyAction={
          <Link
            href="/admin/products/new"
            className="inline-flex items-center gap-2 h-10 px-5 text-[11px] uppercase tracking-[0.18em] bg-ink text-ivory"
          >
            <Plus className="h-3.5 w-3.5" />
            New product
          </Link>
        }
      />
      <div className="flex items-center justify-between border-t border-line pt-3 text-xs text-stone">
        <span>
          {total} product{total === 1 ? "" : "s"} · page {page} of {totalPages}
        </span>
        <div className="flex items-center gap-3">
          {page > 1 ? (
            <Link href={pageHref(sp, page - 1)} className="uppercase tracking-[0.18em] hover:text-ink">
              ← Previous
            </Link>
          ) : null}
          {page < totalPages ? (
            <Link href={pageHref(sp, page + 1)} className="uppercase tracking-[0.18em] hover:text-ink">
              Next →
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
