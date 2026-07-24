"use client";

import { useState } from "react";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { toast } from "sonner";
import { LinedButton } from "@/components/shared/lined-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const BOUTIQUES = [
  {
    city: "Paris Flagship",
    address: "14 Place Vendôme, 75001 Paris, France",
    hours: "Mon – Sat: 10:00 – 19:00",
    phone: "+33 1 42 68 00 00",
  },
  {
    city: "London Mayfair",
    address: "28 New Bond Street, London W1S 2RH, UK",
    hours: "Mon – Sat: 10:00 – 18:30",
    phone: "+44 20 7946 0912",
  },
  {
    city: "New York Atelier",
    address: "742 Madison Avenue, New York, NY 10065",
    hours: "Mon – Sat: 11:00 – 19:00",
    phone: "+1 212 555 0198",
  },
];

export function ContactContent() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("Order Inquiry");
  const [orderId, setOrderId] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

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
      <header className="text-center max-w-3xl mx-auto">
        <p className="text-xs font-medium uppercase tracking-luxe text-stone">Customer Care & Concierge</p>
        <h1 className="mt-3 font-serif text-4xl font-medium text-ink md:text-5xl">
          At Your Service
        </h1>
        <p className="mt-3 text-stone text-sm md:text-base">
          Our client advisors are devoted to assisting you with order inquiries, bespoke consultations, or product recommendations.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Contact Form */}
        <div className="lg:col-span-7 bg-ivory p-6 md:p-10">
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
              <div className="mt-4 flex justify-center">
                <LinedButton onClick={() => setSubmitted(false)}>Send Another Inquiry</LinedButton>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
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
                  <Label htmlFor="subject" className="text-[11px] uppercase tracking-luxe text-stone">
                    Inquiry Topic
                  </Label>
                  <select
                    id="subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full h-11 rounded-none border-0 border-b border-line bg-transparent px-0 text-sm focus:outline-none focus:border-ink"
                  >
                    <option value="Order Inquiry">Order Inquiry & Tracking</option>
                    <option value="Consultation">Bespoke Ritual Consultation</option>
                    <option value="Press">Press & Media Relations</option>
                    <option value="General">General Inquiry</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="orderId" className="text-[11px] uppercase tracking-luxe text-stone">
                    Order # (Optional)
                  </Label>
                  <Input
                    id="orderId"
                    placeholder="e.g. LTY-98421"
                    value={orderId}
                    onChange={(e) => setOrderId(e.target.value)}
                    className="h-11 rounded-none border-0 border-b border-line bg-transparent px-0 text-sm focus-visible:ring-0 focus-visible:border-ink"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message" className="text-[11px] uppercase tracking-luxe text-stone">
                  Your Message *
                </Label>
                <textarea
                  id="message"
                  required
                  rows={5}
                  placeholder="How may our concierge assist you?"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full rounded-none border-0 border-b border-line bg-transparent p-2 text-sm text-ink focus:outline-none focus:border-ink resize-none"
                />
              </div>

              <div className="pt-2 flex justify-center">
                <LinedButton type="submit">Send Message</LinedButton>
              </div>
            </form>
          )}
        </div>

        {/* Right Info Sidebar */}
        <div className="lg:col-span-5 space-y-8">
          <div className="bg-ivory p-6 md:p-8 space-y-6">
            <h2 className="font-serif text-xl font-medium text-ink border-b border-line pb-3">
              Direct Concierge Lines
            </h2>

            <div className="space-y-5 text-sm">
              <div className="flex items-start gap-3">
                <Mail className="h-4 w-4 text-stone mt-0.5" />
                <div>
                  <p className="text-[11px] uppercase tracking-luxe text-stone">Client Support Email</p>
                  <a href="mailto:concierge@letty.com" className="font-medium text-ink underline-offset-4 hover:underline">
                    concierge@letty.com
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="h-4 w-4 text-stone mt-0.5" />
                <div>
                  <p className="text-[11px] uppercase tracking-luxe text-stone">Global Concierge Desk</p>
                  <p className="font-medium text-ink">+33 (0) 1 42 68 00 00</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="h-4 w-4 text-stone mt-0.5" />
                <div>
                  <p className="text-[11px] uppercase tracking-luxe text-stone">Advisory Hours</p>
                  <p className="font-medium text-ink">Monday – Saturday: 9:00 – 19:00 CET</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Flagship Outposts Section */}
      <section className="pt-12">
        <div className="text-center max-w-xl mx-auto mb-12">
          <p className="text-xs uppercase tracking-luxe text-stone font-medium">Bespoke Outposts</p>
          <h2 className="mt-2 font-serif text-3xl font-medium text-ink">Flagship Boutiques</h2>
        </div>

        <div className="grid grid-cols-1 gap-x-5 gap-y-10 md:grid-cols-3">
          {BOUTIQUES.map((b) => (
            <div key={b.city} className="flex flex-col items-center text-center">
              <span className="text-[11px] font-medium uppercase tracking-luxe text-stone">Boutique</span>
              <h3 className="mt-3 font-serif text-xl font-medium text-ink">{b.city}</h3>
              <p className="mt-3 text-sm text-stone flex items-start gap-2 text-center">
                <MapPin className="h-4 w-4 text-stone shrink-0 mt-0.5" />
                <span>{b.address}</span>
              </p>
              <p className="mt-2 text-[11px] uppercase tracking-luxe text-stone">{b.hours}</p>
              <p className="mt-1 text-xs font-medium text-ink">{b.phone}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
