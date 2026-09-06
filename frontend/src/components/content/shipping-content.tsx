"use client";

import Link from "next/link";
import { Truck, ShieldCheck, Clock, Globe, HelpCircle } from "lucide-react";
import { Reveal } from "@/components/shared/reveal";

export function ShippingContent() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 md:px-8 md:py-20 space-y-12">
      <Reveal className="text-center space-y-3">
        <p className="text-xs font-medium uppercase tracking-luxe text-stone">Global Logistics</p>
        <h1 className="font-serif text-4xl font-medium text-ink md:text-5xl">
          Shipping &amp; Delivery Policy
        </h1>
        <p className="text-sm text-stone max-w-lg mx-auto">
          Complimentary packaging, secure tracked courier dispatch, and transparent flat delivery fees worldwide.
        </p>
        <p className="text-[11px] text-stone/70">Dispatched from our United Kingdom distribution boutique</p>
      </Reveal>

      <div className="space-y-10 text-sm leading-relaxed text-stone border-t border-line pt-10">
        {/* Destination Flat Fee Matrix */}
        <section className="space-y-4">
          <h2 className="font-serif text-xl font-medium text-ink flex items-center gap-2">
            <Truck className="h-5 w-5 text-gold shrink-0" />
            1. Destination Flat Rates &amp; Timelines
          </h2>
          <p>
            To ensure clear, transparent pricing without hidden surcharges, LETTY operates a verified destination flat fee schedule with fully insured, tracked courier dispatch:
          </p>

          <div className="overflow-x-auto rounded-xl border border-line bg-secondary/20">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-line bg-secondary/50 font-medium text-ink uppercase tracking-wider">
                  <th className="p-3.5 sm:p-4">Destination Region</th>
                  <th className="p-3.5 sm:p-4">Flat Delivery Fee</th>
                  <th className="p-3.5 sm:p-4">Estimated Delivery Time</th>
                  <th className="p-3.5 sm:p-4">Courier Service</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60">
                <tr className="hover:bg-secondary/30 transition-colors">
                  <td className="p-3.5 sm:p-4 font-medium text-ink flex items-center gap-2">
                    <span className="text-base">🇬🇧</span> United Kingdom
                  </td>
                  <td className="p-3.5 sm:p-4 font-semibold text-ink">£4.99</td>
                  <td className="p-3.5 sm:p-4">2–3 Business Days</td>
                  <td className="p-3.5 sm:p-4 text-stone">Royal Mail / DPD Tracked</td>
                </tr>
                <tr className="hover:bg-secondary/30 transition-colors">
                  <td className="p-3.5 sm:p-4 font-medium text-ink flex items-center gap-2">
                    <span className="text-base">🇪🇺</span> Europe (EU &amp; EEA)
                  </td>
                  <td className="p-3.5 sm:p-4 font-semibold text-ink">€15.00 <span className="text-[10px] text-stone font-normal">(~£12.82)</span></td>
                  <td className="p-3.5 sm:p-4">3–5 Business Days</td>
                  <td className="p-3.5 sm:p-4 text-stone">International Tracked &amp; Signed</td>
                </tr>
                <tr className="hover:bg-secondary/30 transition-colors">
                  <td className="p-3.5 sm:p-4 font-medium text-ink flex items-center gap-2">
                    <span className="text-base">🇺🇸</span> USA &amp; Canada
                  </td>
                  <td className="p-3.5 sm:p-4 font-semibold text-ink">£25.00 <span className="text-[10px] text-stone font-normal">(~$32.00 USD / C$43.50)</span></td>
                  <td className="p-3.5 sm:p-4">4–6 Business Days</td>
                  <td className="p-3.5 sm:p-4 text-stone">Express International Tracked</td>
                </tr>
                <tr className="hover:bg-secondary/30 transition-colors">
                  <td className="p-3.5 sm:p-4 font-medium text-ink flex items-center gap-2">
                    <span className="text-base">🌍</span> Rest of World
                  </td>
                  <td className="p-3.5 sm:p-4 font-semibold text-ink">£30.00</td>
                  <td className="p-3.5 sm:p-4">5–8 Business Days</td>
                  <td className="p-3.5 sm:p-4 text-stone">Worldwide Express Air Tracked</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Dispatch Timetable */}
        <section className="space-y-3">
          <h2 className="font-serif text-xl font-medium text-ink flex items-center gap-2">
            <Clock className="h-5 w-5 text-gold shrink-0" />
            2. Order Processing &amp; Dispatch
          </h2>
          <p>
            Orders placed Monday to Friday before 2:00 PM GMT are typically prepared, hand-inspected, and dispatched within <strong>24 to 48 hours</strong>. Orders placed on weekends or UK Bank Holidays will be processed on the following business day.
          </p>
          <p>
            Every LETTY package is prepared in our signature gold-accented protective luxury presentation box, ensuring your beauty formulations arrive in pristine condition.
          </p>
        </section>

        {/* Tracking */}
        <section className="space-y-3">
          <h2 className="font-serif text-xl font-medium text-ink flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-gold shrink-0" />
            3. Parcel Tracking &amp; Delivery Confirmation
          </h2>
          <p>
            As soon as your parcel is handed to the courier, you will receive an official <strong>Dispatch Confirmation email</strong> with a direct tracking link and courier reference code. You can follow your parcel&rsquo;s journey from our distribution center directly to your doorstep.
          </p>
          <p>
            If no one is available to receive the parcel at the designated shipping address, the courier will leave a card with instructions for rescheduling delivery or collection from your local postal depot.
          </p>
        </section>

        {/* Customs & Duties */}
        <section className="space-y-3">
          <h2 className="font-serif text-xl font-medium text-ink flex items-center gap-2">
            <Globe className="h-5 w-5 text-gold shrink-0" />
            4. Customs, Duties &amp; Taxes
          </h2>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-stone">
            <li><strong>UK Deliveries:</strong> All prices include applicable UK VAT. No additional customs or taxes apply.</li>
            <li><strong>European Union Deliveries:</strong> Orders sent to EU destinations may be subject to standard import VAT or customs clearance depending on national regulations.</li>
            <li><strong>International Deliveries (USA, Canada, Rest of World):</strong> Import duties, customs fees, and local taxes may be assessed by the destination country upon parcel arrival. Any applicable customs charges remain the responsibility of the recipient.</li>
          </ul>
        </section>

        {/* Support */}
        <section className="space-y-3 border-t border-line pt-8">
          <h2 className="font-serif text-xl font-medium text-ink flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-gold shrink-0" />
            5. Enquiries &amp; Delivery Assistance
          </h2>
          <p>
            If you have questions regarding your order status or need assistance with your delivery:
          </p>
          <div className="rounded-xl border border-line bg-secondary/40 p-4 text-xs space-y-1">
            <p className="font-medium text-ink">LETTY Logistics Concierge</p>
            <p>Email: <a href="mailto:concierge@lettybeauty.com" className="text-ink underline">concierge@lettybeauty.com</a></p>
            <p>WhatsApp Concierge: +44 7311 564331</p>
            <p>Response SLA: Within 24 hours Monday through Saturday.</p>
          </div>
        </section>
      </div>
    </div>
  );
}
