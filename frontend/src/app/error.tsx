"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { LinedButton } from "@/components/shared/lined-button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled error:", error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center py-24 text-center px-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary text-stone">
        <AlertCircle className="h-8 w-8" strokeWidth={1.5} />
      </div>
      <p className="mt-6 text-xs font-medium uppercase tracking-luxe text-stone">
        A Momentary Pause
      </p>
      <h1 className="mt-2 font-serif text-3xl font-medium text-ink">Something went wrong</h1>
      <p className="mt-2 text-sm text-stone">
        An unhandled anomaly occurred while loading this page. Our team has been notified.
      </p>

      <div className="mt-8 flex flex-col sm:flex-row justify-center items-center gap-4">
        <button
          type="button"
          onClick={() => reset()}
          className="group flex flex-col items-center w-[180px]"
        >
          <hr className="w-full border-ink/30 transition-colors group-hover:border-ink/60" />
          <span className="w-full py-3.5 text-[11px] font-medium text-ink transition-colors hover:text-stone tracking-[0.2em] uppercase text-center flex items-center justify-center gap-1.5">
            <RefreshCw className="h-3 w-3" /> Try Again
          </span>
          <hr className="w-full border-ink/30 transition-colors group-hover:border-ink/60" />
        </button>
        <LinedButton href="/shop" width="max-w-[180px]">
          Return Home
        </LinedButton>
      </div>
    </div>
  );
}
