"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

export function UnsubscribeForm() {
  const token = useSearchParams().get("token");
  const [status, setStatus] = useState<"idle" | "saving" | "done">("idle");
  const [error, setError] = useState("");

  async function unsubscribe() {
    if (!token || status === "saving") return;
    setStatus("saving");
    setError("");
    try {
      const response = await fetch("/api/newsletter/unsubscribe", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }), signal: AbortSignal.timeout(15_000),
      });
      const body = await response.json().catch(() => ({ error: "We could not connect. Please try again." }));
      if (!response.ok) throw new Error(body.error || "Please try again.");
      setStatus("done");
    } catch (err) {
      setStatus("idle");
      setError(err instanceof Error && err.name !== "TimeoutError" ? err.message : "We could not connect. Please try again.");
    }
  }

  return (
    <div className="mt-6">
      <h1 className="font-serif text-3xl text-ink sm:text-4xl">
        {status === "done" ? "You’re unsubscribed" : "Unsubscribe from LETTY updates"}
      </h1>
      <p className="mt-4 text-sm leading-relaxed text-stone" role="status">
        {status === "done"
          ? "Your preference has been saved. You will no longer receive product updates, offers or optional reminders. Essential order and account emails will still reach you."
          : "You can stop product updates, offers and optional reminders below. Essential order and account emails will still reach you."}
      </p>
      {!token && <p className="mt-4 text-sm text-stone">Open the unsubscribe link in your LETTY email, or contact <a className="underline" href="mailto:hello@houseofletty.com">hello@houseofletty.com</a>.</p>}
      {error && <p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}
      {token && status !== "done" && (
        <button type="button" onClick={unsubscribe} disabled={status === "saving"}
          className="mt-6 min-h-12 w-full rounded-full bg-ink px-6 py-3 text-xs uppercase tracking-wider text-ivory disabled:opacity-60">
          {status === "saving" ? "Saving..." : "Unsubscribe"}
        </button>
      )}
      <Link href="/shop" className="mt-6 inline-block text-sm text-ink underline underline-offset-4">Return to LETTY</Link>
    </div>
  );
}
