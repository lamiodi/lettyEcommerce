import type { Metadata } from "next";
import { AboutContent } from "@/components/content/about-content";

export const metadata: Metadata = {
  title: "About Us | LETTY Beauty Without Limits",
  description:
    "LETTY, Beauty Without Limits. Discover the story and philosophy behind LETTY — celebrating individuality, confidence and embracing who you are.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return <AboutContent />;
}
