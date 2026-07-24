import type { Metadata } from "next";
import { AboutContent } from "@/components/content/about-content";

export const metadata: Metadata = {
  title: "Our Story & Heritage",
  description:
    "Learn about the House of LETTY, our botanical formulations, Parisian heritage, and commitment to sustainable luxury.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return <AboutContent />;
}
