import type { Metadata } from "next";
import { FaqContent } from "@/components/content/faq-content";
import { faqGroups } from "@/lib/mock/content";

export const metadata: Metadata = {
  title: "Frequently Asked Questions",
  description:
    "Explore our guide to delivery timelines, product standards, and personalised customer care.",
  alternates: { canonical: "/faq" },
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqGroups.flatMap((group) =>
    group.items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    }))
  ),
};

export default function FaqPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <FaqContent />
    </>
  );
}
