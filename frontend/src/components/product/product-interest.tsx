"use client";

import { useEffect, useState } from "react";
import { Eye } from "lucide-react";
import { cn } from "@/lib/utils";

/** Display actual active sessions, with no invented fallback count. */
export function ProductInterest({ slug, className }: { slug: string; className?: string }) {
  const [count, setCount] = useState<number | null>(null);
  useEffect(() => {
    let stopped = false;
    let inFlight = false;
    let sessionId: string;
    try {
      sessionId = sessionStorage.getItem("letty-viewing-session") || crypto.randomUUID();
      sessionStorage.setItem("letty-viewing-session", sessionId);
    } catch {
      sessionId = crypto.randomUUID();
    }
    const heartbeat = async (active: boolean) => {
      if (active && inFlight) return;
      if (active) inFlight = true;
      try {
        const response = await fetch("/api/public/product-presence", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slug, sessionId, active }),
          keepalive: !active,
          signal: AbortSignal.timeout(10_000),
        });
        if (!response.ok) throw new Error("Presence unavailable");
        const data: { count?: number } = await response.json();
        if (!stopped && active) setCount(Number.isInteger(data.count) && Number(data.count) > 0 ? Number(data.count) : null);
      } catch {
        if (!stopped) setCount(null);
      } finally {
        if (active) inFlight = false;
      }
    };
    const update = () => { void heartbeat(document.visibilityState === "visible"); };
    const leave = () => { void heartbeat(false); };
    update();
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") void heartbeat(true);
    }, 20_000);
    document.addEventListener("visibilitychange", update);
    window.addEventListener("pagehide", leave);
    return () => {
      stopped = true;
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", update);
      window.removeEventListener("pagehide", leave);
      leave();
    };
  }, [slug]);

  return (
    <div className={cn("mb-4 min-h-8", className)}>
      {count !== null && (
        <p role="status" className="inline-flex max-w-full items-center gap-2 rounded-full border border-gold/20 bg-surface/70 px-3 py-1.5 text-[10px] leading-relaxed text-stone sm:text-[11px]">
          <Eye className="h-3.5 w-3.5 shrink-0 text-ink/70" strokeWidth={1.4} aria-hidden />
          <span><span className="font-medium tabular-nums text-ink">{count}</span> {count === 1 ? "person is" : "people are"} checking this out right now</span>
          <span aria-hidden className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#76836a]" />
        </p>
      )}
    </div>
  );
}
