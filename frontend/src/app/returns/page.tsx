import type { Metadata } from "next";
import { ReturnsContent } from "@/components/content/returns-content";

export const metadata: Metadata = {
  title: "Returns & Refund Policy | LETTY",
  description:
    "Learn about LETTY's 14-day return window, cosmetic hygiene protections under Regulation 28(3)(a), and straightforward refund procedures under UK Consumer Law.",
  alternates: { canonical: "/returns" },
};

export default function ReturnsPage() {
  return <ReturnsContent />;
}
