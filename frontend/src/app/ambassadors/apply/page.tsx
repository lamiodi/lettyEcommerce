import type { Metadata } from "next";
import { AmbassadorApplyContent } from "@/components/ambassadors/ambassador-apply-content";
import { AMBASSADOR_FAQS } from "@/lib/data/ambassadors";

export const metadata: Metadata = {
  title: "Ambassador Application & FAQs | Creator Atelier — LETTY Beauty",
  description:
    "Apply to become a LETTY Beauty Ambassador. Complete your creator dossier for PR gifting suites, up to 15% commissions, and explore program FAQs.",
  alternates: { canonical: "/ambassadors/apply" },
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: AMBASSADOR_FAQS.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.a,
    },
  })),
};

export default function AmbassadorApplyPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <AmbassadorApplyContent />
    </>
  );
}
