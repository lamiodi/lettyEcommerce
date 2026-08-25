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
          "LETTY currently ships across the United Kingdom, with international delivery available to selected destinations. Delivery times and shipping costs are calculated at checkout based on your location and chosen delivery method.",
      },
      {
        question: "How can I track my order?",
        answer:
          "A tracking link will be emailed to you once your order has been dispatched. You can also access tracking details through your shipping confirmation email.",
      },
      {
        question: "Do you offer gift wrapping?",
        answer:
          "Every LETTY order arrives beautifully presented in our signature packaging, finished with ribbon and refined detailing at no additional cost.",
      },
    ],
  },
  {
    title: "Returns & Exchanges",
    items: [
      {
        question: "What is your return policy?",
        answer:
          "Unopened and unused makeup, beauty and fragrance products may be returned within 30 days of delivery for a refund. Fashion and eyewear items may be returned within 14 days of delivery, provided they are unworn, unused and returned in their original condition with all tags and packaging intact.\n\nFor hygiene and safety reasons, opened or used makeup, beauty and fragrance products cannot be returned unless faulty. Eyewear must be returned unworn, with its original case and accessories.",
      },
      {
        question: "How do I start a return?",
        answer:
          "Contact our Customer Care team with your order number and reason for return. We’ll provide the next steps and, where applicable, a return label. Refunds are processed within 5 business days of receiving and inspecting your return.",
      },
      {
        question: "Can I exchange a shade or size?",
        answer:
          "Yes. Eligible shade and size exchanges are complimentary. Contact our Customer Care team with your order number, and we’ll guide you through the exchange process. Replacement items are dispatched once the original item has been received and approved.",
      },
    ],
  },
  {
    title: "Products & Ingredients",
    items: [
      {
        question: "Are LETTY products cruelty-free?",
        answer:
          "Yes. LETTY is committed to cruelty-free beauty. We do not test our products on animals and work with suppliers who share the same standards. Vegan formulas are identified individually on each product page.",
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
