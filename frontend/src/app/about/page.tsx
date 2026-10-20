import type { Metadata } from "next";
import { AboutContent } from "@/components/content/about-content";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Discover LETTY lip colour, lip care and lash essentials, including Velvet Sculpt Lip Liner, Glass Shine Lip Gloss, the Lash Book Kit and mwah Lip Balm.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return <AboutContent />;
}
