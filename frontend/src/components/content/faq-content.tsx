"use client";

import { useState } from "react";
import { ChevronDown, HelpCircle, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { faqGroups } from "@/lib/mock/content";

const CATEGORIES = [
  "All",
  "Shipping & Delivery",
  "Returns & Exchanges",
  "Products & Ingredients",
  "Orders & Payment",
];

const ALL_FAQS = faqGroups.flatMap((group) =>
  group.items.map((item, idx) => ({
    id: `${group.title}-${idx}`,
    category: group.title,
    question: item.question,
    answer: item.answer,
  }))
);

export function FaqContent() {
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [openId, setOpenId] = useState<string | null>(ALL_FAQS[0]?.id ?? null);

  const filteredFaqs = ALL_FAQS.filter((faq) => {
    const matchesCategory =
      selectedCategory === "All" || faq.category === selectedCategory;
    const matchesQuery =
      query.trim() === "" ||
      faq.question.toLowerCase().includes(query.toLowerCase()) ||
      faq.answer.toLowerCase().includes(query.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 md:px-8 md:py-20 space-y-12">
      <header className="text-center space-y-3">
        <p className="text-xs font-medium uppercase tracking-luxe text-stone">Client Support</p>
        <h1 className="font-serif text-4xl font-medium text-ink md:text-5xl">
          Frequently Asked Questions
        </h1>
        <p className="text-sm text-stone max-w-lg mx-auto">
          Explore our guide to delivery timelines, botanical formulation standards, and concierge services.
        </p>

        {/* Live Search Input */}
        <div className="pt-6 max-w-md mx-auto relative">
          <Search className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-4 text-stone" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search FAQs (e.g. shipping, returns, formulas)..."
            className="pl-7 h-12 rounded-none border-0 border-b border-line bg-transparent text-sm focus-visible:ring-0 focus-visible:border-ink"
          />
        </div>
      </header>

      {/* Category Tabs */}
      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`text-[11px] font-medium uppercase tracking-luxe transition-colors ${
              selectedCategory === cat
                ? "text-ink border-b border-ink pb-1"
                : "text-stone hover:text-ink"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Accordion Group */}
      <div className="space-y-0 pt-4">
        {filteredFaqs.length === 0 ? (
          <div className="text-center py-16">
            <HelpCircle className="h-8 w-8 text-stone mx-auto mb-3" />
            <p className="font-serif text-xl text-ink">No matching answers found</p>
            <p className="text-sm text-stone mt-1">
              Try searching with different terms or contact our client concierge directly.
            </p>
          </div>
        ) : (
          filteredFaqs.map((faq) => {
            const isOpen = openId === faq.id;
            return (
              <div
                key={faq.id}
                className="border-b border-line"
              >
                <button
                  type="button"
                  onClick={() => setOpenId(isOpen ? null : faq.id)}
                  className="w-full flex items-center justify-between py-5 text-left text-ink transition"
                >
                  <span className="font-serif text-lg font-medium pr-4">{faq.question}</span>
                  <ChevronDown
                    className={`h-4 w-4 text-stone shrink-0 transition-transform duration-300 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="pb-6 text-sm text-stone leading-relaxed">
                    <p>{faq.answer}</p>
                    <span className="mt-3 block text-[11px] uppercase tracking-luxe text-stone font-medium">
                      Category: {faq.category}
                    </span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
