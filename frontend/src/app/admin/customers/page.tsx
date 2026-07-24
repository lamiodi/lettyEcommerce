/**
 * /admin/customers — list view. Search by name or email, sortable.
 */
import Link from "next/link";
import { cookies } from "next/headers";
import { DataTable, type Column } from "@/components/admin/data-table";
import { CurrencyCell, type AdminCurrency } from "@/components/admin/currency-cell";

interface CustomerRow {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  loyalty_points: number;
  total_spent_ngn: number;
  total_spent_usd: number;
  last_order_at: string | null;
  created_at: string;
}

interface ListResponse {
  data: CustomerRow[];
  meta?: { total: number; page: number; per_page: number; total_pages: number };
}

export const dynamic = "force-dynamic";

async function fetchCustomers(sp: Record<string, string | undefined>) {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
  const cookieHeader = cookies().getAll().map((c) => `${c.name}=${c.value}`).join("; ");
  const url = new URL(`${base}/api/admin/customers`);
  if (sp.query) url.searchParams.set("query", sp.query);
  try {
    const res = await fetch(url, {
      headers: cookieHeader ? { cookie: cookieHeader } : undefined,
      cache: "no-store",
    });
    if (!res.ok) return { data: [] as CustomerRow[] };
    const json = (await res.json()) as ListResponse;
    return { data: json.data ?? [] };
  } catch {
    return { data: [] as CustomerRow[] };
  }
}

export default async function CustomersListPage(props: { searchParams: Record<string, string> }) {
  const sp = props.searchParams;
  const { data } = await fetchCustomers(sp);

  const columns: Column<CustomerRow>[] = [
    {
      key: "name",
      label: "Name",
      sortable: true,
      render: (r) => (
        <div className="min-w-0">
          <Link
            href={`/admin/customers/${r.id}`}
            className="text-ink hover:underline underline-offset-2 truncate block"
          >
            {r.first_name ?? ""} {r.last_name ?? ""}
          </Link>
          <p className="text-[11px] uppercase tracking-[0.18em] text-stone">{r.email}</p>
        </div>
      ),
    },
    {
      key: "phone",
      label: "Phone",
      hideOnMobile: true,
      render: (r) => <span className="text-xs text-stone">{r.phone ?? "—"}</span>,
    },
    {
      key: "total_spent_usd",
      label: "LTV (USD)",
      align: "right",
      hideOnMobile: true,
      sortable: true,
      render: (r) => <CurrencyCell amount={r.total_spent_usd} currency={"USD" as AdminCurrency} zeroDisplay="—" />,
    },
    {
      key: "total_spent_ngn",
      label: "LTV (NGN)",
      align: "right",
      hideOnMobile: true,
      render: (r) => <CurrencyCell amount={r.total_spent_ngn} currency={"NGN" as AdminCurrency} zeroDisplay="—" />,
    },
    {
      key: "orders_count",
      label: "Orders",
      align: "right",
      render: (_r) => <span className="text-xs text-stone">—</span>,
    },
    {
      key: "last_order_at",
      label: "Last order",
      align: "right",
      hideOnMobile: true,
      sortable: true,
      render: (r) => (
        <span className="text-xs text-stone">
          {r.last_order_at ? new Date(r.last_order_at).toLocaleDateString() : "—"}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <form className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <input
          name="query"
          defaultValue={sp.query ?? ""}
          placeholder="Name or email"
          className="h-10 px-3 border border-line bg-ivory text-sm focus:border-ink focus:outline-none"
        />
        <button
          type="submit"
          className="h-10 text-[11px] uppercase tracking-[0.18em] bg-ink text-ivory"
        >
          Search
        </button>
      </form>
      <DataTable
        rows={data}
        columns={columns}
        rowKey={(r) => r.id}
        initialSort={{ key: "last_order_at", dir: "desc" }}
        emptyTitle="No customers yet"
        emptyDescription="Customers are created at checkout."
      />
    </div>
  );
}
