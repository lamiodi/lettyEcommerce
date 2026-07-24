"use client";

/**
 * VariantsMatrix — list, create, edit and delete variants for a
 * product. The matrix style is editorial: one row per variant with
 * inline editing for SKU, options, stock and price overrides. New
 * variants are added through a small modal-style form at the bottom.
 *
 * Note: this is a list editor, not a true 2D Size × Color generator —
 * that would be a much heavier build. v1 lets you add variants one
 * by one and edit options per row, which is fast enough for typical
 * beauty SKUs (≤30 variants per product).
 */
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  createVariantAction,
  updateVariantAction,
  deleteVariantAction,
  type VariantPayload,
} from "@/lib/actions/admin-products";

interface VariantOption {
  id: string;
  option_name: string;
  option_value: string;
}

interface Variant {
  id: string;
  sku: string;
  barcode: string | null;
  price_override_ngn: number | null;
  price_override_usd: number | null;
  weight_grams: number | null;
  stock_quantity: number;
  reserved_quantity: number;
  low_stock_threshold: number;
  is_active: boolean;
  position: number;
  variant_options: VariantOption[];
}

interface VariantsMatrixProps {
  productId: string;
  initial: Variant[];
}

export function VariantsMatrix({ productId, initial }: VariantsMatrixProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);

  function onDelete(v: Variant) {
    if (!confirm(`Delete variant ${v.sku}?`)) return;
    startTransition(async () => {
      const res = await deleteVariantAction(productId, v.id);
      if (res.error) toast.error(res.error);
      else {
        toast.success("Variant removed");
        router.refresh();
      }
    });
  }

  return (
    <div className="border border-line bg-ivory">
      {initial.length === 0 ? (
        <div className="p-8 text-center">
          <p className="text-sm text-stone">No variants yet. Add one to manage per-SKU stock and pricing.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-line">
              <tr>
                <th className="px-4 py-3 text-left text-[10px] font-medium uppercase tracking-[0.18em] text-stone">SKU</th>
                <th className="px-4 py-3 text-left text-[10px] font-medium uppercase tracking-[0.18em] text-stone">Options</th>
                <th className="px-4 py-3 text-right text-[10px] font-medium uppercase tracking-[0.18em] text-stone">Stock</th>
                <th className="px-4 py-3 text-right text-[10px] font-medium uppercase tracking-[0.18em] text-stone hidden md:table-cell">Reserved</th>
                <th className="px-4 py-3 text-right text-[10px] font-medium uppercase tracking-[0.18em] text-stone hidden md:table-cell">Override NGN</th>
                <th className="px-4 py-3 text-right text-[10px] font-medium uppercase tracking-[0.18em] text-stone hidden md:table-cell">Override USD</th>
                <th className="px-4 py-3 text-center text-[10px] font-medium uppercase tracking-[0.18em] text-stone">Active</th>
                <th className="px-4 py-3 w-10" />
              </tr>
            </thead>
            <tbody>
              {initial.map((v) =>
                editing === v.id ? (
                  <VariantEditRow
                    key={v.id}
                    variant={v}
                    productId={productId}
                    onDone={() => {
                      setEditing(null);
                      router.refresh();
                    }}
                  />
                ) : (
                  <tr key={v.id} className="border-b border-line last:border-0">
                    <td className="px-4 py-3 font-mono text-xs text-ink">{v.sku}</td>
                    <td className="px-4 py-3 text-xs text-stone">
                      {v.variant_options.length === 0
                        ? "—"
                        : v.variant_options.map((o) => `${o.option_name}: ${o.option_value}`).join(" · ")}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">{v.stock_quantity}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-stone hidden md:table-cell">
                      {v.reserved_quantity}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums hidden md:table-cell">
                      {v.price_override_ngn != null ? v.price_override_ngn : "—"}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums hidden md:table-cell">
                      {v.price_override_usd != null ? v.price_override_usd : "—"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-block h-2 w-2 ${v.is_active ? "bg-ink" : "bg-stone/30"}`}
                        aria-label={v.is_active ? "active" : "inactive"}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => setEditing(v.id)}
                          className="h-7 px-2 text-[10px] uppercase tracking-[0.18em] text-stone hover:text-ink"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(v)}
                          disabled={pending}
                          aria-label="Delete variant"
                          className="h-7 w-7 grid place-items-center text-stone hover:text-ink"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
      )}

      {adding ? (
        <VariantAddForm
          productId={productId}
          onDone={() => {
            setAdding(false);
            router.refresh();
          }}
          onCancel={() => setAdding(false)}
        />
      ) : (
        <div className="px-4 py-3 border-t border-line">
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-ink hover:text-stone transition"
          >
            <Plus className="h-3.5 w-3.5" />
            Add variant
          </button>
        </div>
      )}
    </div>
  );
}

function VariantEditRow({
  variant,
  productId,
  onDone,
}: {
  variant: Variant;
  productId: string;
  onDone: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [stock, setStock] = useState(variant.stock_quantity);
  const [overrideNgn, setOverrideNgn] = useState<string>(variant.price_override_ngn?.toString() ?? "");
  const [overrideUsd, setOverrideUsd] = useState<string>(variant.price_override_usd?.toString() ?? "");
  const [active, setActive] = useState(variant.is_active);
  const [threshold, setThreshold] = useState(variant.low_stock_threshold);

  function save() {
    startTransition(async () => {
      const body: Partial<VariantPayload> = {
        stock_quantity: stock,
        low_stock_threshold: threshold,
        price_override_ngn: overrideNgn === "" ? null : Number(overrideNgn),
        price_override_usd: overrideUsd === "" ? null : Number(overrideUsd),
        is_active: active,
      };
      const res = await updateVariantAction(productId, variant.id, body);
      if (res.error) toast.error(res.error);
      else {
        toast.success("Variant saved");
        onDone();
      }
    });
  }

  return (
    <tr className="border-b border-line bg-ivory/60">
      <td className="px-4 py-3 font-mono text-xs text-ink">{variant.sku}</td>
      <td className="px-4 py-3 text-xs text-stone">
        {variant.variant_options.map((o) => `${o.option_name}: ${o.option_value}`).join(" · ") || "—"}
      </td>
      <td className="px-4 py-2 text-right">
        <input
          type="number"
          min="0"
          value={stock}
          onChange={(e) => setStock(Number(e.target.value))}
          className="letty-input-sm w-20 text-right tabular-nums"
        />
      </td>
      <td className="px-4 py-2 text-right hidden md:table-cell">
        <span className="text-xs text-stone tabular-nums">{variant.reserved_quantity}</span>
      </td>
      <td className="px-4 py-2 text-right hidden md:table-cell">
        <input
          type="number"
          min="0"
          step="0.01"
          value={overrideNgn}
          placeholder="—"
          onChange={(e) => setOverrideNgn(e.target.value)}
          className="letty-input-sm w-24 text-right tabular-nums"
        />
      </td>
      <td className="px-4 py-2 text-right hidden md:table-cell">
        <input
          type="number"
          min="0"
          step="0.01"
          value={overrideUsd}
          placeholder="—"
          onChange={(e) => setOverrideUsd(e.target.value)}
          className="letty-input-sm w-24 text-right tabular-nums"
        />
      </td>
      <td className="px-4 py-2 text-center">
        <input
          type="checkbox"
          checked={active}
          onChange={(e) => setActive(e.target.checked)}
          className="h-3.5 w-3.5 accent-ink"
        />
      </td>
      <td className="px-4 py-2">
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={save}
            disabled={pending}
            className="h-7 px-3 text-[10px] uppercase tracking-[0.18em] bg-ink text-ivory disabled:opacity-60"
          >
            {pending ? "…" : "Save"}
          </button>
          <button
            type="button"
            onClick={onDone}
            aria-label="Cancel"
            className="h-7 w-7 grid place-items-center text-stone hover:text-ink"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </td>
      <td colSpan={8} className="px-4 pb-3 -mt-2">
        <div className="flex items-center gap-3 text-[11px] text-stone">
          <span>Low-stock threshold</span>
          <input
            type="number"
            min="0"
            value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value))}
            className="letty-input-sm w-20 text-right tabular-nums"
          />
        </div>
      </td>

      <style jsx>{`
        :global(.letty-input-sm) {
          width: 100%;
          background: transparent;
          border: none;
          border-bottom: 1px solid #ECECEC;
          padding: 0.25rem 0;
          font-size: 0.75rem;
          color: #111111;
          border-radius: 0;
        }
        :global(.letty-input-sm:focus) {
          outline: none;
          border-bottom-color: #111111;
        }
      `}</style>
    </tr>
  );
}

function VariantAddForm({
  productId,
  onDone,
  onCancel,
}: {
  productId: string;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [sku, setSku] = useState("");
  const [stock, setStock] = useState(0);
  const [threshold, setThreshold] = useState(5);
  const [overrideNgn, setOverrideNgn] = useState("");
  const [overrideUsd, setOverrideUsd] = useState("");
  const [options, setOptions] = useState<Array<{ option_name: string; option_value: string }>>([
    { option_name: "Size", option_value: "" },
  ]);

  function addOption() {
    setOptions((o) => [...o, { option_name: "", option_value: "" }]);
  }
  function removeOption(i: number) {
    setOptions((o) => o.filter((_, idx) => idx !== i));
  }
  function setOption(i: number, k: "option_name" | "option_value", v: string) {
    setOptions((o) => o.map((x, idx) => (idx === i ? { ...x, [k]: v } : x)));
  }

  function submit() {
    if (!sku.trim()) {
      toast.error("SKU is required");
      return;
    }
    const cleanOptions = options.filter((o) => o.option_name.trim() && o.option_value.trim());
    const body: VariantPayload = {
      sku: sku.trim(),
      stock_quantity: stock,
      low_stock_threshold: threshold,
      is_active: true,
      price_override_ngn: overrideNgn === "" ? null : Number(overrideNgn),
      price_override_usd: overrideUsd === "" ? null : Number(overrideUsd),
      options: cleanOptions,
    };
    startTransition(async () => {
      const res = await createVariantAction(productId, body);
      if (res.error) toast.error(res.error);
      else {
        toast.success("Variant added");
        onDone();
      }
    });
  }

  return (
    <div className="border-t border-line p-5 sm:p-6 space-y-4 bg-ivory">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <label className="block sm:col-span-1">
          <span className="text-[11px] uppercase tracking-[0.18em] text-stone">SKU *</span>
          <input
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            className="letty-input-sm mt-1 w-full"
            placeholder="e.g. LET-ROS-30ML"
          />
        </label>
        <label className="block">
          <span className="text-[11px] uppercase tracking-[0.18em] text-stone">Initial stock</span>
          <input
            type="number"
            min="0"
            value={stock}
            onChange={(e) => setStock(Number(e.target.value))}
            className="letty-input-sm mt-1 w-full tabular-nums"
          />
        </label>
        <label className="block">
          <span className="text-[11px] uppercase tracking-[0.18em] text-stone">Low-stock alert at</span>
          <input
            type="number"
            min="0"
            value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value))}
            className="letty-input-sm mt-1 w-full tabular-nums"
          />
        </label>
        <label className="block">
          <span className="text-[11px] uppercase tracking-[0.18em] text-stone">Price override · NGN</span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={overrideNgn}
            placeholder="blank = use base"
            onChange={(e) => setOverrideNgn(e.target.value)}
            className="letty-input-sm mt-1 w-full tabular-nums"
          />
        </label>
        <label className="block">
          <span className="text-[11px] uppercase tracking-[0.18em] text-stone">Price override · USD</span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={overrideUsd}
            placeholder="blank = use base"
            onChange={(e) => setOverrideUsd(e.target.value)}
            className="letty-input-sm mt-1 w-full tabular-nums"
          />
        </label>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] uppercase tracking-[0.18em] text-stone">Options</span>
          <button
            type="button"
            onClick={addOption}
            className="inline-flex items-center gap-1 text-[11px] uppercase tracking-[0.18em] text-ink hover:text-stone"
          >
            <Plus className="h-3 w-3" />
            Add option
          </button>
        </div>
        <div className="space-y-2">
          {options.map((o, i) => (
            <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-3">
              <input
                value={o.option_name}
                onChange={(e) => setOption(i, "option_name", e.target.value)}
                placeholder="Name (Size, Color…)"
                className="letty-input-sm"
              />
              <input
                value={o.option_value}
                onChange={(e) => setOption(i, "option_value", e.target.value)}
                placeholder="Value (30ml, Red…)"
                className="letty-input-sm"
              />
              <button
                type="button"
                onClick={() => removeOption(i)}
                aria-label="Remove option"
                className="h-8 w-8 grid place-items-center text-stone hover:text-ink"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 pt-2 border-t border-line">
        <button
          type="button"
          onClick={onCancel}
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
          Save variant
        </button>
      </div>
    </div>
  );
}
