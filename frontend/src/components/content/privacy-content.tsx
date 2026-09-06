"use client";

import Link from "next/link";
import { ShieldCheck, Mail, Lock, FileText, CheckCircle2 } from "lucide-react";
import { Reveal } from "@/components/shared/reveal";

export function PrivacyContent() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 md:px-8 md:py-20 space-y-12">
      <Reveal className="text-center space-y-3">
        <p className="text-xs font-medium uppercase tracking-luxe text-stone">Legal & Transparency</p>
        <h1 className="font-serif text-4xl font-medium text-ink md:text-5xl">
          Privacy Policy
        </h1>
        <p className="text-sm text-stone max-w-lg mx-auto">
          How LETTY protects, respects, and processes your personal data in accordance with the UK Data Protection Act 2018 and UK GDPR.
        </p>
        <p className="text-[11px] text-stone/70">Last updated: September 2026</p>
      </Reveal>

      <div className="space-y-10 text-sm leading-relaxed text-stone border-t border-line pt-10">
        {/* Section 1 */}
        <section className="space-y-3">
          <h2 className="font-serif text-xl font-medium text-ink flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-gold shrink-0" />
            1. Data Controller Information
          </h2>
          <p>
            LETTY Beauty Limited (&ldquo;LETTY&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;) is the designated Data Controller responsible for your personal information collected via our website, digital boutique, and client concierge services.
          </p>
          <p>
            If you have any questions regarding your privacy, data protection, or wish to exercise your statutory rights, please reach our Data Protection Officer at{" "}
            <a href="mailto:concierge@lettybeauty.com" className="text-ink underline hover:text-stone">
              concierge@lettybeauty.com
            </a>.
          </p>
        </section>

        {/* Section 2 */}
        <section className="space-y-3">
          <h2 className="font-serif text-xl font-medium text-ink flex items-center gap-2">
            <Lock className="h-5 w-5 text-gold shrink-0" />
            2. Personal Data We Collect
          </h2>
          <p>We may collect and process the following categories of personal information:</p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-stone">
            <li><strong>Identity & Contact Data:</strong> Full name, delivery address, billing address, email address, and telephone number.</li>
            <li><strong>Financial & Payment Data:</strong> Payment card tokenisation and transaction identifiers processed securely via our Level 1 PCI-DSS certified payment processor (Stripe). We never store raw debit/credit card numbers on our servers.</li>
            <li><strong>Order & Transaction Data:</strong> Records of products purchased, order values, shades selected, returns history, and customer service correspondences.</li>
            <li><strong>Technical & Browsing Data:</strong> IP address, browser type, operating system, device identifiers, and page interaction timestamps collected via strictly essential or consented cookies.</li>
          </ul>
        </section>

        {/* Section 3 */}
        <section className="space-y-3">
          <h2 className="font-serif text-xl font-medium text-ink flex items-center gap-2">
            <FileText className="h-5 w-5 text-gold shrink-0" />
            3. Lawful Basis for Processing
          </h2>
          <p>Under UK GDPR, we process your personal data under the following legal grounds:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="rounded-lg border border-line bg-secondary/30 p-4">
              <h3 className="font-medium text-ink text-xs uppercase tracking-wider mb-1">Contractual Necessity</h3>
              <p className="text-xs text-stone">To fulfil your orders, process payments, dispatch parcels, provide real-time tracking, and handle customer care requests.</p>
            </div>
            <div className="rounded-lg border border-line bg-secondary/30 p-4">
              <h3 className="font-medium text-ink text-xs uppercase tracking-wider mb-1">Legal Obligation</h3>
              <p className="text-xs text-stone">To maintain financial books, satisfy HM Revenue &amp; Customs (HMRC) accounting standards, and adhere to UK consumer laws.</p>
            </div>
            <div className="rounded-lg border border-line bg-secondary/30 p-4">
              <h3 className="font-medium text-ink text-xs uppercase tracking-wider mb-1">Legitimate Interests</h3>
              <p className="text-xs text-stone">To detect and prevent fraudulent transactions, protect our digital infrastructure, and understand website performance.</p>
            </div>
            <div className="rounded-lg border border-line bg-secondary/30 p-4">
              <h3 className="font-medium text-ink text-xs uppercase tracking-wider mb-1">Consent</h3>
              <p className="text-xs text-stone">Where you have subscribed to our VIP newsletter or consented to non-essential analytics cookies. You may revoke consent at any time.</p>
            </div>
          </div>
        </section>

        {/* Section 4 */}
        <section className="space-y-3">
          <h2 className="font-serif text-xl font-medium text-ink">4. Sharing Your Information</h2>
          <p>
            We do not sell, rent, or trade your personal data with third parties. We share data solely with trusted third-party service providers who assist our operations:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-stone">
            <li><strong>Payment Gateways:</strong> Stripe (Level 1 PCI-DSS compliant) for secure credit/debit card, Apple Pay, and Google Pay verification.</li>
            <li><strong>Logistics & Couriers:</strong> Royal Mail, DPD, DHL Express, and regional postal authorities for tracked parcel delivery.</li>
            <li><strong>Cloud & Hosting Infrastructure:</strong> Secure servers located in the UK and European Economic Area (EEA) with end-to-end encryption.</li>
          </ul>
        </section>

        {/* Section 5 */}
        <section className="space-y-3">
          <h2 className="font-serif text-xl font-medium text-ink">5. Data Retention</h2>
          <p>
            We retain your order and transactional information for 6 years following the date of purchase to comply with UK statutory accounting, tax, and consumer warranty regulations. Marketing subscriber data is retained until you choose to unsubscribe.
          </p>
        </section>

        {/* Section 6 */}
        <section className="space-y-3">
          <h2 className="font-serif text-xl font-medium text-ink">6. Your Statutory Rights (UK GDPR)</h2>
          <p>As a resident of the United Kingdom, you possess statutory rights regarding your personal data:</p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-stone">
            <li><strong>Right of Access:</strong> You may request a copy of the personal data we hold about you.</li>
            <li><strong>Right to Rectification:</strong> You may request correction of inaccurate or incomplete personal records.</li>
            <li><strong>Right to Erasure (&ldquo;Right to be Forgotten&rdquo;):</strong> You may request deletion of your personal data where legal retention periods do not apply.</li>
            <li><strong>Right to Restrict or Object:</strong> You can restrict or object to our processing of your data under legitimate interest.</li>
            <li><strong>Right to Lodge a Complaint:</strong> You have the right to lodge a complaint with the UK Information Commissioner&rsquo;s Office (ICO) at{" "}
              <a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer" className="text-ink underline hover:text-stone">
                ico.org.uk
              </a>.
            </li>
          </ul>
        </section>

        {/* Section 7 */}
        <section className="space-y-3 border-t border-line pt-8">
          <h2 className="font-serif text-xl font-medium text-ink flex items-center gap-2">
            <Mail className="h-5 w-5 text-gold shrink-0" />
            7. Contact Our Privacy Concierge
          </h2>
          <p>
            To exercise any of your data protection rights, or if you have questions regarding our privacy standards:
          </p>
          <div className="rounded-xl border border-line bg-secondary/40 p-4 text-xs space-y-1">
            <p className="font-medium text-ink">LETTY Privacy Office</p>
            <p>Email: <a href="mailto:concierge@lettybeauty.com" className="text-ink underline">concierge@lettybeauty.com</a></p>
            <p>WhatsApp Concierge: +44 7311 564331</p>
            <p>Response SLA: Within 30 calendar days as required by UK GDPR.</p>
          </div>
        </section>
      </div>
    </div>
  );
}
