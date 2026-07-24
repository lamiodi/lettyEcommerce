"use client";

/**
 * GiftCardsList — table view + issue form. Inline void/restore.
 */
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, Loader2, Ban } from "lucide-react";
import { toast } from "sonner";
import { createGiftCardAction, updateGiftCardAction } from "@/lib/actions/admin-settings";
import { CurrencyCell, type AdminCurrency } from "@/components/admin/currency-cell";
import { StatusPill } from "@/components/admin/status-pill";

interface GiftCard {
  id: string;
  code: string;
  initial_balance: number;
  current_balance: number;
  currency: string;
  recipient_email: string;
  recipient_name: string | null;
  status: string;
  expires_at: string | null;
  created_at: string;
}

export function GiftCardsList({ initial }: { initial: GiftCard[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-ink hover:text-stone"
        >
          <Plus className="h-3.5 w-3.5" />
          Issue card
        </button>
      </div>

      {open ? <IssueForm onCancel={() => setOpen(false)} onDone={() => { setOpen(false); router.refresh(); }} /> : null}

      <div className="border border-line bg-ivory overflow-x-auto">
        {initial.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-stone">No gift cards yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-line">
              <tr>
                <th className="px-4 py-3 text-left text-[10px] uppercase tracking-[0.18em] text-stone">Code</th>
                <th className="px-4 py-3 text-left text-[10px] uppercase tracking-[0.18em] text-stone">Recipient</th>
                <th className="px-4 py-3 text-right text-[10px] uppercase tracking-[0.18em] text-stone">Balance</th>
                <th className="px-4 py-3 text-right text-[10px] uppercase tracking-[0.18em] text-stone hidden md:table-cell">Initial</th>
                <th className="px-4 py-3 text-center text-[10px] uppercase tracking-[0.18em] text-stone">Status</th>
                <th className="px-4 py-3 w-10" />
              </tr>
            </thead>
            <tbody>
              {initial.map((g) => (
                <Row key={g.id} card={g} onChange={() => router.refresh()} />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function Row({ card, onChange }: { card: GiftCard; onChange: () => void }) {
  const [pending, startTransition] = useTransition();
  const currency = card.currency as AdminCurrency;
  function voidCard() {
    if (!confirm(`Void card ${card.code}?`)) return;
    startTransition(async () => {
      const res = await updateGiftCardAction(card.id, { status: "void" });
      if (res.error) toast.error(res.error);
      else {
        toast.success("Voided");
        onChange();
      }
    });
  }
  return (
    <tr className="border-b border-line last:border-0">
      <td className="px-4 py-3 font-mono text-xs text-ink">{card.code}</td>
      <td className="px-4 py-3 text-xs">
        <p className="text-ink">{card.recipient_name ?? "—"}</p>
        <p className="text-stone">{card.recipient_email}</p>
      </td>
      <td className="px-4 py-3 text-right tabular-nums">
        <CurrencyCell amount={card.current_balance} currency={currency} />
      </td>
      <td className="px-4 py-3 text-right tabular-nums text-stone hidden md:table-cell">
        <CurrencyCell amount={card.initial_balance} currency={currency} />
      </td>
      <td className="px-4 py-3 text-center">
        <StatusPill
          label={card.status}
          tone={card.status === "active" ? "positive" : card.status === "void" ? "negative" : "pending"}
        />
      </td>
      <td className="px-4 py-3 text-right">
        {card.status === "active" ? (
          <button
            type="button"
            onClick={voidCard}
            disabled={pending}
            aria-label="Void"
            className="h-7 w-7 grid place-items-center text-stone hover:text-ink"
          >
            <Ban className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </td>
    </tr>
  );
}

function IssueForm({ onCancel, onDone }: { onCancel: () => void; onDone: () => void }) {
  const [pending, startTransition] = useTransition();
  const [amount, setAmount] = useState(0);
  const [currency, setCurrency] = useState("USD");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [issued, setIssued] = useState<{ code: string } | null>(null);

  function submit() {
    if (!email || amount <= 0) {
      toast.error("Amount and email are required");
      return;
    }
    startTransition(async () => {
      const res = await createGiftCardAction({
        initial_balance: amount,
        currency,
        recipient_email: email,
        recipient_name: name || null,
      });
      if (res.error || !res.data) toast.error(res.error ?? "Failed");
      else {
        toast.success("Card issued");
        setIssued(res.data);
        onDone();
      }
    });
  }

  return (
    <div className="border border-line bg-ivory p-4 space-y-3">
      {issued ? (
        <p className="text-sm text-ink">
          New card code: <span className="font-mono">{issued.code}</span>
        </p>
      ) : null}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <label className="block">
          <span className="text-[11px] uppercase tracking-[0.18em] text-stone">Amount</span>
          <input type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(Number(e.target.value))} className="letty-input tabular-nums mt-1 w-full" />
        </label>
        <label className="block">
          <span className="text-[11px] uppercase tracking-[0.18em] text-stone">Currency</span>
          <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="letty-input mt-1 w-full">
            {["USD", "NGN", "EUR", "GBP", "GHS", "ZAR", "KES"].map((c) => (<option key={c}>{c}</option>))}
          </select>
        </label>
        <label className="block">
          <span className="text-[11px] uppercase tracking-[0.18em] text-stone">Recipient email</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="letty-input mt-1 w-full" />
        </label>
        <label className="block">
          <span className="text-[11px] uppercase tracking-[0.18em] text-stone">Name (optional)</span>
          <input value={name} onChange={(e) => setName(e.target.value)} className="letty-input mt-1 w-full" />
        </label>
      </div>
      <div className="flex items-center justify-end gap-2">
        <button type="button" onClick={onCancel} className="h-9 px-3 text-[11px] uppercase tracking-[0.18em] text-stone">
          <X className="h-3.5 w-3.5 inline mr-1" /> Cancel
        </button>
        <button type="button" onClick={submit} disabled={pending} className="h-9 px-4 text-[11px] uppercase tracking-[0.18em] bg-ink text-ivory disabled:opacity-60 inline-flex items-center gap-2">
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null} Issue
        </button>
      </div>
    </div>
  );
}
