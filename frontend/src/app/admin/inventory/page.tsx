/**
 * /admin/inventory — flat list of every variant with stock, reserved,
 * threshold, and quick actions (restock, adjust). Filters: text,
 * low-only.
 */
import Link from "next/link";
import { cookies } from "next/headers";
import { AlertTriangle } from "lucide-react";
import { DataTable, type Column } from "@/components/admin/data-table";
import { InventoryRowActions } from "@/components/admin/inventory/inventory-row-actions";

interface VariantOption {
  id: string;
  option_name: string;
  option_value: string;
}
interface InventoryRow {
  id: string;
  sku: string;
  stock_quantity: number;
  reserved_quantity: number;
  low_stock_threshold: number;
  is_active: boolean;
  product_id: string;
  product: {
    id: string;
    slug: string;
    name: string;
    is_active: boolean;
  } | null;
  variant_options: VariantOption[];
}

interface ListResponse {
  data: InventoryRow[];
  meta?: { total: number; page: number; per_page: number; total_pages: number };
}

export const dynamic = "force-dynamic";

async function fetchInventory(sp: Record<string, string | undefined>) {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
  const cookieHeader = cookies().getAll().map((c) => `${c.name}=${c.value}`).join("; ");
  const url = new URL(`${base}/api/admin/inventory`);
  if (sp.query) url.searchParams.set("query", sp.query);
  if (sp.lowOnly === "1") url.searchParams.set("lowOnly", "true");
  try {
    const res = await fetch(url, {
      headers: cookieHeader ? { cookie: cookieHeader } : undefined,
      cache: "no-store",
    });
    if (!res.ok) return { data: [] as InventoryRow[] };
    const json = (await res.json()) as ListResponse;
    return { data: json.data ?? [] };
  } catch {
    return { data: [] as InventoryRow[] };
  }
}

export default async function InventoryPage(props: { searchParams: Record<string, string> }) {
  const sp = props.searchParams;
  const { data } = await fetchInventory(sp);

  const columns: Column<InventoryRow>[] = [
    {
      key: "product",
      label: "Product",
      sortable: false,
      render: (r) => {
        return (
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-9 w-9 border border-line bg-ivory" />
            <div className="min-w-0">
              <Link
                href={`/admin/products/${r.product_id}`}
                className="text-ink hover:underline underline-offset-2 truncate block"
              >
                {r.product?.name ?? "—"}
              </Link>
              <p className="text-[11px] uppercase tracking-[0.18em] text-stone font-mono">
                {r.sku}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      key: "options",
      label: "Options",
      hideOnMobile: true,
      render: (r) => (
        <span className="text-xs text-stone">
          {r.variant_options.length === 0
            ? "—"
            : r.variant_options.map((o) => `${o.option_name}: ${o.option_value}`).join(" · ")}
        </span>
      ),
    },
    {
      key: "stock_quantity",
      label: "Stock",
      align: "right",
      sortable: true,
      render: (r) => {
        const available = r.stock_quantity - r.reserved_quantity;
        const isLow = available <= r.low_stock_threshold;
        return (
          <div className="flex items-center justify-end gap-1.5">
            {isLow ? <AlertTriangle className="h-3.5 w-3.5 text-stone" /> : null}
            <span className={`tabular-nums ${isLow ? "text-ink" : "text-ink"}`}>
              {r.stock_quantity}
            </span>
            <span className="text-[10px] uppercase tracking-[0.18em] text-stone">
              ({available} avail)
            </span>
          </div>
        );
      },
    },
    {
      key: "reserved_quantity",
      label: "Reserved",
      align: "right",
      hideOnMobile: true,
      render: (r) => <span className="text-xs text-stone tabular-nums">{r.reserved_quantity}</span>,
    },
    {
      key: "low_stock_threshold",
      label: "Threshold",
      align: "right",
      hideOnMobile: true,
      render: (r) => <span className="text-xs text-stone tabular-nums">{r.low_stock_threshold}</span>,
    },
    {
      key: "is_active",
      label: "Status",
      render: (r) => (
        <span
          className={`inline-block h-2 w-2 ${r.is_active ? "bg-ink" : "bg-stone/30"}`}
          aria-label={r.is_active ? "active" : "inactive"}
        />
      ),
    },
    {
      key: "_actions",
      label: "",
      align: "right",
      render: (r) => <InventoryRowActions row={r} />,
    },
  ];

  return (
    <div className="space-y-4">
      <form className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <input
          name="query"
          defaultValue={sp.query ?? ""}
          placeholder="SKU or product"
          className="h-10 px-3 border border-line bg-ivory text-sm focus:border-ink focus:outline-none"
        />
        <label className="h-10 px-3 border border-line bg-ivory text-sm flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            name="lowOnly"
            value="1"
            defaultChecked={sp.lowOnly === "1"}
            className="h-3.5 w-3.5 accent-ink"
          />
          <span className="text-stone">Low stock only</span>
        </label>
        <button
          type="submit"
          className="h-10 text-[11px] uppercase tracking-[0.18em] bg-ink text-ivory"
        >
          Apply
        </button>
      </form>

      <DataTable
        rows={data}
        columns={columns}
        rowKey={(r) => r.id}
        initialSort={{ key: "stock_quantity", dir: "asc" }}
        emptyTitle="No variants found"
        emptyDescription="Create a product first, then add variants from the product page."
      />
    </div>
  );
}
