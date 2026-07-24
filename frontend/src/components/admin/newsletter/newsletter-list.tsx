"use client";

/**
 * NewsletterList — search + table + add form. Toggle / delete
 * per row.
 */
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  addSubscriberAction,
  toggleSubscriberAction,
  removeSubscriberAction,
} from "@/lib/actions/admin-newsletter";

interface Subscriber {
  id: string;
  email: string;
  source: string | null;
  is_subscribed: boolean;
  created_at: string;
}

export function NewsletterList({ initial }: { initial: Subscriber[] }) {
  const router = useRouter();
  return (
    <div className="space-y-4">
      <p className="text-sm text-stone">
        Subscribers receive welcome + abandoned cart + product announcements. Manage individual opt-outs by toggling active.
      </p>
      <AddForm onDone={() => router.refresh()} />
      <div className="border border-line bg-ivory overflow-x-auto">
        {initial.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-stone">No subscribers yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-line">
              <tr>
                <th className="px-4 py-3 text-left text-[10px] uppercase tracking-[0.18em] text-stone">Email</th>
                <th className="px-4 py-3 text-left text-[10px] uppercase tracking-[0.18em] text-stone hidden md:table-cell">Source</th>
                <th className="px-4 py-3 text-center text-[10px] uppercase tracking-[0.18em] text-stone">Active</th>
                <th className="px-4 py-3 text-right text-[10px] uppercase tracking-[0.18em] text-stone hidden md:table-cell">Subscribed</th>
                <th className="px-4 py-3 w-10" />
              </tr>
            </thead>
            <tbody>
              {initial.map((s) => (
                <Row key={s.id} sub={s} onChange={() => router.refresh()} />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function Row({ sub, onChange }: { sub: Subscriber; onChange: () => void }) {
  const [pending, startTransition] = useTransition();
  function toggle() {
    startTransition(async () => {
      const res = await toggleSubscriberAction(sub.id, !sub.is_subscribed);
      if (res.error) toast.error(res.error);
      else {
        toast.success(sub.is_subscribed ? "Unsubscribed" : "Subscribed");
        onChange();
      }
    });
  }
  function remove() {
    if (!confirm(`Remove ${sub.email}?`)) return;
    startTransition(async () => {
      const res = await removeSubscriberAction(sub.id);
      if (res.error) toast.error(res.error);
      else {
        toast.success("Removed");
        onChange();
      }
    });
  }
  return (
    <tr className="border-b border-line last:border-0">
      <td className="px-4 py-3 text-ink">{sub.email}</td>
      <td className="px-4 py-3 text-xs text-stone hidden md:table-cell">{sub.source ?? "—"}</td>
      <td className="px-4 py-3 text-center">
        <input
          type="checkbox"
          checked={sub.is_subscribed}
          onChange={toggle}
          disabled={pending}
          className="h-3.5 w-3.5 accent-ink"
        />
      </td>
      <td className="px-4 py-3 text-right text-xs text-stone hidden md:table-cell">
        {new Date(sub.created_at).toLocaleDateString()}
      </td>
      <td className="px-4 py-3 text-right">
        <button type="button" onClick={remove} disabled={pending} aria-label="Delete" className="h-7 w-7 grid place-items-center text-stone hover:text-ink">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </td>
    </tr>
  );
}

function AddForm({ onDone }: { onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [source, setSource] = useState("admin");

  function submit() {
    if (!email) {
      toast.error("Email is required");
      return;
    }
    startTransition(async () => {
      const res = await addSubscriberAction({ email, source });
      if (res.error) toast.error(res.error);
      else {
        toast.success("Subscribed");
        setOpen(false);
        setEmail("");
        onDone();
      }
    });
  }

  if (!open) {
    return (
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-ink hover:text-stone"
        >
          <Plus className="h-3.5 w-3.5" />
          Add subscriber
        </button>
      </div>
    );
  }

  return (
    <div className="border border-line bg-ivory p-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <label className="block sm:col-span-2">
          <span className="text-[11px] uppercase tracking-[0.18em] text-stone">Email</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="letty-input mt-1 w-full" />
        </label>
        <label className="block">
          <span className="text-[11px] uppercase tracking-[0.18em] text-stone">Source</span>
          <input value={source} onChange={(e) => setSource(e.target.value)} className="letty-input mt-1 w-full" />
        </label>
      </div>
      <div className="mt-3 flex items-center justify-end gap-2">
        <button type="button" onClick={() => setOpen(false)} className="h-9 px-3 text-[11px] uppercase tracking-[0.18em] text-stone">
          <X className="h-3.5 w-3.5 inline mr-1" /> Cancel
        </button>
        <button type="button" onClick={submit} disabled={pending} className="h-9 px-4 text-[11px] uppercase tracking-[0.18em] bg-ink text-ivory disabled:opacity-60 inline-flex items-center gap-2">
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null} Add
        </button>
      </div>
    </div>
  );
}
