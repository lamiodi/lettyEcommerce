import type { Metadata } from "next";
import { AmbassadorContent } from "@/components/ambassadors/ambassador-content";

export const metadata: Metadata = {
  title: "Join Ambassadors | Creator Atelier — LETTY Beauty",
  description:
    "Partner with LETTY as a global beauty ambassador. Enjoy up to 15% commissions, seasonal PR gifting suites, and global editorial features.",
  alternates: { canonical: "/ambassadors" },
};

export default function AmbassadorsPage() {
  return <AmbassadorContent />;
}
