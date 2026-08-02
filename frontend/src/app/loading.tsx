import { LogoImage } from "@/components/shared/logo";
import { CenteredLoader } from "@/components/shared/skeletons";

/** Root loading — used by Next.js when no closer loading.tsx is matched. */
export default function Loading() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-10 py-24 text-center">
      <LogoImage priority className="h-20 w-auto animate-logo-fade md:h-24" />
      <CenteredLoader />
    </div>
  );
}
