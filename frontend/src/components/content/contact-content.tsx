"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Clock, Mail, Phone, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { LinedButton } from "@/components/shared/lined-button";
import { Reveal } from "@/components/shared/reveal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ContactContent() {
  const searchParams = useSearchParams();
  const isVip = searchParams.get("vip") === "true";
  const isAmbassador = searchParams.get("ambassador") === "true";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState("");
  const [orderId, setOrderId] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (isVip) {
      setSubject("VIP Club Membership Application");
    } else if (isAmbassador) {
      setSubject("Brand Ambassador & Creator Application");
    }
  }, [isVip, isAmbassador]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) {
      toast.error("Please fill in all required fields.");
      return;
    }
    setSubmitted(true);
    toast.success("Message sent to LETTY Concierge.");
  };


  return (
    <div className="mx-auto max-w-7xl px-4 py-12 md:px-8 md:py-20 space-y-20">
      <Reveal>
        <header className="text-center max-w-3xl mx-auto">
          <p className="text-xs font-medium uppercase tracking-luxe text-stone">Customer Care & Concierge</p>
          <h1 className="mt-3 font-serif text-4xl font-medium text-ink md:text-5xl">
            At Your Service
          </h1>
          <p className="mt-3 text-stone text-sm md:text-base">
            We’re here to assist with orders, product enquiries, recommendations and anything else you may need.
          </p>
        </header>
      </Reveal>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Contact Form */}
        <div id="contact-form" className="lg:col-span-7">
          <Reveal className="bg-ivory p-6 md:p-10">
            <h2 className="font-serif text-2xl font-medium text-ink mb-6">Send a Message</h2>

            {submitted ? (
              <div className="py-12 text-center space-y-4">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-ink">
                  <Mail className="h-7 w-7" />
                </div>
                <h3 className="font-serif text-2xl text-ink font-medium">Message Received</h3>
                <p className="text-stone text-sm max-w-sm mx-auto">
                  Thank you, <span className="font-medium text-ink">{name}</span>. A concierge advisor will respond to <span className="font-medium text-ink">{email}</span> within 24 hours.
                </p>
                <div className="mt-4 flex justify-center gap-4">
                  <LinedButton href="/shop">Return to Boutique</LinedButton>
                  <button 
                    type="button" 
                    onClick={() => setSubmitted(false)}
                    className="text-xs uppercase tracking-luxe text-stone hover:text-ink transition-colors"
                  >
                    Send Another Inquiry
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Personalized VIP / Ambassador Concierge Welcome Banner */}
                {isVip && (
                  <div className="rounded-2xl bg-secondary/80 p-4 sm:p-5 border border-gold/30 text-ink space-y-1.5 transition-all">
                    <p className="text-xs font-semibold uppercase tracking-luxe text-gold flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-gold" />
                      VIP Club · Inner Circle Application
                    </p>
                    <p className="text-xs sm:text-sm text-stone leading-relaxed">
                      Welcome to the world of LETTY. As an Inner Circle VIP, you are requesting private atelier allocations, bespoke concierge gifting, and secret archive access.
                    </p>
                  </div>
                )}

                {isAmbassador && (
                  <div className="rounded-2xl bg-secondary/80 p-4 sm:p-5 border border-gold/30 text-ink space-y-1.5 transition-all">
                    <p className="text-xs font-semibold uppercase tracking-luxe text-gold flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-gold" />
                      Global Beauty Ambassador Application
                    </p>
                    <p className="text-xs sm:text-sm text-stone leading-relaxed">
                      Partner with LETTY as an official beauty storyteller. Please include your primary social handles (@username) to request seasonal PR gifting suites and feature consideration across @lettybeautyofficial.
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-[11px] uppercase tracking-luxe text-stone">
                      Full Name *
                    </Label>
                    <Input
                      id="name"
                      required
                      placeholder="Lady Eleanor"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="h-11 rounded-none border-0 border-b border-line bg-transparent px-0 text-sm focus-visible:ring-0 focus-visible:border-ink"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-[11px] uppercase tracking-luxe text-stone">
                      Email Address *
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      placeholder="name@domain.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-11 rounded-none border-0 border-b border-line bg-transparent px-0 text-sm focus-visible:ring-0 focus-visible:border-ink"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-[11px] uppercase tracking-luxe text-stone">
                      Phone Number (Optional)
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+1 (555) 000-0000"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="h-11 rounded-none border-0 border-b border-line bg-transparent px-0 text-sm focus-visible:ring-0 focus-visible:border-ink"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="orderId" className="text-[11px] uppercase tracking-luxe text-stone">
                      {isAmbassador ? "Primary Social Handle (@)" : "Order # (Optional)"}
                    </Label>
                    <Input
                      id="orderId"
                      placeholder={isAmbassador ? "@yourhandle" : "e.g. LTY-98421"}
                      value={orderId}
                      onChange={(e) => setOrderId(e.target.value)}
                      className="h-11 rounded-none border-0 border-b border-line bg-transparent px-0 text-sm focus-visible:ring-0 focus-visible:border-ink"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject" className="text-[11px] uppercase tracking-luxe text-stone">
                    Inquiry Topic
                  </Label>
                  <select
                    id="subject"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className={`w-full h-11 rounded-none border-0 border-b border-line bg-transparent px-0 text-sm focus:outline-none focus:border-ink ${!subject ? 'text-stone' : 'text-ink'}`}
                  >
                    <option value="" disabled>Select an inquiry topic...</option>
                    <option value="VIP Club Membership Application">VIP Club Membership Application</option>
                    <option value="Brand Ambassador & Creator Application">Brand Ambassador & Creator Application</option>
                    <option value="Order Enquiry & Delivery">Order Enquiry & Delivery</option>
                    <option value="Returns & Exchanges">Returns & Exchanges</option>
                    <option value="Product Advice">Product Advice</option>
                    <option value="Press & Media">Press & Media</option>
                    <option value="General Enquiry">General Enquiry</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message" className="text-[11px] uppercase tracking-luxe text-stone">
                    Your Message *
                  </Label>
                  <textarea
                    id="message"
                    required
                    rows={5}
                    placeholder={
                      isVip
                        ? "Tell us about your beauty rituals or what VIP privileges you are most excited to unlock..."
                        : isAmbassador
                        ? "Tell us about your audience, beauty content style, and why you would love to represent LETTY..."
                        : "How may our concierge assist you?"
                    }
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full min-h-[120px] rounded-none border-0 border-b border-line bg-transparent p-2 text-sm text-ink focus:outline-none focus:border-ink resize-y"
                  />
                </div>

                <div className="pt-2 flex justify-center">
                  <LinedButton type="submit">Send Message</LinedButton>
                </div>
              </form>
            )}
          </Reveal>
        </div>

        {/* Right Info Sidebar */}
        <Reveal delay={0.15} className="lg:col-span-5 space-y-8">
          <div className="bg-ivory p-6 md:p-8 space-y-6">
            <h2 className="font-serif text-xl font-medium text-ink border-b border-line pb-3">
              Direct Concierge Lines
            </h2>

            <div className="space-y-5 text-sm">
              <div className="flex items-start gap-3">
                <Mail className="h-4 w-4 text-stone mt-0.5" />
                <div>
                  <p className="text-[11px] uppercase tracking-luxe text-stone">Concierge Email</p>
                  <a href="mailto:lettybeautyco@gmail.com" className="font-medium text-ink underline-offset-4 hover:underline">
                    lettybeautyco@gmail.com
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="h-4 w-4 text-stone mt-0.5" />
                <div>
                  <p className="text-[11px] uppercase tracking-luxe text-stone">Telephone Concierge</p>
                  <a href="tel:+18005553889" className="font-medium text-ink underline-offset-4 hover:underline">
                    +1 (800) 555-3889
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="h-4 w-4 text-stone mt-0.5" />
                <div>
                  <p className="text-[11px] uppercase tracking-luxe text-stone">Customer Care Hours</p>
                  <p className="font-medium text-ink">Monday – Saturday: 9:00 – 19:00 GMT</p>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>

      {/* The LETTY Experience & Customer Care Section */}
      <section className="pt-12 border-t border-line">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Reveal className="bg-ivory p-8 md:p-12 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <p className="text-xs uppercase tracking-luxe text-stone font-medium">The LETTY Experience</p>
              <h2 className="font-serif text-2xl md:text-3xl font-medium text-ink">
                Beauty, Wherever You Are
              </h2>
              <p className="text-stone text-sm md:text-base leading-relaxed">
                Discover the world of LETTY from wherever you are. Explore our beauty collection, thoughtfully curated for your everyday rituals.
              </p>
            </div>
            <div className="pt-2">
              <LinedButton href="/shop">
                Explore Collection
              </LinedButton>
            </div>
          </Reveal>

          <Reveal delay={0.1} className="bg-ivory p-8 md:p-12 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <p className="text-xs uppercase tracking-luxe text-stone font-medium">Customer Care</p>
              <h2 className="font-serif text-2xl md:text-3xl font-medium text-ink">
                Dedicated Advisory
              </h2>
              <p className="text-stone text-sm md:text-base leading-relaxed">
                For product guidance, order assistance and general enquiries, our team is here to assist.
              </p>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById("contact-form");
                  if (el) {
                    el.scrollIntoView({ behavior: "smooth" });
                    const input = el.querySelector("input");
                    input?.focus();
                  }
                }}
                className="inline-flex items-center gap-2 text-xs uppercase tracking-luxe font-medium text-ink hover:text-stone transition-colors group cursor-pointer"
              >
                <span>Contact Customer Care</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}

