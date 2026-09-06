"use client";

import Link from "next/link";
import { Scale, Check, AlertCircle, ShoppingBag, ShieldCheck } from "lucide-react";
import { Reveal } from "@/components/shared/reveal";

export function TermsContent() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 md:px-8 md:py-20 space-y-12">
      <Reveal className="text-center space-y-3">
        <p className="text-xs font-medium uppercase tracking-luxe text-stone">Client Agreement</p>
        <h1 className="font-serif text-4xl font-medium text-ink md:text-5xl">
          Terms of Service &amp; Sale
        </h1>
        <p className="text-sm text-stone max-w-lg mx-auto">
          Please review the terms and conditions governing purchases, website use, and contracts formed with LETTY Beauty Limited.
        </p>
        <p className="text-[11px] text-stone/70">Governed by the laws of England and Wales · Updated September 2026</p>
      </Reveal>

      <div className="space-y-10 text-sm leading-relaxed text-stone border-t border-line pt-10">
        {/* 1. Introduction */}
        <section className="space-y-3">
          <h2 className="font-serif text-xl font-medium text-ink flex items-center gap-2">
            <Scale className="h-5 w-5 text-gold shrink-0" />
            1. Company Information &amp; Scope
          </h2>
          <p>
            This website is operated by LETTY Beauty Limited (&ldquo;LETTY&rdquo;, &ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;). Throughout the site, the terms &ldquo;we&rdquo;, &ldquo;us&rdquo; and &ldquo;our&rdquo; refer to LETTY. By browsing, creating an account, or purchasing luxury cosmetics from our boutique, you engage in our &ldquo;Service&rdquo; and agree to be bound by these Terms of Service.
          </p>
        </section>

        {/* 2. Eligibility & Ordering */}
        <section className="space-y-3">
          <h2 className="font-serif text-xl font-medium text-ink flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-gold shrink-0" />
            2. Orders &amp; Contract Formation
          </h2>
          <p>
            To place an order through LETTY, you must be at least 18 years of age and possess a valid payment method issued in your name.
          </p>
          <p>
            <strong>Order Acceptance:</strong> When you complete your checkout, you will receive an automated order confirmation email acknowledging receipt of your purchase. A legally binding contract of sale is formed only when we dispatch your parcel and issue an official Dispatch Confirmation containing your tracking reference.
          </p>
          <p>
            We reserve the right to decline or cancel orders in cases of pricing typographical errors, suspected fraud, or stock unavailability. If payment has been captured, an immediate full refund will be credited.
          </p>
        </section>

        {/* 3. Pricing, Taxes & Payment */}
        <section className="space-y-3">
          <h2 className="font-serif text-xl font-medium text-ink flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-gold shrink-0" />
            3. Pricing, VAT &amp; Payment Terms
          </h2>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-stone">
            <li><strong>Currency:</strong> Product base prices are set in British Pounds Sterling (GBP, £). International shoppers can view estimates in EUR, USD, and regional currencies. All checkouts are processed in the displayed currency without hidden transaction fees.</li>
            <li><strong>UK VAT:</strong> In accordance with UK tax laws, all prices displayed to UK residents include Value Added Tax (VAT) at the prevailing statutory rate where applicable.</li>
            <li><strong>Payment Processing:</strong> We accept Visa, Mastercard, American Express, Apple Pay, Google Pay, and other approved payment methods processed via Stripe. Your card is charged upon submitting your order.</li>
          </ul>
        </section>

        {/* 4. Delivery & Risk */}
        <section className="space-y-3">
          <h2 className="font-serif text-xl font-medium text-ink">4. Shipping, Title &amp; Risk of Loss</h2>
          <p>
            Delivery timeframes and destination flat rates are detailed in our{" "}
            <Link href="/shipping" className="text-ink underline hover:text-stone">
              Shipping &amp; Delivery Policy
            </Link>. Risk of loss and title to the products transfer to you upon physical delivery to the shipping address provided at checkout.
          </p>
        </section>

        {/* 5. Statutory Cancellation & Returns */}
        <section className="space-y-3">
          <h2 className="font-serif text-xl font-medium text-ink">5. Cancellation &amp; Returns (UK Consumer Rights)</h2>
          <p>
            <strong>Statutory 14-Day Right to Cancel:</strong> Under the UK Consumer Contracts (Information, Cancellation and Additional Charges) Regulations 2013, you have the right to cancel your purchase within 14 calendar days of receiving your order.
          </p>
          <p>
            <strong>Hygiene Exemption (Cosmetic Products):</strong> In accordance with Regulation 28(3)(a), goods that are sealed for health protection or hygiene purposes (including lip liners, lip glosses, and beauty formulations) are strictly <em>exempt</em> from the right of cancellation once unsealed. Returned items must remain completely unopened, unused, and with original tamper-evident seals intact.
          </p>
          <p>
            Full details and RMA instructions are set out in our{" "}
            <Link href="/returns" className="text-ink underline hover:text-stone">
              Returns &amp; Refund Policy
            </Link>.
          </p>
        </section>

        {/* 6. Faulty or Damaged Goods */}
        <section className="space-y-3">
          <h2 className="font-serif text-xl font-medium text-ink">6. Faulty Goods (Consumer Rights Act 2015)</h2>
          <p>
            Every product supplied by LETTY must conform to the contract, be of satisfactory quality, and be fit for purpose as described. If an item arrives damaged, defective, or incorrect, you are entitled under the Consumer Rights Act 2015 to:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-stone">
            <li>A full refund if reported within 30 days of delivery.</li>
            <li>A replacement or repair if reported within 6 months of delivery.</li>
          </ul>
        </section>

        {/* 7. Intellectual Property */}
        <section className="space-y-3">
          <h2 className="font-serif text-xl font-medium text-ink">7. Intellectual Property</h2>
          <p>
            All trademarks, logos, copy, editorial photography, branding assets, formulas, and digital artwork displayed on this website are the exclusive property of LETTY Beauty Limited. Reproduction, modification, or distribution without prior written authorization is strictly prohibited.
          </p>
        </section>

        {/* 8. Governing Law */}
        <section className="space-y-3 border-t border-line pt-8">
          <h2 className="font-serif text-xl font-medium text-ink">8. Governing Law &amp; Jurisdiction</h2>
          <p>
            These Terms of Service and any dispute or claim arising out of or in connection with them or their subject matter or formation (including non-contractual disputes or claims) shall be governed by and construed in accordance with the laws of <strong>England and Wales</strong>. You agree to submit to the exclusive jurisdiction of the English courts.
          </p>
          <p className="text-xs text-stone">
            For enquiries or disputes, please contact:{" "}
            <a href="mailto:concierge@lettybeauty.com" className="text-ink underline">
              concierge@lettybeauty.com
            </a>.
          </p>
        </section>
      </div>
    </div>
  );
}
