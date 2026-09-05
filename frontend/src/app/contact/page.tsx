import type { Metadata } from "next";
import { Suspense } from "react";
import { ContactContent } from "@/components/content/contact-content";

export const metadata: Metadata = {
  title: "Concierge & Client Care",
  description:
    "Connect with LETTY client advisors for order assistance, consultation, or flagship boutique information.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <Suspense fallback={<div className="min-h-[70vh] bg-background" />}>
      <ContactContent />
    </Suspense>
  );
}

