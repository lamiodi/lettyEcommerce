import type { Metadata } from "next";
import { TermsContent } from "@/components/content/terms-content";

export const metadata: Metadata = {
  title: "Terms of Service & Sale | LETTY",
  description:
    "Review our terms of service, sale contracts, UK consumer rights, and website usage policies governed by the laws of England and Wales.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return <TermsContent />;
}
