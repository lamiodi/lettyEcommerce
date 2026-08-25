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
      {
        question: "What should I do if my order arrives damaged or incorrect?",
        answer:
          "Please contact our Customer Care team as soon as possible with your order number and photographs of the item and packaging. We’ll review the issue and arrange the appropriate resolution.",
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
        question: "Where are LETTY products made?",
        answer:
          "LETTY works with specialist manufacturing partners across Europe and beyond, selected for their expertise, quality standards and craftsmanship. The country of origin for each product is stated on the relevant product page and packaging.",
      },
      {
        question: "How should I store my fragrance?",
        answer:
          "Store your fragrance in a cool, dry place away from direct sunlight, heat and significant temperature changes. Keeping the bottle in its original box or a dark cabinet can help preserve the fragrance over time.",
      },
      {
        question: "Are your products suitable for sensitive skin?",
        answer:
          "Individual suitability varies by product. Please review the ingredient list and product guidance provided on each product page. If you have specific sensitivities, we recommend seeking appropriate professional advice before use.",
      },
      {
        question: "Where can I find ingredient information?",
        answer:
          "Full ingredient information is provided on the relevant product page and product packaging.",
      },
    ],
  },
  {
    title: "Orders & Payment",
    items: [
      {
        question: "Which payment methods do you accept?",
        answer:
          "LETTY accepts major credit, debit cards, Apple Pay, Google Pay, and other payment options available at checkout. All transactions are processed securely.",
      },
      {
        question: "Can I modify or cancel my order?",
        answer:
          "We begin processing orders promptly, so changes or cancellations cannot always be guaranteed. If you need to amend or cancel an order, please contact our Customer Care team as soon as possible and we’ll do our best to assist before it is dispatched.",
      },
      {
        question: "Do you offer samples?",
        answer:
          "Complimentary samples may be included with selected orders, subject to availability. Sample selections can vary and cannot always be guaranteed.",
      },
      {
        question: "What happens if an item is out of stock?",
        answer:
          "Products that are temporarily unavailable will be marked as out of stock. Where available, you can sign up to be notified when an item returns.",
      },
      {
        question: "Can I use more than one promotional code?",
        answer:
          "Unless otherwise stated, promotional codes cannot be combined and are subject to their individual terms and conditions.",
      },
      {
        question: "How can I contact LETTY?",
        answer:
          "For order assistance, product guidance or general enquiries, please contact our Customer Care team through the Contact page.",
      },
    ],
  },
];
