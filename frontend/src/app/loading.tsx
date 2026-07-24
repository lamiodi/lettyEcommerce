import { Logo } from "@/components/shared/logo";

export default function Loading() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-6 text-center py-24">
      <div className="animate-pulse">
        <Logo />
      </div>
      <div className="flex items-center gap-2 text-xs uppercase tracking-luxe text-gold">
        <span className="h-1.5 w-1.5 animate-ping rounded-full bg-gold" />
        Preparing Sanctuary...
      </div>
    </div>
  );
}
