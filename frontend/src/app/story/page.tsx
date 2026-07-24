import type { Metadata } from "next";
import { StoryContent } from "@/components/content/story-content";

export const metadata: Metadata = {
  title: "The LETTY Heritage",
  description:
    "Explore the timeline, botanical craftsmanship, and sustainability ethos behind LETTY.",
  alternates: { canonical: "/story" },
};

export default function StoryPage() {
  return <StoryContent />;
}
