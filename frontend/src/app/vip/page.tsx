import { Suspense } from "react";
import type { Metadata } from "next";
import { VipContent } from "@/components/vip/vip-content";

export const metadata: Metadata = {
  title: "VIP Sanctuary | The Inner Circle — LETTY Beauty",
  description:
    "Unlock private drops, bespoke concierge gifting suites, and tier status with LETTY's Inner Circle VIP loyalty sanctuary.",
  alternates: { canonical: "/vip" },
};

export default function VipPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-ivory" />}>
      <VipContent />
    </Suspense>
  );
}
