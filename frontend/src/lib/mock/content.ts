import type { FaqGroup } from "@/types";
import type { ImageKey } from "@/lib/images";

export const instagramImages: ImageKey[] = [
  "instagram1",
  "instagram2",
  "instagram3",
  "instagram4",
  "instagram5",
];

export const faqGroups: FaqGroup[] = [
  {
    title: "Shipping & Delivery",
    items: [
      {
        question: "Where does LETTY ship?",
        answer:
          "We ship worldwide. Orders over $150 enjoy complimentary express shipping. Delivery is 1–3 business days in metro areas and 3–7 business days internationally.",
      },
      {
        question: "How can I track my order?",
        answer:
          "A tracking link is emailed the moment your order leaves our atelier. You can also follow the link in your shipping confirmation at any time.",
      },
      {
        question: "Do you offer gift wrapping?",
        answer:
          "Every order arrives in our signature ivory box with grosgrain ribbon, sealed with gold foil — at no additional cost.",
      },
    ],
  },
  {
    title: "Returns & Exchanges",
    items: [
      {
        question: "What is your return policy?",
        answer:
          "Unopened products may be returned within 30 days for a full refund. Fashion pieces may be returned unworn with tags attached within 14 days.",
      },
      {
        question: "How do I start a return?",
        answer:
          "Contact our concierge with your order number and we will arrange a prepaid return label. Refunds are issued within 5 business days of receipt.",
      },
      {
        question: "Can I exchange a shade or size?",
        answer:
          "Yes — shade and size exchanges are complimentary. Reach out to our concierge and we will ship the replacement before your return arrives.",
      },
    ],
  },
  {
    title: "Products & Ingredients",
    items: [
      {
        question: "Are LETTY products cruelty-free?",
        answer:
          "Always. We never test on animals and work only with suppliers who share this commitment. The majority of our formulas are vegan.",
      },
      {
        question: "Where are products made?",
        answer:
          "Our skincare and fragrance are formulated in France, hair care in Italy, and our fashion atelier pieces are cut in Portugal.",
      },
      {
        question: "How should I store my fragrance?",
        answer:
          "Keep flacons away from direct sunlight and heat. A cool, dark cabinet preserves the composition for years.",
      },
    ],
  },
  {
    title: "Orders & Payment",
    items: [
      {
        question: "Which payment methods do you accept?",
        answer:
          "We accept all major cards, Apple Pay, Google Pay, and regional payment methods at checkout. All transactions are encrypted.",
      },
      {
        question: "Can I modify or cancel my order?",
        answer:
          "Orders can be modified within one hour of placement. Contact the concierge immediately and we will do our best to accommodate.",
      },
      {
        question: "Do you offer samples?",
        answer:
          "Two deluxe samples of your choice accompany every order, selected at checkout.",
      },
    ],
  },
];
