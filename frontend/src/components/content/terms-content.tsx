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
          Terms &amp; Conditions of Sale
        </h1>
        <p className="text-sm text-stone max-w-lg mx-auto">
          The terms and conditions governing purchases, website use, and contracts formed with LETTY Beauty Limited through houseofletty.com.
        </p>
        <p className="text-[11px] text-stone/70">Governed by the laws of England and Wales · Last updated 9 October 2026</p>
      </Reveal>

      <div className="space-y-10 text-sm leading-relaxed text-stone border-t border-line pt-10">
        {/* 1. Introduction */}
        <section className="space-y-3">
          <h2 className="font-serif text-xl font-medium text-ink flex items-center gap-2">
            <Scale className="h-5 w-5 text-gold shrink-0" />
            1. Introduction &amp; Agreement to These Terms
          </h2>
          <p>
            These Terms &amp; Conditions of Sale (&ldquo;Terms&rdquo;) apply to all purchases made through houseofletty.com (the &ldquo;Website&rdquo;), operated by LETTY Beauty Limited (&ldquo;LETTY&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;). By browsing the Website, creating an account, or placing an order, you accept these Terms and our{" "}
            <Link href="/privacy" className="text-ink underline hover:text-stone">Privacy Policy</Link>,{" "}
            <Link href="/shipping" className="text-ink underline hover:text-stone">Shipping &amp; Delivery Policy</Link>, and{" "}
            <Link href="/returns" className="text-ink underline hover:text-stone">Returns &amp; Refund Policy</Link>.
          </p>
          <p>
            If you do not agree with any part of these Terms, please do not use the Website or place an order. We may update these Terms from time to time; the version in force is the one published on the Website at the time you place your order.
          </p>
        </section>

        {/* 2. Company & Customer Care */}
        <section className="space-y-3">
          <h2 className="font-serif text-xl font-medium text-ink">2. Company Information &amp; Customer Care</h2>
          <p>
            The Website is operated by LETTY Beauty Limited. Our Customer Care team is available Monday to Saturday, 10 am to 7 pm UK time:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-stone">
            <li>Email: <a href="mailto:hello@houseofletty.com" className="text-ink underline">hello@houseofletty.com</a></li>
            <li>WhatsApp Concierge: +44 7311 564331</li>
          </ul>
        </section>

        {/* 3. Eligibility */}
        <section className="space-y-3">
          <h2 className="font-serif text-xl font-medium text-ink">3. Eligibility &amp; Age Restriction</h2>
          <p>
            You must be at least 18 years of age and capable of forming a legally binding contract to purchase from us. By placing an order you confirm that you meet these requirements and that the details you provide are accurate and complete.
          </p>
        </section>

        {/* 4. Orders & Contract Formation */}
        <section className="space-y-3">
          <h2 className="font-serif text-xl font-medium text-ink flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-gold shrink-0" />
            4. Orders &amp; Contract Formation
          </h2>
          <p>
            Placing an order on the Website constitutes an offer to purchase. An automated order confirmation email acknowledges that we have received your offer — it is not acceptance of it. A legally binding contract of sale is formed only when we accept your order by issuing a Dispatch Confirmation email containing your tracking reference.
          </p>
          <p>
            We may decline or cancel an order (in whole or in part) where an item is unavailable, a pricing or product-information error has occurred, payment authorisation fails, or we reasonably suspect fraud or resale. If you have already paid for a cancelled item, we will refund the amount paid in full.
          </p>
        </section>

        {/* 5. Personal Use & Resale */}
        <section className="space-y-3">
          <h2 className="font-serif text-xl font-medium text-ink">5. Personal Use, Resale &amp; Quantity Limits</h2>
          <p>
            Products are sold for personal use only. We may refuse or limit orders that appear intended for resale, commercial use, or bulk purchasing, and may cancel associated accounts. Nothing in these Terms prevents you from gifting products purchased from us.
          </p>
        </section>

        {/* 6. Pricing, Taxes & Currency */}
        <section className="space-y-3">
          <h2 className="font-serif text-xl font-medium text-ink">6. Pricing, Taxes &amp; Currency</h2>
          <p>
            Prices are displayed in Pounds Sterling (GBP) by default, with selected currencies available at checkout; the currency confirmed at checkout is the currency of your contract. All prices include UK VAT where applicable. For deliveries outside the United Kingdom, import duties, customs fees, and local taxes may be assessed by the destination country and remain the responsibility of the recipient.
          </p>
        </section>

        {/* 7. Errors */}
        <section className="space-y-3">
          <h2 className="font-serif text-xl font-medium text-ink">7. Pricing &amp; Product Information Errors</h2>
          <p>
            We work to keep prices, descriptions, and imagery accurate, but errors and omissions may occur. If we discover an error after you place an order, we will inform you and you may either confirm the order at the correct information or cancel it for a full refund. Where an item differs materially from its description, your statutory rights are unaffected.
          </p>
        </section>

        {/* 8. Payment */}
        <section className="space-y-3">
          <h2 className="font-serif text-xl font-medium text-ink flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-gold shrink-0" />
            8. Payment Methods &amp; Security
          </h2>
          <p>
            We accept major debit and credit cards (Visa, Mastercard, American Express) and, where available at checkout, Apple Pay, Google Pay, Link, and PayPal. All payments are processed securely by our payment provider, Stripe; we do not store your full card details on our servers.
          </p>
          <p>
            Payment is authorised when you place your order and captured when your order is confirmed. You confirm that any payment method you use is yours or that you are authorised to use it. Where a payment is declined, reversed, or otherwise not received, we may suspend or cancel the associated order and account.
          </p>
        </section>

        {/* 9. VIP & Rewards */}
        <section className="space-y-3">
          <h2 className="font-serif text-xl font-medium text-ink">9. VIP Sanctuary &amp; Rewards</h2>
          <p>
            Membership privileges, reward points, referral vouchers, and other program benefits are offered at our discretion and may be earned and redeemed as described on the{" "}
            <Link href="/vip" className="text-ink underline hover:text-stone">VIP Sanctuary page</Link>. Reward balances have no cash value, cannot be transferred, and may not be exchanged for cash. If an order that earned points or used a reward is refunded, the associated points or vouchers may be adjusted or deducted. We may amend, suspend, or end the program at any time; you may opt out of marketing related to it at any time.
          </p>
        </section>

        {/* 10. Promotional Codes & Offers */}
        <section className="space-y-3">
          <h2 className="font-serif text-xl font-medium text-ink">10. Promotional Codes &amp; Offers</h2>
          <p>
            Unless an offer states otherwise, only one promotional code may be used per order, and codes cannot be combined or applied retroactively to previous orders. Offers apply to eligible products only, cannot be exchanged for cash, and are valid while stocks last. We may withdraw or correct an offer that was published in error.
          </p>
        </section>

        {/* 11. Gift Cards */}
        <section className="space-y-3">
          <h2 className="font-serif text-xl font-medium text-ink">11. Gift Cards</h2>
          <p>
            Gift cards can be applied at checkout towards eligible purchases. Gift card balances have no cash value, cannot be redeemed for cash, and are not transferable. Where an order paid (in whole or in part) with a gift card is refunded, the gift-card portion will be re-credited to your gift card.
          </p>
        </section>

        {/* 12. Samples & Free Gifts */}
        <section className="space-y-3">
          <h2 className="font-serif text-xl font-medium text-ink">12. Samples &amp; Free Gifts</h2>
          <p>
            Complimentary samples and promotional gifts are subject to availability and offered with selected orders as advertised. If a free gift or sample becomes unavailable, we may substitute it or dispatch the order without it. When a qualifying item is returned, any associated free gift or sample should also be returned.
          </p>
        </section>

        {/* 13. Cancellations */}
        <section className="space-y-3">
          <h2 className="font-serif text-xl font-medium text-ink">13. Cancelling an Order</h2>
          <p>
            If you change your mind, contact us at <a href="mailto:hello@houseofletty.com" className="text-ink underline">hello@houseofletty.com</a> with your order number as soon as possible. If your order has not yet been dispatched we will cancel it and refund any amount taken. If it has already been dispatched, please follow the returns process below.
          </p>
        </section>

        {/* 14. Returns & Withdrawal */}
        <section className="space-y-3">
          <h2 className="font-serif text-xl font-medium text-ink flex items-center gap-2">
            <Check className="h-5 w-5 text-gold shrink-0" />
            14. Returns, Refunds &amp; Your Right to Cancel
          </h2>
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
        </section>

        {/* 15. Damaged or Missing */}
        <section className="space-y-3">
          <h2 className="font-serif text-xl font-medium text-ink flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-gold shrink-0" />
            15. Damaged, Defective, Incorrect or Missing Items
          </h2>
          <p>
            Please inspect your order on arrival. If an item is damaged, defective, incorrect, or missing, contact <a href="mailto:hello@houseofletty.com" className="text-ink underline">hello@houseofletty.com</a> within 14 days of delivery with your order number and a description (and, where possible, photographs) of the issue. We will arrange a replacement or refund as appropriate. Under the Consumer Rights Act 2015, goods must be of satisfactory quality, fit for purpose, and as described; nothing in these Terms limits those rights.
          </p>
        </section>

        {/* 16. Availability */}
        <section className="space-y-3">
          <h2 className="font-serif text-xl font-medium text-ink">16. Stock Availability &amp; Product Information</h2>
          <p>
            All items are subject to availability. Product shades and finishes may appear slightly different on screen depending on your display; we recommend reviewing shade descriptions before ordering. Where an ordered item becomes unavailable before dispatch, we will notify you and refund that item in full.
          </p>
        </section>

        {/* 17. Delivery & Risk */}
        <section className="space-y-3">
          <h2 className="font-serif text-xl font-medium text-ink">17. Delivery, Title &amp; Risk of Loss</h2>
          <p>
            Orders are dispatched from our United Kingdom distribution centre. Destination flat delivery fees and estimated timeframes are detailed in our{" "}
            <Link href="/shipping" className="text-ink underline hover:text-stone">Shipping &amp; Delivery Policy</Link>. Please ensure your delivery address is complete and accurate; we cannot be responsible for delays or losses caused by incorrect address details. Risk of loss and title to the products pass to you on physical delivery to the shipping address provided at checkout.
          </p>
        </section>

        {/* 18. Website Content & IP */}
        <section className="space-y-3">
          <h2 className="font-serif text-xl font-medium text-ink">18. Website Content, Acceptable Use &amp; Intellectual Property</h2>
          <p>
            All trademarks, logos, copy, editorial photography, branding assets, formulas, and digital artwork on the Website are the exclusive property of LETTY Beauty Limited or its licensors. You are granted a limited, revocable, non-exclusive licence to access and use the Website for personal, non-commercial purposes only.
          </p>
          <p>
            You agree not to: copy, scrape, republish, or commercially exploit any part of the Website or its content; use the Website for fraudulent, unlawful, or deceptive purposes; interfere with its operation or security; attempt to gain unauthorised access to our systems, accounts, or data; or use bots, scrapers, or automated tools to place orders or harvest content.
          </p>
        </section>

        {/* 19. Accounts */}
        <section className="space-y-3">
          <h2 className="font-serif text-xl font-medium text-ink">19. Your Account</h2>
          <p>
            You are responsible for maintaining the confidentiality of your account credentials and for all activity under your account. Notify us immediately at <a href="mailto:hello@houseofletty.com" className="text-ink underline">hello@houseofletty.com</a> if you suspect unauthorised use. We may suspend or close accounts that breach these Terms.
          </p>
        </section>

        {/* 20. Reviews & Customer Content */}
        <section className="space-y-3">
          <h2 className="font-serif text-xl font-medium text-ink">20. Reviews &amp; Customer Content</h2>
          <p>
            If you submit reviews, images, or other content, you confirm it is your own, truthful, and lawful, and does not infringe third-party rights or contain defamatory, obscene, or misleading material. You grant us a non-exclusive, royalty-free licence to display such content on the Website in connection with our business. We may edit, decline, or remove content at our discretion.
          </p>
        </section>

        {/* 21. IP Complaints */}
        <section className="space-y-3">
          <h2 className="font-serif text-xl font-medium text-ink">21. Intellectual Property Complaints</h2>
          <p>
            If you believe any content on the Website infringes your copyright or other intellectual property rights, please contact <a href="mailto:hello@houseofletty.com" className="text-ink underline">hello@houseofletty.com</a> with a description of the material, the rights claimed, and your contact details. We will review and respond to properly submitted notices.
          </p>
        </section>

        {/* 22. Third-Party Links */}
        <section className="space-y-3">
          <h2 className="font-serif text-xl font-medium text-ink">22. Third-Party Links</h2>
          <p>
            The Website may contain links to third-party websites. These are provided for convenience only; we do not control and are not responsible for their content, policies, or practices.
          </p>
        </section>

        {/* 23. Liability */}
        <section className="space-y-3">
          <h2 className="font-serif text-xl font-medium text-ink">23. Limitation of Liability</h2>
          <p>
            To the fullest extent permitted by law, we are not liable for indirect, incidental, or consequential loss, or for loss of profit, revenue, or data, arising from your use of the Website or the products. Our total liability for any claim connected to an order is limited to the amount you paid for that order. Nothing in these Terms excludes or limits liability for death or personal injury caused by negligence, fraud, or any liability that cannot lawfully be excluded — including your statutory rights as a consumer.
          </p>
        </section>

        {/* 24. Governing Law */}
        <section className="space-y-3 border-t border-line pt-8">
          <h2 className="font-serif text-xl font-medium text-ink">24. Governing Law, Jurisdiction &amp; Disputes</h2>
          <p>
            These Terms and any dispute or claim arising out of or in connection with them or their subject matter or formation (including non-contractual disputes or claims) are governed by the laws of <strong>England and Wales</strong>, and the courts of England and Wales have exclusive jurisdiction — except where the law of your country of residence gives you the right to bring proceedings in your local courts, in which case that right is preserved. We will always try to resolve matters amicably first: contact <a href="mailto:hello@houseofletty.com" className="text-ink underline">hello@houseofletty.com</a> and our Customer Care team will assist.
          </p>
        </section>

        {/* 25. Final Provisions */}
        <section className="space-y-3">
          <h2 className="font-serif text-xl font-medium text-ink">25. Changes, Severability &amp; Entire Agreement</h2>
          <p>
            If any provision of these Terms is held invalid or unenforceable, the remaining provisions continue in full force. These Terms, together with our Privacy, Shipping, and Returns policies, form the entire agreement between you and LETTY Beauty Limited in relation to your orders. Questions? Contact us any time at <a href="mailto:hello@houseofletty.com" className="text-ink underline">hello@houseofletty.com</a>.
          </p>
        </section>
      </div>
    </div>
  );
}
