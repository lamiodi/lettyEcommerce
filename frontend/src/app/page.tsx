import type { Metadata } from "next";
import { EntranceReveal } from "@/components/home/entrance-reveal";
import { WorldsDoorway } from "@/components/home/worlds-doorway";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

/** Homepage = the four worlds only, Chanel-style: full-bleed category
 *  image blocks with a "See More" entry into each department. */
export default function HomePage() {
  return (
    <>
      <EntranceReveal />
      <WorldsDoorway />
    </>
  );
}
