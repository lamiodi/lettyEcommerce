import type { Metadata } from "next";
import { PrivacyContent } from "@/components/content/privacy-content";

export const metadata: Metadata = {
  title: "Privacy Policy | LETTY",
  description:
    "Learn how LETTY collects, protects, and manages your personal information in full compliance with the UK Data Protection Act 2018 and UK GDPR.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return <PrivacyContent />;
}
