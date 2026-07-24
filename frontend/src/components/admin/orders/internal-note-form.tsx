"use client";

/**
 * InternalNoteForm — small textarea + save button for staff notes.
 * Notes are only visible to admins; they're surfaced in the order
 * detail and shipped to the customer's email in some templates.
 */
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { setInternalNoteAction } from "@/lib/actions/admin-orders";

export function InternalNoteForm({ orderId, initial }: { orderId: string; initial: string }) {
  const [note, setNote] = useState(initial);
  const [isPending, startTransition] = useTransition();

  function save() {
    startTransition(async () => {
      try {
        const res = await setInternalNoteAction(orderId, note);
        if (res?.error) {
          toast.error(res.error);
          return;
        }
        toast.success("Note saved.");
      } catch (err) {
        toast.error((err as Error).message);
      }
    });
  }

  return (
    <section className="border border-line bg-ivory p-4">
      <label htmlFor="internal-note" className="block text-[11px] uppercase tracking-[0.18em] text-stone mb-2">
        Internal note
      </label>
      <textarea
        id="internal-note"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={3}
        className="w-full px-3 py-2 border border-line bg-ivory text-sm focus:border-ink focus:outline-none resize-none"
        placeholder="Visible to staff only."
      />
      <div className="mt-3 flex justify-end">
        <button
          type="button"
          onClick={save}
          disabled={isPending}
          className="h-9 px-4 text-[11px] uppercase tracking-[0.18em] bg-ink text-ivory disabled:opacity-50"
        >
          {isPending ? "Saving…" : "Save note"}
        </button>
      </div>
    </section>
  );
}
