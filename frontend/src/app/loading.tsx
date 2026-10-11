import { LogoImage } from "@/components/shared/logo";

/** Root loading — used by Next.js when no closer loading.tsx is matched.
 *  Ink curtain echoing the homepage EntranceReveal: the emblem settles in
 *  while a gold hairline expands beneath (pure CSS — loading UI must play
 *  before hydration). */
export default function Loading() {
  return (
    <div
      role="status"
      className="animate-route-curtain fixed inset-0 z-[100] flex flex-col items-center justify-center bg-ink"
    >
      <span className="sr-only">Loading</span>
      <div className="animate-route-emblem">
        <LogoImage variant="dark" priority className="h-36 w-auto md:h-52" />
      </div>
      <hr className="animate-route-hairline mt-10 h-px w-44 border-0 bg-gold/60" />
    </div>
  );
}
