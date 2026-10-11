"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { Reveal } from "@/components/shared/reveal";
import { EASE_LUXURY } from "@/lib/motion";

type TermsSection = {
  id: string;
  title: string;
  body: ReactNode;
};

const mailLink = (key: string) => (
  <a key={key} href="mailto:hello@houseofletty.com" className="text-ink underline hover:text-stone">
    hello@houseofletty.com
  </a>
);

const SECTIONS: TermsSection[] = [
  {
    id: "introduction",
    title: "Introduction & Agreement to These Terms",
    body: (
      <>
        <p>
          These Terms &amp; Conditions of Sale (&ldquo;Terms&rdquo;) apply to all purchases made through houseofletty.com (the &ldquo;Website&rdquo;), operated by LETTY Beauty Limited (&ldquo;LETTY&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;). By browsing the Website, creating an account, or placing an order, you accept these Terms and our{" "}
          <Link href="/privacy" className="text-ink underline hover:text-stone">Privacy Policy</Link>,{" "}
          <Link href="/shipping" className="text-ink underline hover:text-stone">Shipping &amp; Delivery Policy</Link>, and{" "}
          <Link href="/returns" className="text-ink underline hover:text-stone">Returns &amp; Refund Policy</Link>.
        </p>
        <p>
          If you do not agree with any part of these Terms, please do not use the Website or place an order. We may update these Terms from time to time; the version in force is the one published on the Website at the time you place your order.
        </p>
      </>
    ),
  },
  {
    id: "company-information",
    title: "Company Information & Customer Care",
    body: (
      <>
        <p>
          The Website is operated by LETTY Beauty Limited. Our Customer Care team is available Monday to Saturday, 10 am to 7 pm UK time:
        </p>
        <ul className="list-disc pl-5 space-y-1.5 text-xs text-stone">
          <li>Email: {mailLink("mail-company")}</li>
          <li>WhatsApp Concierge: +44 7311 564331</li>
        </ul>
      </>
    ),
  },
  {
    id: "eligibility",
    title: "Eligibility & Age Restriction",
    body: (
      <p>
        You must be at least 18 years of age and capable of forming a legally binding contract to purchase from us. By placing an order you confirm that you meet these requirements and that the details you provide are accurate and complete.
      </p>
    ),
  },
  {
    id: "orders",
    title: "Orders & Contract Formation",
    body: (
      <>
        <p>
          Placing an order on the Website constitutes an offer to purchase. An automated order confirmation email acknowledges that we have received your offer — it is not acceptance of it. A legally binding contract of sale is formed only when we accept your order by issuing a Dispatch Confirmation email containing your tracking reference.
        </p>
        <p>
          We may decline or cancel an order (in whole or in part) where an item is unavailable, a pricing or product-information error has occurred, payment authorisation fails, or we reasonably suspect fraud or resale. If you have already paid for a cancelled item, we will refund the amount paid in full.
        </p>
      </>
    ),
  },
  {
    id: "personal-use",
    title: "Personal Use, Resale & Quantity Limits",
    body: (
      <p>
        Products are sold for personal use only. We may refuse or limit orders that appear intended for resale, commercial use, or bulk purchasing, and may cancel associated accounts. Nothing in these Terms prevents you from gifting products purchased from us.
      </p>
    ),
  },
  {
    id: "pricing",
    title: "Pricing, Taxes & Currency",
    body: (
      <p>
        Prices are displayed in Pounds Sterling (GBP) by default, with selected currencies available at checkout; the currency confirmed at checkout is the currency of your contract. All prices include UK VAT where applicable. For deliveries outside the United Kingdom, import duties, customs fees, and local taxes may be assessed by the destination country and remain the responsibility of the recipient.
      </p>
    ),
  },
  {
    id: "errors",
    title: "Pricing & Product Information Errors",
    body: (
      <p>
        We work to keep prices, descriptions, and imagery accurate, but errors and omissions may occur. If we discover an error after you place an order, we will inform you and you may either confirm the order at the correct information or cancel it for a full refund. Where an item differs materially from its description, your statutory rights are unaffected.
      </p>
    ),
  },
  {
    id: "payment",
    title: "Payment Methods & Security",
    body: (
      <>
        <p>
          We accept major debit and credit cards (Visa, Mastercard, American Express) and, where available at checkout, Apple Pay, Google Pay, Link, and PayPal. All payments are processed securely by our payment provider, Stripe; we do not store your full card details on our servers.
        </p>
        <p>
          Payment is authorised when you place your order and captured when your order is confirmed. You confirm that any payment method you use is yours or that you are authorised to use it. Where a payment is declined, reversed, or otherwise not received, we may suspend or cancel the associated order and account.
        </p>
      </>
    ),
  },
  {
    id: "vip-rewards",
    title: "VIP Sanctuary & Rewards",
    body: (
      <p>
        Membership privileges, reward points, referral vouchers, and other program benefits are offered at our discretion and may be earned and redeemed as described on the{" "}
        <Link href="/vip" className="text-ink underline hover:text-stone">VIP Sanctuary page</Link>. Reward balances have no cash value, cannot be transferred, and may not be exchanged for cash. If an order that earned points or used a reward is refunded, the associated points or vouchers may be adjusted or deducted. We may amend, suspend, or end the program at any time; you may opt out of marketing related to it at any time.
      </p>
    ),
  },
  {
    id: "promotional-codes",
    title: "Promotional Codes & Offers",
    body: (
      <p>
        Unless an offer states otherwise, only one promotional code may be used per order, and codes cannot be combined or applied retroactively to previous orders. Offers apply to eligible products only, cannot be exchanged for cash, and are valid while stocks last. We may withdraw or correct an offer that was published in error.
      </p>
    ),
  },
  {
    id: "gift-cards",
    title: "Gift Cards",
    body: (
      <p>
        Gift cards can be applied at checkout towards eligible purchases. Gift card balances have no cash value, cannot be redeemed for cash, and are not transferable. Where an order paid (in whole or in part) with a gift card is refunded, the gift-card portion will be re-credited to your gift card.
      </p>
    ),
  },
  {
    id: "samples",
    title: "Samples & Free Gifts",
    body: (
      <p>
        Complimentary samples and promotional gifts are subject to availability and offered with selected orders as advertised. If a free gift or sample becomes unavailable, we may substitute it or dispatch the order without it. When a qualifying item is returned, any associated free gift or sample should also be returned.
      </p>
    ),
  },
  {
    id: "cancelling",
    title: "Cancelling an Order",
    body: (
      <p>
        If you change your mind, contact us at {mailLink("mail-cancel")} with your order number as soon as possible. If your order has not yet been dispatched we will cancel it and refund any amount taken. If it has already been dispatched, please follow the returns process below.
      </p>
    ),
  },
  {
    id: "returns",
    title: "Returns, Refunds & Your Right to Cancel",
    body: (
      <>
        <p>
          <strong>Statutory 14-day right to cancel:</strong> under the UK Consumer Contracts (Information, Cancellation and Additional Charges) Regulations 2013, you have the right to cancel your purchase within 14 calendar days of receiving your order, for any reason. Full instructions are set out in our{" "}
          <Link href="/returns" className="text-ink underline hover:text-stone">Returns &amp; Refund Policy</Link>.
        </p>
        <p>
          <strong>Hygiene exemption:</strong> for health-protection and hygiene reasons, cosmetics and beauty products that have been unsealed or used are exempt from the right of cancellation once the tamper-evident seal has been broken. Returned items must otherwise be unopened, unused, and in their original packaging.
        </p>
        <p>
          Approved refunds are issued to your original payment method (with gift-card tenders re-credited to the gift card) typically within 5–10 business days of the returned items reaching us. These rights are in addition to, and do not affect, your rights under the Consumer Rights Act 2015.
        </p>
      </>
    ),
  },
  {
    id: "damaged-missing",
    title: "Damaged, Defective, Incorrect or Missing Items",
    body: (
      <p>
        Please inspect your order on arrival. If an item is damaged, defective, incorrect, or missing, contact {mailLink("mail-damaged")} within 14 days of delivery with your order number and a description (and, where possible, photographs) of the issue. We will arrange a replacement or refund as appropriate. Under the Consumer Rights Act 2015, goods must be of satisfactory quality, fit for purpose, and as described; nothing in these Terms limits those rights.
      </p>
    ),
  },
  {
    id: "availability",
    title: "Stock Availability & Product Information",
    body: (
      <p>
        All items are subject to availability. Product shades and finishes may appear slightly different on screen depending on your display; we recommend reviewing shade descriptions before ordering. Where an ordered item becomes unavailable before dispatch, we will notify you and refund that item in full.
      </p>
    ),
  },
  {
    id: "delivery",
    title: "Delivery, Title & Risk of Loss",
    body: (
      <p>
        Orders are dispatched from our United Kingdom distribution centre. Destination flat delivery fees and estimated timeframes are detailed in our{" "}
        <Link href="/shipping" className="text-ink underline hover:text-stone">Shipping &amp; Delivery Policy</Link>. Please ensure your delivery address is complete and accurate; we cannot be responsible for delays or losses caused by incorrect address details. Risk of loss and title to the products pass to you on physical delivery to the shipping address provided at checkout.
      </p>
    ),
  },
  {
    id: "website-content",
    title: "Website Content, Acceptable Use & Intellectual Property",
    body: (
      <>
        <p>
          All trademarks, logos, copy, editorial photography, branding assets, formulas, and digital artwork on the Website are the exclusive property of LETTY Beauty Limited or its licensors. You are granted a limited, revocable, non-exclusive licence to access and use the Website for personal, non-commercial purposes only.
        </p>
        <p>
          You agree not to: copy, scrape, republish, or commercially exploit any part of the Website or its content; use the Website for fraudulent, unlawful, or deceptive purposes; interfere with its operation or security; attempt to gain unauthorised access to our systems, accounts, or data; or use bots, scrapers, or automated tools to place orders or harvest content.
        </p>
      </>
    ),
  },
  {
    id: "account",
    title: "Your Account",
    body: (
      <p>
        You are responsible for maintaining the confidentiality of your account credentials and for all activity under your account. Notify us immediately at {mailLink("mail-account")} if you suspect unauthorised use. We may suspend or close accounts that breach these Terms.
      </p>
    ),
  },
  {
    id: "reviews",
    title: "Reviews & Customer Content",
    body: (
      <p>
        If you submit reviews, images, or other content, you confirm it is your own, truthful, and lawful, and does not infringe third-party rights or contain defamatory, obscene, or misleading material. You grant us a non-exclusive, royalty-free licence to display such content on the Website in connection with our business. We may edit, decline, or remove content at our discretion.
      </p>
    ),
  },
  {
    id: "ip-complaints",
    title: "Intellectual Property Complaints",
    body: (
      <p>
        If you believe any content on the Website infringes your copyright or other intellectual property rights, please contact {mailLink("mail-ip")} with a description of the material, the rights claimed, and your contact details. We will review and respond to properly submitted notices.
      </p>
    ),
  },
  {
    id: "third-party-links",
    title: "Third-Party Links",
    body: (
      <p>
        The Website may contain links to third-party websites. These are provided for convenience only; we do not control and are not responsible for their content, policies, or practices.
      </p>
    ),
  },
  {
    id: "liability",
    title: "Limitation of Liability",
    body: (
      <p>
        To the fullest extent permitted by law, we are not liable for indirect, incidental, or consequential loss, or for loss of profit, revenue, or data, arising from your use of the Website or the products. Our total liability for any claim connected to an order is limited to the amount you paid for that order. Nothing in these Terms excludes or limits liability for death or personal injury caused by negligence, fraud, or any liability that cannot lawfully be excluded — including your statutory rights as a consumer.
      </p>
    ),
  },
  {
    id: "governing-law",
    title: "Governing Law, Jurisdiction & Disputes",
    body: (
      <p>
        These Terms and any dispute or claim arising out of or in connection with them or their subject matter or formation (including non-contractual disputes or claims) are governed by the laws of <strong>England and Wales</strong>, and the courts of England and Wales have exclusive jurisdiction — except where the law of your country of residence gives you the right to bring proceedings in your local courts, in which case that right is preserved. We will always try to resolve matters amicably first: contact {mailLink("mail-law")} and our Customer Care team will assist.
      </p>
    ),
  },
  {
    id: "final-provisions",
    title: "Changes, Severability & Entire Agreement",
    body: (
      <p>
        If any provision of these Terms is held invalid or unenforceable, the remaining provisions continue in full force. These Terms, together with our Privacy, Shipping, and Returns policies, form the entire agreement between you and LETTY Beauty Limited in relation to your orders. Questions? Contact us any time at {mailLink("mail-final")}.
      </p>
    ),
  },
];

export function TermsContent() {
  const [openSections, setOpenSections] = useState<Set<string>>(
    () => new Set([SECTIONS[0].id])
  );

  const toggleSection = (id: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className="pb-20 md:pb-28">
      {/* Banner — Huda-style inset title block in LETTY ivory */}
      <Reveal>
        <div className="px-4 pt-6 md:px-15 md:pt-10">
          <div className="rounded-[10px] bg-surface px-6 py-[clamp(4.5rem,9vw,7.5rem)] text-center">
            <h1 className="font-sans uppercase leading-[1.06] tracking-[0.02em] text-ink text-[clamp(2.25rem,8.5vw,7.5rem)]">
              Terms &amp; Conditions of Sale
            </h1>
          </div>
        </div>
      </Reveal>

      {/* Legal accordion */}
      <div className="mx-auto max-w-3xl px-4 md:px-8">
        <Reveal className="pt-10 md:pt-16">
          <p className="text-sm text-ink">Last Updated : 9th October 2026</p>
        </Reveal>

        <Reveal className="mt-6 border-t border-line" delay={0.05}>
          {SECTIONS.map((section) => {
            const isOpen = openSections.has(section.id);
            return (
              <div key={section.id} className="border-b border-line">
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={`terms-panel-${section.id}`}
                  onClick={() => toggleSection(section.id)}
                  className="group flex w-full items-center justify-between gap-6 py-5 text-left md:py-6"
                >
                  <span className="font-sans text-[13px] font-medium uppercase tracking-luxe-sm text-ink transition-colors group-hover:text-gold md:text-sm">
                    {section.title}
                  </span>
                  <ChevronRight
                    className={`h-4 w-4 shrink-0 text-gold transition-transform duration-300 ease-out ${
                      isOpen ? "rotate-90" : ""
                    }`}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      id={`terms-panel-${section.id}`}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.35, ease: EASE_LUXURY }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-3 pb-7 text-sm leading-relaxed text-stone">
                        {section.body}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </Reveal>
      </div>
    </div>
  );
}
