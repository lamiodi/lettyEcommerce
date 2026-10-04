"use client";

import { useState } from "react";
import { Check, Loader2 } from "lucide-react";

/**
 * Confirm-then-record flow for the satisfaction survey.
 *
 * The survey email links here with ?score=N&order=X. The rating is only
 * persisted after an explicit confirm click: email-provider prefetch bots
 * (Gmail/Outlook) follow links on open, so recording on page load would
 * fabricate ratings.
 */
export default function FeedbackRecorder({ score, order }: { score: number; order: string | null }) {
  const [state, setState] = useState<"confirm" | "saving" | "recorded" | "error">("confirm");

  const confirm = async () => {
    setState("saving");
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score, order_number: order ?? undefined }),
      });
      if (!res.ok) throw new Error();
      setState("recorded");
    } catch {
      setState("error");
    }
  };

  if (state === "recorded") {
    return (
      <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-line bg-secondary px-4 py-1.5 text-xs text-stone">
        <Check className="h-3.5 w-3.5 text-emerald-700" />
        <span>Recorded Rating:</span>
        <strong className="text-ink font-semibold">{score} / 10</strong>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="mt-4 space-y-3">
        <p className="text-xs text-red-700">
          We could not record your rating just now. Please try again — it only takes a moment.
        </p>
        <button
          type="button"
          onClick={confirm}
          className="inline-flex h-11 items-center justify-center border border-ink bg-ink px-6 text-xs font-medium uppercase tracking-[0.22em] text-ivory transition hover:bg-stone hover:border-stone cursor-pointer"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="mt-4 flex flex-col items-center gap-3">
      <div className="inline-flex items-center gap-2 rounded-full border border-line bg-secondary px-4 py-1.5 text-xs text-stone">
        <span>Your rating:</span>
        <strong className="text-ink font-semibold">{score} / 10</strong>
      </div>
      <button
        type="button"
        onClick={confirm}
        disabled={state === "saving"}
        className="inline-flex h-11 items-center justify-center border border-ink bg-ink px-6 text-xs font-medium uppercase tracking-[0.22em] text-ivory transition hover:bg-stone hover:border-stone cursor-pointer disabled:opacity-60"
      >
        {state === "saving" ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />
            Recording
          </>
        ) : (
          "Confirm Your Rating"
        )}
      </button>
    </div>
  );
}
