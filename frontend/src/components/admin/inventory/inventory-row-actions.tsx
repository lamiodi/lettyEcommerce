"use client";

/**
 * Per-row actions for inventory: restock (add quantity) and adjust
 * (set to a specific quantity with a reason). Both open a small
 * inline form; restock is the default.
 */
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Settings, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { restockInventoryAction, adjustInventoryAction } from "@/lib/actions/admin-inventory";

interface InventoryRow {
  id: string;
  sku: string;
  stock_quantity: number;
  reserved_quantity: number;
  low_stock_threshold: number;
  product: { name: string } | null;
}

export function InventoryRowActions({ row }: { row: InventoryRow }) {
  const [open, setOpen] = useState<"restock" | "adjust" | null>(null);
  return (
    <div className="flex items-center justify-end gap-1">
      <button
        type="button"
        onClick={() => setOpen(open === "restock" ? null : "restock")}
        className="inline-flex items-center gap-1 h-8 px-2 text-[10px] uppercase tracking-[0.18em] text-stone hover:text-ink transition"
      >
        <Plus className="h-3 w-3" />
        Restock
      </button>
      <button
        type="button"
        onClick={() => setOpen(open === "adjust" ? null : "adjust")}
        className="inline-flex items-center gap-1 h-8 px-2 text-[10px] uppercase tracking-[0.18em] text-stone hover:text-ink transition"
      >
        <Settings className="h-3 w-3" />
        Adjust
      </button>
      {open ? (
        <Modal
          mode={open}
          row={row}
          onClose={() => setOpen(null)}
          onDone={() => setOpen(null)}
        />
      ) : null}
    </div>
  );
}

function Modal({
  mode,
  row,
  onClose,
  onDone,
}: {
  mode: "restock" | "adjust";
  row: InventoryRow;
  onClose: () => void;
  onDone: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [qty, setQty] = useState<number>(0);
  const [notes, setNotes] = useState("");
  const [reason, setReason] = useState("");

  function submit() {
    startTransition(async () => {
      if (mode === "restock") {
        if (qty <= 0) {
          toast.error("Quantity must be greater than 0");
          return;
        }
        const res = await restockInventoryAction(row.id, { quantity: qty, notes: notes || undefined });
        if (res.error) toast.error(res.error);
        else {
          toast.success(`Restocked. New stock: ${res.data?.new_stock}`);
          router.refresh();
          onDone();
        }
      } else {
        if (qty < 0) {
          toast.error("Quantity must be 0 or greater");
          return;
        }
        if (!reason.trim()) {
          toast.error("Reason is required for adjustments");
          return;
        }
        const res = await adjustInventoryAction(row.id, { new_quantity: qty, reason });
        if (res.error) toast.error(res.error);
        else {
          toast.success(`Adjusted to ${res.data?.new_quantity}`);
          router.refresh();
          onDone();
        }
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30" onClick={onClose}>
      <div
        className="w-[92vw] max-w-md border border-line bg-ivory p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-stone">
              {mode === "restock" ? "Restock" : "Adjust"}
            </p>
            <h3 className="font-serif text-lg text-ink mt-1">
              {row.product?.name ?? row.sku}
            </h3>
            <p className="text-[11px] uppercase tracking-[0.18em] text-stone font-mono mt-1">
              {row.sku} · current {row.stock_quantity} · reserved {row.reserved_quantity}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="h-8 w-8 grid place-items-center text-stone hover:text-ink"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 space-y-4">
          {mode === "restock" ? (
            <>
              <label className="block">
                <span className="text-[11px] uppercase tracking-[0.18em] text-stone">
                  Add quantity
                </span>
                <input
                  type="number"
                  min="1"
                  value={qty || ""}
                  onChange={(e) => setQty(Number(e.target.value))}
                  className="letty-input mt-1 w-full tabular-nums"
                  placeholder="e.g. 50"
                />
              </label>
              <label className="block">
                <span className="text-[11px] uppercase tracking-[0.18em] text-stone">Notes</span>
                <input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="letty-input mt-1 w-full"
                  placeholder="optional"
                />
              </label>
            </>
          ) : (
            <>
              <label className="block">
                <span className="text-[11px] uppercase tracking-[0.18em] text-stone">
                  Set stock to
                </span>
                <input
                  type="number"
                  min="0"
                  value={qty || ""}
                  onChange={(e) => setQty(Number(e.target.value))}
                  className="letty-input mt-1 w-full tabular-nums"
                />
                <span className="mt-1 block text-[11px] text-stone">
                  Currently {row.stock_quantity}. The delta is logged.
                </span>
              </label>
              <label className="block">
                <span className="text-[11px] uppercase tracking-[0.18em] text-stone">
                  Reason *
                </span>
                <input
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="letty-input mt-1 w-full"
                  placeholder="e.g. stock-take, damage, recount"
                />
              </label>
            </>
          )}
        </div>

        <div className="mt-6 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-9 px-4 text-[11px] uppercase tracking-[0.18em] text-stone hover:text-ink"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={pending}
            className="h-9 px-5 text-[11px] uppercase tracking-[0.18em] bg-ink text-ivory disabled:opacity-60 inline-flex items-center gap-2"
          >
            {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            {mode === "restock" ? "Restock" : "Adjust"}
          </button>
        </div>

        <style jsx>{`
          :global(.letty-input) {
            width: 100%;
            background: transparent;
            border: none;
            border-bottom: 1px solid #ECECEC;
            padding: 0.5rem 0;
            font-size: 0.875rem;
            color: #111111;
            border-radius: 0;
          }
          :global(.letty-input:focus) {
            outline: none;
            border-bottom-color: #111111;
          }
        `}</style>
      </div>
    </div>
  );
}
