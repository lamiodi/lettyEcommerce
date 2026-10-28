import type { Metadata } from "next";
import { CheckoutContent } from "@/components/checkout/checkout-content";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Complete your LETTY order securely.",
  robots: { index: false, follow: true },
};

export default function CheckoutPage() {
  return (
    <>
      <link rel="preconnect" href="https://js.stripe.com" />
      <link rel="preconnect" href="https://api.stripe.com" />
      <link rel="dns-prefetch" href="https://js.stripe.com" />
      <link rel="dns-prefetch" href="https://api.stripe.com" />
      <CheckoutContent />
    </>
  );
}
