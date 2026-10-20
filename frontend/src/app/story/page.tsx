import type { Metadata } from "next";
import { StoryContent } from "@/components/content/story-content";

export const metadata: Metadata = {
  title: "Discover LETTY",
  description:
    "Explore the LETTY beauty edit, from lip liner and lip gloss to lash essentials and mwah Lip Balm.",
  alternates: { canonical: "/story" },
};

export default function StoryPage() {
  return <StoryContent />;
}
