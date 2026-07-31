"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

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
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary text-gold">
        <AlertCircle className="h-8 w-8" />
      </div>
      <p className="mt-6 text-xs font-medium uppercase tracking-luxe text-gold">
        A Momentary Pause
      </p>
      <h1 className="mt-2 font-serif text-3xl font-medium text-ink">Something went wrong</h1>
      <p className="mt-2 text-sm text-stone">
        An unhandled anomaly occurred while loading this page. Our team has been notified.
      </p>

      <div className="mt-8 flex flex-col sm:flex-row justify-center gap-3">
        <Button
          onClick={() => reset()}
          className="h-11 rounded-lg bg-ink px-6 text-xs font-medium uppercase tracking-luxe-sm text-ivory hover:bg-ink/90 flex items-center justify-center gap-2"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Try Again
        </Button>
        <Link
          href="/contact"
          className="inline-flex h-11 items-center justify-center rounded-lg border border-line px-6 text-xs font-medium uppercase tracking-luxe-sm text-ink hover:border-gold transition"
        >
          Contact Concierge
        </Link>
        <Link
          href="/"
          className="inline-flex h-11 items-center justify-center rounded-lg border border-line px-6 text-xs font-medium uppercase tracking-luxe-sm text-ink hover:border-gold transition"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
}
