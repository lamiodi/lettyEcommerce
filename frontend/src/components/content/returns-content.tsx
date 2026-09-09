"use client";

import Link from "next/link";
import { RotateCcw, ShieldAlert, CheckCircle, Clock, Mail, HelpCircle } from "lucide-react";
import { Reveal } from "@/components/shared/reveal";

export function ReturnsContent() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 md:px-8 md:py-20 space-y-12">
      <Reveal className="text-center space-y-3">
        <p className="text-xs font-medium uppercase tracking-luxe text-stone">Client Guarantee</p>
        <h1 className="font-serif text-4xl font-medium text-ink md:text-5xl">
          Returns &amp; Refund Policy
        </h1>
        <p className="text-sm text-stone max-w-lg mx-auto">
          Our commitment to product excellence, hygiene protection, and hassle-free returns under UK Consumer Law.
        </p>
        <p className="text-[11px] text-stone/70">Compliant with UK Consumer Contracts Regulations 2013 &amp; Consumer Rights Act 2015</p>
      </Reveal>

      <div className="space-y-10 text-sm leading-relaxed text-stone border-t border-line pt-10">
        {/* 1. Statutory 14-Day Right to Return */}
        <section className="space-y-3">
          <h2 className="font-serif text-xl font-medium text-ink flex items-center gap-2">
            <Clock className="h-5 w-5 text-gold shrink-0" />
            1. 14-Day Statutory Cooling-Off Period
          </h2>
          <p>
            Under the UK Consumer Contracts Regulations 2013, you have a statutory right to cancel your purchase within <strong>14 calendar days</strong> from the day you (or a third party designated by you) physically receive your order.
          </p>
        </section>

        {/* 2. Cosmetic Hygiene Protection Exemption */}
        <section className="space-y-3 rounded-xl border border-line bg-secondary/30 p-5">
          <h2 className="font-serif text-xl font-medium text-ink flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-gold shrink-0" />
            2. Health &amp; Hygiene Protection Notice (Cosmetics &amp; Beauty)
          </h2>
          <p className="text-xs leading-relaxed text-ink font-medium">
            Important consumer notice for luxury cosmetics:
          </p>
          <p className="text-xs leading-relaxed text-stone">
            In accordance with <strong>Regulation 28(3)(a)</strong> of the Consumer Contracts (Information, Cancellation and Additional Charges) Regulations 2013, contracts for the supply of goods that are <strong>sealed for health protection or hygiene reasons</strong> cease to be eligible for cancellation once unsealed after delivery.
          </p>
          <div className="space-y-1.5 pt-2 text-xs">
            <p className="font-semibold text-ink">To be eligible for return:</p>
            <ul className="list-disc pl-5 space-y-1 text-stone">
              <li>The item must remain in its original, unopened luxury presentation packaging.</li>
              <li>The manufacturer&rsquo;s tamper-evident hygiene seal or cellophane wrap must be <strong>unbroken and intact</strong>.</li>
              <li>The product must not have been tested, swatched, handled, or opened.</li>
            </ul>
          </div>
        </section>

        {/* 3. Step-by-Step Return Process */}
        <section className="space-y-4">
          <h2 className="font-serif text-xl font-medium text-ink flex items-center gap-2">
            <RotateCcw className="h-5 w-5 text-gold shrink-0" />
            3. How to Initiate a Return
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="rounded-lg border border-line bg-secondary/40 p-4 space-y-2">
              <span className="font-serif text-lg font-bold text-ink">Step 1</span>
              <p className="font-medium text-ink">Notify Our Concierge</p>
              <p className="text-stone">
                Contact <a href="mailto:lettybeautyco@gmail.com" className="text-ink underline">lettybeautyco@gmail.com</a> or WhatsApp with your order number and reason for return within 14 days of receipt.
              </p>
            </div>
            <div className="rounded-lg border border-line bg-secondary/40 p-4 space-y-2">
              <span className="font-serif text-lg font-bold text-ink">Step 2</span>
              <p className="font-medium text-ink">Receive Return Authorisation</p>
              <p className="text-stone">
                Our team will issue an official Return Merchandise Authorisation (RMA) reference number and detailed dispatch instructions.
              </p>
            </div>
            <div className="rounded-lg border border-line bg-secondary/40 p-4 space-y-2">
              <span className="font-serif text-lg font-bold text-ink">Step 3</span>
              <p className="font-medium text-ink">Pack &amp; Dispatch</p>
              <p className="text-stone">
                Repack your items securely in the original packaging and dispatch via a tracked postal or courier service.
              </p>
            </div>
          </div>
        </section>

        {/* 4. Damaged, Faulty, or Incorrect Items */}
        <section className="space-y-3">
          <h2 className="font-serif text-xl font-medium text-ink flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-gold shrink-0" />
            4. Damaged, Faulty or Incorrect Goods
          </h2>
          <p>
            Under the UK <strong>Consumer Rights Act 2015</strong>, products must be as described, fit for purpose, and of satisfactory quality. If your order arrives damaged, defective, or incorrect:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-stone">
            <li>Please contact us within 48 hours of delivery with photographic evidence of the defect or damage.</li>
            <li>We will immediately arrange a prepaid return shipping label and issue a priority replacement or full refund including original shipping charges.</li>
          </ul>
        </section>

        {/* 5. Refund Processing Timelines */}
        <section className="space-y-3">
          <h2 className="font-serif text-xl font-medium text-ink">5. Refund Processing &amp; Reimbursement</h2>
          <p>
            Once your returned parcel is received at our UK distribution hub, our quality inspection team will verify the condition of the seals and products within <strong>48 hours</strong>.
          </p>
          <p>
            Approved refunds will be processed immediately and credited to your original payment method (Credit/Debit Card via Stripe, Apple Pay, Google Pay). Depending on your banking institution, funds typically appear on your statement within <strong>5 to 10 business days</strong>.
          </p>
        </section>

        {/* Contact Concierge */}
        <section className="space-y-3 border-t border-line pt-8">
          <h2 className="font-serif text-xl font-medium text-ink flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-gold shrink-0" />
            6. Questions Regarding Your Return?
          </h2>
          <p>
            Our client care specialists are available to guide you through every step:
          </p>
          <div className="rounded-xl border border-line bg-secondary/40 p-4 text-xs space-y-1">
            <p className="font-medium text-ink">LETTY Returns Department</p>
            <p>Email: <a href="mailto:lettybeautyco@gmail.com" className="text-ink underline">lettybeautyco@gmail.com</a></p>
            <p>WhatsApp Concierge: +44 7311 564331</p>
            <p>Response SLA: Under 24 hours.</p>
          </div>
        </section>
      </div>
    </div>
  );
}
