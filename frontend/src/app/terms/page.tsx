import type { Metadata } from "next";
import { TermsContent } from "@/components/content/terms-content";

export const metadata: Metadata = {
  title: "Terms & Conditions of Sale | LETTY",
  description:
    "Read LETTY's Terms & Conditions of Sale: orders and payment, delivery, returns, rewards, and UK consumer rights, governed by the laws of England and Wales.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return <TermsContent />;
}
