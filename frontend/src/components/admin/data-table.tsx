"use client";

/**
 * DataTable — sortable, paginated, filterable, multi-select table for
 * the admin. Built on a plain <table> with Tailwind; no shadcn/ui.
 *
 * Each row is identified by `rowKey(row)`. Columns are configured with
 * `label`, `key`, optional `align`, and an optional `render` for
 * custom cells. The selected row ids are exposed via `onSelectedChange`
 * so the parent can do bulk actions.
 *
 * Styling: hairline border, no rounded corners, no shadows. Sticky
 * header on tall lists. Empty state via <EmptyState />.
 */
import { useMemo, useState, type ReactNode } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { EmptyState } from "./empty-state";

export interface Column<T> {
  label: string;
  key: string;
  align?: "left" | "right" | "center";
  sortable?: boolean;
  /** Custom cell renderer. Defaults to row[key] (stringified). */
  render?: (row: T) => ReactNode;
  /** Hide the column on small screens. */
  hideOnMobile?: boolean;
  /** ClassName applied to <th> and <td>. */
  className?: string;
}

interface DataTableProps<T> {
  rows: T[];
  columns: Column<T>[];
  rowKey: (row: T) => string;
  /** Initial sort spec. */
  initialSort?: { key: string; dir: "asc" | "desc" };
  /** Optional row-level click handler (for "open detail" patterns). */
  onRowClick?: (row: T) => void;
  /** Optional bulk-select toggle. */
  enableSelection?: boolean;
  onSelectedChange?: (ids: string[]) => void;
  /** Render slot above the table (filters, search). */
  toolbar?: ReactNode;
  /** Empty state content. */
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
  /** Loading state. */
  loading?: boolean;
  /** Page size. Default 20. */
  pageSize?: number;
}

export function DataTable<T>({
  rows,
  columns,
  rowKey,
  initialSort,
  onRowClick,
  enableSelection = false,
  onSelectedChange,
  toolbar,
  emptyTitle = "Nothing here yet",
  emptyDescription,
  emptyAction,
  loading = false,
  pageSize = 20,
}: DataTableProps<T>) {
  const [sort, setSort] = useState(initialSort ?? null);
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const sorted = useMemo(() => {
    if (!sort) return rows;
    const col = columns.find((c) => c.key === sort.key);
    if (!col) return rows;
    const dir = sort.dir === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      const av = (a as any)[sort.key];
      const bv = (b as any)[sort.key];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });
  }, [rows, sort, columns]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const pageRows = sorted.slice(page * pageSize, page * pageSize + pageSize);

  function toggleSort(key: string) {
    if (sort?.key === key) {
      setSort({ key, dir: sort.dir === "asc" ? "desc" : "asc" });
    } else {
      setSort({ key, dir: "asc" });
    }
  }

  function toggleAll() {
    if (selected.size === pageRows.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(pageRows.map(rowKey)));
    }
    onSelectedChange?.([...selected]);
  }

  function toggleOne(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
    onSelectedChange?.([...next]);
  }

  return (
    <div className="border border-line bg-ivory">
      {toolbar ? <div className="px-4 py-3 border-b border-line">{toolbar}</div> : null}
      {loading ? (
        <div className="px-6 py-12 text-center text-xs uppercase tracking-[0.2em] text-stone">
          Loading…
        </div>
      ) : sorted.length === 0 ? (
        <EmptyState
          title={emptyTitle}
          description={emptyDescription}
          action={emptyAction}
        />
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-line">
                <tr>
                  {enableSelection ? (
                    <th className="w-10 px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        aria-label="Select all"
                        checked={pageRows.length > 0 && selected.size === pageRows.length}
                        onChange={toggleAll}
                        className="h-3.5 w-3.5 accent-ink"
                      />
                    </th>
                  ) : null}
                  {columns.map((c) => (
                    <th
                      key={c.key}
                      className={`px-4 py-3 text-[10px] font-medium uppercase tracking-[0.18em] text-stone ${
                        c.hideOnMobile ? "hidden md:table-cell" : ""
                      } ${c.className ?? ""}`}
                      style={{ textAlign: c.align ?? "left" }}
                    >
                      {c.sortable ? (
                        <button
                          type="button"
                          onClick={() => toggleSort(c.key)}
                          className="inline-flex items-center gap-1 hover:text-ink transition"
                        >
                          {c.label}
                          {sort?.key === c.key ? (
                            sort.dir === "asc" ? (
                              <ChevronUp className="h-3 w-3" />
                            ) : (
                              <ChevronDown className="h-3 w-3" />
                            )
                          ) : null}
                        </button>
                      ) : (
                        c.label
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageRows.map((row) => {
                  const id = rowKey(row);
                  const isSel = selected.has(id);
                  return (
                    <tr
                      key={id}
                      onClick={onRowClick ? () => onRowClick(row) : undefined}
                      className={`border-b border-line last:border-0 ${
                        onRowClick ? "cursor-pointer hover:bg-ivory/60" : ""
                      } ${isSel ? "bg-ivory" : ""}`}
                    >
                      {enableSelection ? (
                        <td className="w-10 px-4 py-3">
                          <input
                            type="checkbox"
                            checked={isSel}
                            onChange={() => toggleOne(id)}
                            onClick={(e) => e.stopPropagation()}
                            aria-label={`Select ${id}`}
                            className="h-3.5 w-3.5 accent-ink"
                          />
                        </td>
                      ) : null}
                      {columns.map((c) => (
                        <td
                          key={c.key}
                          className={`px-4 py-3 text-ink ${
                            c.hideOnMobile ? "hidden md:table-cell" : ""
                          } ${c.className ?? ""}`}
                          style={{ textAlign: c.align ?? "left" }}
                        >
                          {c.render ? c.render(row) : String((row as any)[c.key] ?? "")}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {pageCount > 1 ? (
            <div className="flex items-center justify-between px-4 py-3 border-t border-line text-[11px] uppercase tracking-[0.18em] text-stone">
              <span>
                Page {page + 1} of {pageCount} · {sorted.length} total
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={page === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  className="hover:text-ink transition disabled:opacity-30 disabled:hover:text-stone"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={page >= pageCount - 1}
                  onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                  className="hover:text-ink transition disabled:opacity-30 disabled:hover:text-stone"
                >
                  Next
                </button>
              </div>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
