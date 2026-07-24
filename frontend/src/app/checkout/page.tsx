import type { Metadata } from "next";
import { CheckoutContent } from "@/components/checkout/checkout-content";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Complete your LETTY order securely.",
  robots: { index: false, follow: true },
};

export default function CheckoutPage() {
  return <CheckoutContent />;
}
