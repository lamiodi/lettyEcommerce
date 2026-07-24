"use client";

/**
 * TaxRulesList — flat list with inline add/edit/delete.
 */
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  createTaxRuleAction,
  updateTaxRuleAction,
  deleteTaxRuleAction,
} from "@/lib/actions/admin-shipping";

interface TaxRule {
  id: string;
  country: string;
  state: string | null;
  rate: number;
  is_inclusive: boolean;
  created_at: string;
  updated_at: string;
}

export function TaxRulesList({ initial }: { initial: TaxRule[] }) {
  const router = useRouter();
  return (
    <div className="space-y-4">
      <p className="text-sm text-stone">
        Tax is computed at checkout. The first matching rule (country + state) wins. Leave state blank to apply a country-wide rate.
      </p>
      <div className="border border-line bg-ivory">
        {initial.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-stone">No tax rules yet.</p>
        ) : (
          <ul>
            {initial.map((r) => (
              <Row
                key={r.id}
                rule={r}
                onChange={() => router.refresh()}
              />
            ))}
          </ul>
        )}
        <AddForm onDone={() => router.refresh()} />
      </div>
    </div>
  );
}

function Row({ rule, onChange }: { rule: TaxRule; onChange: () => void }) {
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();
  const [country, setCountry] = useState(rule.country);
  const [state, setState] = useState(rule.state ?? "");
  const [rate, setRate] = useState(rule.rate);
  const [inclusive, setInclusive] = useState(rule.is_inclusive);

  function save() {
    if (country.length !== 2) {
      toast.error("Country must be a 2-letter ISO code");
      return;
    }
    startTransition(async () => {
      const res = await updateTaxRuleAction(rule.id, {
        country: country.toUpperCase(),
        state: state.trim() || null,
        rate,
        is_inclusive: inclusive,
      });
      if (res.error) toast.error(res.error);
      else {
        toast.success("Saved");
        setEditing(false);
        onChange();
      }
    });
  }

  function remove() {
    if (!confirm("Delete this tax rule?")) return;
    startTransition(async () => {
      const res = await deleteTaxRuleAction(rule.id);
      if (res.error) toast.error(res.error);
      else {
        toast.success("Removed");
        onChange();
      }
    });
  }

  return (
    <li className="border-b border-line last:border-0 px-4 py-3">
      {editing ? (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="NG" className="letty-input" />
            <input value={state} onChange={(e) => setState(e.target.value)} placeholder="State (optional)" className="letty-input" />
            <input
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={rate}
              onChange={(e) => setRate(Number(e.target.value))}
              className="letty-input tabular-nums"
            />
            <label className="inline-flex items-center gap-2 h-10 px-3 border border-line text-sm">
              <input
                type="checkbox"
                checked={inclusive}
                onChange={(e) => setInclusive(e.target.checked)}
                className="h-3.5 w-3.5 accent-ink"
              />
              <span className="text-stone">Inclusive</span>
            </label>
          </div>
          <div className="flex items-center justify-end gap-2">
            <button type="button" onClick={() => setEditing(false)} className="h-8 px-3 text-[10px] uppercase tracking-[0.18em] text-stone">
              Cancel
            </button>
            <button type="button" onClick={save} disabled={pending} className="h-8 px-4 text-[10px] uppercase tracking-[0.18em] bg-ink text-ivory disabled:opacity-60 inline-flex items-center gap-2">
              {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : null} Save
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className="font-mono text-xs text-ink">{rule.country}</span>
            <span className="text-xs text-stone">{rule.state ?? "—"}</span>
            <span className="text-sm text-ink tabular-nums">{rule.rate}%</span>
            <span className="text-[11px] uppercase tracking-[0.18em] text-stone">
              {rule.is_inclusive ? "inclusive" : "exclusive"}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => setEditing(true)} className="h-7 px-2 text-[10px] uppercase tracking-[0.18em] text-stone hover:text-ink">
              Edit
            </button>
            <button type="button" onClick={remove} disabled={pending} aria-label="Delete" className="h-7 w-7 grid place-items-center text-stone hover:text-ink">
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
  const [country, setCountry] = useState("");
  const [state, setState] = useState("");
  const [rate, setRate] = useState(0);
  const [inclusive, setInclusive] = useState(true);

  function submit() {
    if (country.length !== 2) {
      toast.error("Country must be a 2-letter ISO code");
      return;
    }
    startTransition(async () => {
      const res = await createTaxRuleAction({
        country: country.toUpperCase(),
        state: state.trim() || null,
        rate,
        is_inclusive: inclusive,
      });
      if (res.error) toast.error(res.error);
      else {
        toast.success("Rule created");
        setOpen(false);
        setCountry("");
        setState("");
        setRate(0);
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
          New tax rule
        </button>
      </div>
    );
  }

  return (
    <div className="border-t border-line p-4 space-y-3 bg-ivory">
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="NG" className="letty-input" />
        <input value={state} onChange={(e) => setState(e.target.value)} placeholder="State (optional)" className="letty-input" />
        <input
          type="number"
          min="0"
          max="100"
          step="0.01"
          value={rate}
          onChange={(e) => setRate(Number(e.target.value))}
          className="letty-input tabular-nums"
        />
        <label className="inline-flex items-center gap-2 h-10 px-3 border border-line text-sm">
          <input
            type="checkbox"
            checked={inclusive}
            onChange={(e) => setInclusive(e.target.checked)}
            className="h-3.5 w-3.5 accent-ink"
          />
          <span className="text-stone">Inclusive</span>
        </label>
      </div>
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="h-9 px-4 text-[11px] uppercase tracking-[0.18em] text-stone hover:text-ink"
        >
          <X className="h-3.5 w-3.5 inline mr-1" />
          Cancel
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={pending}
          className="h-9 px-5 text-[11px] uppercase tracking-[0.18em] bg-ink text-ivory disabled:opacity-60 inline-flex items-center gap-2"
        >
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          Add rule
        </button>
      </div>
    </div>
  );
}
