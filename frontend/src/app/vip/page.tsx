import { Suspense } from "react";
import type { Metadata } from "next";
import { VipContent } from "@/components/vip/vip-content";

export const metadata: Metadata = {
  title: "The Inner Circle | LETTY Beauty",
  description:
    "Join LETTY updates, discover our beauty products and view the CIRCLE10 member offer.",
  alternates: { canonical: "/vip" },
};

export default function VipPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-ivory" />}>
      <VipContent />
    </Suspense>
  );
}
