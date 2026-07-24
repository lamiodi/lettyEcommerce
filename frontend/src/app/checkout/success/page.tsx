import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Order Confirmed",
  description: "Thank you for your order with LETTY.",
  robots: { index: false, follow: true },
};

export default function CheckoutSuccessPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 text-center md:py-24">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gold/10 text-gold">
        <CheckCircle2 className="h-10 w-10" />
      </div>
      <p className="mt-6 text-xs font-medium uppercase tracking-luxe text-gold">
        Order Received
      </p>
      <h1 className="mt-2 font-serif text-4xl font-medium text-ink md:text-5xl">
        Order Confirmation
      </h1>
      <p className="mt-3 text-sm text-stone max-w-md mx-auto">
        Your ritual selection is being prepared by our concierge. An email with shipping & tracking details has been sent.
      </p>

      <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
        <Link
          href="/shop"
          className="inline-flex h-12 items-center rounded-lg bg-ink px-8 text-xs font-medium uppercase tracking-luxe-sm text-ivory transition hover:bg-ink/90"
        >
          Return to Boutique
        </Link>
      </div>
    </div>
  );
}
