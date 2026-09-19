import type { Metadata } from "next";
import { EntranceReveal } from "@/components/home/entrance-reveal";
import { WorldsDoorway } from "@/components/home/worlds-doorway";
import { CountryWelcomeModal } from "@/components/home/country-welcome-modal";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.houseofletty.com";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

/** Homepage = the four worlds only, Chanel-style: full-bleed category
 *  image blocks with a "Discover" entry into each department. */
export default function HomePage() {
  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "LETTY",
    alternateName: "House of LETTY",
    url: siteUrl,
    logo: `${siteUrl}/icon.png`,
    sameAs: [
      "https://instagram.com/lettybeautyofficial",
      "https://tiktok.com/@lettybeautyofficial",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      email: "concierge@houseofletty.com",
    },
  };

  const webSiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "LETTY",
    url: siteUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteUrl}/shop?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteJsonLd) }}
      />
      <h1 className="sr-only">LETTY — Luxury Beauty, Fragrance, Fashion &amp; Eyewear</h1>
      <EntranceReveal />
      <WorldsDoorway />
      <CountryWelcomeModal />
    </>
  );
}
