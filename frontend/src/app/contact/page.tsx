import type { Metadata } from "next";
import { ContactContent } from "@/components/content/contact-content";

export const metadata: Metadata = {
  title: "Concierge & Client Care",
  description:
    "Connect with LETTY client advisors for order assistance, consultation, or flagship boutique information.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return <ContactContent />;
}
