import { Logo } from "@/components/shared/logo";

/** Root loading — used by Next.js when no closer loading.tsx is matched. */
export default function Loading() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-6 py-24 text-center">
      <div className="animate-pulse">
        <Logo />
      </div>
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-luxe text-gold">
        <span className="h-1.5 w-1.5 animate-ping bg-gold" />
        Preparing Sanctuary…
      </div>
    </div>
  );
}
