import { LettyImage } from "@/components/shared/letty-image";

/**
 * Template campaign band — a pure full-width editorial image with no
 * overlay copy, acting as a visual pause between Services and Cosmetics.
 */
export function CampaignBanner() {
  return (
    <section aria-label="LETTY editorial campaign" className="relative overflow-hidden">
      <div className="relative h-[50vh] min-h-[360px] w-full md:h-[65vh]">
        <LettyImage
          imageKey="campaignBanner"
          sizes="100vw"
          className="object-center"
        />
      </div>
    </section>
  );
}
