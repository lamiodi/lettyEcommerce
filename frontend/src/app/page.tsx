import type { Metadata } from "next";
import { EntranceReveal } from "@/components/home/entrance-reveal";
import { WorldsDoorway } from "@/components/home/worlds-doorway";
import { CountryWelcomeModal } from "@/components/home/country-welcome-modal";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

/** Homepage = the four worlds only, Chanel-style: full-bleed category
 *  image blocks with a "Discover" entry into each department. */
export default function HomePage() {
  return (
    <>
      <EntranceReveal />
      <WorldsDoorway />
      <CountryWelcomeModal />
    </>
  );
}
