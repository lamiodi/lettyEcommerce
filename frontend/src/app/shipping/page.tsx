import type { Metadata } from "next";
import { ShippingContent } from "@/components/content/shipping-content";

export const metadata: Metadata = {
  title: "Shipping & Delivery Policy | LETTY",
  description:
    "Explore LETTY's transparent destination flat shipping rates, delivery timeframes, tracking procedures, and global luxury dispatch guidelines.",
  alternates: { canonical: "/shipping" },
};

export default function ShippingPage() {
  return <ShippingContent />;
}
