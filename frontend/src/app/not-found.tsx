import { Compass } from "lucide-react";
import { LinedButton } from "@/components/shared/lined-button";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[65vh] max-w-lg flex-col items-center justify-center py-24 text-center px-4">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-secondary text-stone">
        <Compass className="h-10 w-10" strokeWidth={1.5} />
      </div>
      <p className="mt-6 text-xs font-medium uppercase tracking-luxe text-stone">
        404 — Page Not Found
      </p>
      <h1 className="mt-2 font-serif text-4xl font-medium text-ink md:text-5xl">
        A Solitary Path
      </h1>
      <p className="mt-3 text-sm text-stone max-w-sm">
        The piece or page you are seeking does not exist or has been relocated within the Maison.
      </p>

      <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
        <LinedButton href="/shop">Explore Boutique</LinedButton>
        <LinedButton href="/collections" width="max-w-[200px]">View Collections</LinedButton>
      </div>
    </div>
  );
}
