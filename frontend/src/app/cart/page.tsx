import type { Metadata } from "next";
import { CartPageContent } from "@/components/cart/cart-page-content";

export const metadata: Metadata = {
  title: "Shopping Bag",
  description: "Review your LETTY selection before checkout.",
  robots: { index: false, follow: true },
};

export default function CartPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 md:px-8 md:py-16">
      <CartPageContent />
    </div>
  );
}
