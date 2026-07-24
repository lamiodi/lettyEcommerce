import { LettyImage } from "@/components/shared/letty-image";
import { Reveal } from "@/components/shared/reveal";
import { cn } from "@/lib/utils";
import { instagramImages } from "@/lib/mock/content";
import { SOCIAL_LINKS } from "@/lib/constants";

const instagramUrl =
  SOCIAL_LINKS.find((s) => s.label === "Instagram")?.href ??
  "https://instagram.com";

/** Offsets that recreate the template's staggered image trio. */
const offsets = ["", "mt-10 md:mt-14", "mt-5 md:mt-7"];

/**
 * Template Instagram split — "Follow us" invitation on the left,
 * a staggered trio of feed images on the right.
 */
export function InstagramFeed() {
  return (
    <section aria-labelledby="instagram-heading" className="border-t border-line">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-20 md:px-8 md:py-28 lg:grid-cols-2">
        <Reveal>
          <p className="text-xs font-medium uppercase tracking-luxe text-stone">
            Instagram
          </p>
          <h2
            id="instagram-heading"
            className="mt-4 font-serif text-4xl font-medium leading-tight text-ink md:text-5xl"
          >
            Follow us
            <br />
            <span className="italic">@letty.maison</span>
          </h2>
          <div className="w-full mt-8 flex flex-col items-start max-w-[200px]">
            <hr className="w-full border-ink/30" />
            <a
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 text-[11px] font-medium text-ink transition-colors hover:text-stone tracking-widest uppercase text-center"
            >
              Follow us
            </a>
            <hr className="w-full border-ink/30" />
          </div>
        </Reveal>

        <div className="grid grid-cols-3 items-start gap-3 md:gap-4">
          {instagramImages.slice(0, 3).map((key, i) => (
            <Reveal key={key} delay={0.08 * i} className={cn(offsets[i])}>
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Open LETTY on Instagram"
                className="group relative block aspect-[3/4] overflow-hidden bg-secondary"
              >
                <LettyImage
                  imageKey={key}
                  sizes="(max-width: 1024px) 33vw, 25vw"
                  className="transition-transform duration-700 ease-out group-hover:scale-105"
                />
              </a>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
