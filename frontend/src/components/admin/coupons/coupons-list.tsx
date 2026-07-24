"use client";

/**
 * CouponsList — inline add/edit. Each row is collapsed by default,
 * expands into a form on click of "Edit". The "New" button at the
 * top opens an empty form.
 */
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, X, Loader2, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import {
  createCouponAction,
  updateCouponAction,
  deleteCouponAction,
} from "@/lib/actions/admin-coupons";

interface Coupon {
  id: string;
  code: string;
  description: string | null;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  is_active: boolean;
  starts_at: string | null;
  expires_at: string | null;
  usage_limit: number | null;
  times_used: number;
  created_at: string;
}

interface FormState {
  code: string;
  description: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  usage_limit: number | "";
  starts_at: string;
  expires_at: string;
  is_active: boolean;
}

const emptyForm: FormState = {
  code: "",
  description: "",
  discount_type: "percentage",
  discount_value: 10,
  usage_limit: "",
  starts_at: "",
  expires_at: "",
  is_active: true,
};

export function CouponsList({ initial }: { initial: Coupon[] }) {
  const router = useRouter();
  return (
    <div className="space-y-4">
      <p className="text-sm text-stone">
        Codes are case-insensitive. Soft-deleted coupons cannot be redeemed but their redemption history is preserved.
      </p>
      <div className="border border-line bg-ivory">
        {initial.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-stone">No coupons yet.</p>
        ) : (
          <ul>
            {initial.map((c) => (
              <Row key={c.id} coupon={c} onChange={() => router.refresh()} />
            ))}
          </ul>
        )}
        <AddForm onDone={() => router.refresh()} />
      </div>
    </div>
  );
}

function Row({ coupon, onChange }: { coupon: Coupon; onChange: () => void }) {
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState<FormState>({
    code: coupon.code,
    description: coupon.description ?? "",
    discount_type: coupon.discount_type,
    discount_value: Number(coupon.discount_value),
    usage_limit: coupon.usage_limit ?? "",
    starts_at: coupon.starts_at?.slice(0, 16) ?? "",
    expires_at: coupon.expires_at?.slice(0, 16) ?? "",
    is_active: coupon.is_active,
  });

  function save() {
    startTransition(async () => {
      const body: Record<string, any> = {
        code: form.code.trim().toUpperCase(),
        description: form.description || null,
        discount_type: form.discount_type,
        discount_value: Number(form.discount_value),
        usage_limit: form.usage_limit === "" ? null : Number(form.usage_limit),
        starts_at: form.starts_at ? new Date(form.starts_at).toISOString() : null,
        expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
        is_active: form.is_active,
      };
      const res = await updateCouponAction(coupon.id, body);
      if (res.error) toast.error(res.error);
      else {
        toast.success("Saved");
        setEditing(false);
        onChange();
      }
    });
  }

  function remove() {
    if (!confirm(`Delete coupon ${coupon.code}?`)) return;
    startTransition(async () => {
      const res = await deleteCouponAction(coupon.id);
      if (res.error) toast.error(res.error);
      else {
        toast.success("Deleted");
        onChange();
      }
    });
  }

  return (
    <li className="border-b border-line last:border-0">
      {editing ? (
        <div className="p-4 space-y-3 bg-ivory">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label className="block sm:col-span-1">
              <span className="text-[11px] uppercase tracking-[0.18em] text-stone">Code</span>
              <input
                value={form.code}
                onChange={(e) => setForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))}
                className="letty-input font-mono mt-1 w-full"
              />
            </label>
            <label className="block">
              <span className="text-[11px] uppercase tracking-[0.18em] text-stone">Type</span>
              <select
                value={form.discount_type}
                onChange={(e) => setForm((p) => ({ ...p, discount_type: e.target.value as any }))}
                className="letty-input mt-1 w-full"
              >
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed amount</option>
              </select>
            </label>
            <label className="block">
              <span className="text-[11px] uppercase tracking-[0.18em] text-stone">
                {form.discount_type === "percentage" ? "Percent" : "Amount (USD)"}
              </span>
              <input
                type="number"
                min="0"
                step={form.discount_type === "percentage" ? "1" : "0.01"}
                max={form.discount_type === "percentage" ? "100" : undefined}
                value={form.discount_value}
                onChange={(e) => setForm((p) => ({ ...p, discount_value: Number(e.target.value) }))}
                className="letty-input tabular-nums mt-1 w-full"
              />
            </label>
          </div>
          <label className="block">
            <span className="text-[11px] uppercase tracking-[0.18em] text-stone">Description</span>
            <input
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              className="letty-input mt-1 w-full"
              placeholder="Internal note (customers don't see this)"
            />
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label className="block">
              <span className="text-[11px] uppercase tracking-[0.18em] text-stone">Starts at</span>
              <input
                type="datetime-local"
                value={form.starts_at}
                onChange={(e) => setForm((p) => ({ ...p, starts_at: e.target.value }))}
                className="letty-input mt-1 w-full"
              />
            </label>
            <label className="block">
              <span className="text-[11px] uppercase tracking-[0.18em] text-stone">Expires at</span>
              <input
                type="datetime-local"
                value={form.expires_at}
                onChange={(e) => setForm((p) => ({ ...p, expires_at: e.target.value }))}
                className="letty-input mt-1 w-full"
              />
            </label>
            <label className="block">
              <span className="text-[11px] uppercase tracking-[0.18em] text-stone">Usage limit</span>
              <input
                type="number"
                min="0"
                value={form.usage_limit}
                placeholder="unlimited"
                onChange={(e) =>
                  setForm((p) => ({ ...p, usage_limit: e.target.value === "" ? "" : Number(e.target.value) }))
                }
                className="letty-input tabular-nums mt-1 w-full"
              />
            </label>
          </div>
          <label className="inline-flex items-center gap-2 h-9 px-3 border border-line text-sm">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))}
              className="h-3.5 w-3.5 accent-ink"
            />
            <span className="text-stone">Active</span>
          </label>
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-line">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="h-8 px-3 text-[10px] uppercase tracking-[0.18em] text-stone hover:text-ink"
            >
              <X className="h-3.5 w-3.5 inline mr-1" />
              Cancel
            </button>
            <button
              type="button"
              onClick={save}
              disabled={pending}
              className="h-8 px-4 text-[10px] uppercase tracking-[0.18em] bg-ink text-ivory disabled:opacity-60 inline-flex items-center gap-2"
            >
              {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
              Save
            </button>
          </div>
        </div>
      ) : (
        <div className="px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className="font-mono text-sm text-ink">{coupon.code}</span>
            <span className="text-xs text-stone">
              {coupon.discount_type === "percentage" ? `${coupon.discount_value}%` : `$${coupon.discount_value}`}
            </span>
            <span className="text-[11px] uppercase tracking-[0.18em] text-stone">
              {coupon.times_used} used
            </span>
            <span
              className={`inline-block h-2 w-2 ${coupon.is_active ? "bg-ink" : "bg-stone/30"}`}
              aria-label={coupon.is_active ? "active" : "inactive"}
            />
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="h-7 px-2 text-[10px] uppercase tracking-[0.18em] text-stone hover:text-ink inline-flex items-center gap-1"
            >
              <ChevronRight className="h-3 w-3" />
              Edit
            </button>
            <button
              type="button"
              onClick={remove}
              disabled={pending}
              aria-label="Delete"
              className="h-7 w-7 grid place-items-center text-stone hover:text-ink"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </li>
  );
}

function AddForm({ onDone }: { onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState<FormState>(emptyForm);

  function submit() {
    if (!form.code.trim()) {
      toast.error("Code is required");
      return;
    }
    startTransition(async () => {
      const body: Record<string, any> = {
        code: form.code.trim().toUpperCase(),
        description: form.description || null,
        discount_type: form.discount_type,
        discount_value: Number(form.discount_value),
        usage_limit: form.usage_limit === "" ? null : Number(form.usage_limit),
        starts_at: form.starts_at ? new Date(form.starts_at).toISOString() : null,
        expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
        is_active: form.is_active,
      };
      const res = await createCouponAction(body);
      if (res.error) toast.error(res.error);
      else {
        toast.success("Created");
        setOpen(false);
        setForm(emptyForm);
        onDone();
      }
    });
  }

  if (!open) {
    return (
      <div className="px-4 py-3 border-t border-line">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-ink hover:text-stone"
        >
          <Plus className="h-3.5 w-3.5" />
          New coupon
        </button>
      </div>
    );
  }

  return (
    <div className="border-t border-line p-4 space-y-3 bg-ivory">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <label className="block">
          <span className="text-[11px] uppercase tracking-[0.18em] text-stone">Code</span>
          <input
            value={form.code}
            onChange={(e) => setForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))}
            className="letty-input font-mono mt-1 w-full"
            placeholder="SUMMER25"
          />
        </label>
        <label className="block">
          <span className="text-[11px] uppercase tracking-[0.18em] text-stone">Type</span>
          <select
            value={form.discount_type}
            onChange={(e) => setForm((p) => ({ ...p, discount_type: e.target.value as any }))}
            className="letty-input mt-1 w-full"
          >
            <option value="percentage">Percentage</option>
            <option value="fixed">Fixed amount</option>
          </select>
        </label>
        <label className="block">
          <span className="text-[11px] uppercase tracking-[0.18em] text-stone">
            {form.discount_type === "percentage" ? "Percent" : "Amount (USD)"}
          </span>
          <input
            type="number"
            min="0"
            step={form.discount_type === "percentage" ? "1" : "0.01"}
            max={form.discount_type === "percentage" ? "100" : undefined}
            value={form.discount_value}
            onChange={(e) => setForm((p) => ({ ...p, discount_value: Number(e.target.value) }))}
            className="letty-input tabular-nums mt-1 w-full"
          />
        </label>
      </div>
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => setOpen(false)}
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
          Create coupon
        </button>
      </div>
    </div>
  );
}
