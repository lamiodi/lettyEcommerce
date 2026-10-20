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
          "Gift wrapping is not currently listed as a separate checkout option. We pack orders to help protect the products in transit.",
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
          "Please read our Returns & Refund Policy for the return window, hygiene conditions and steps to request a return. Contact Customer Care with your order number if you need help or if an item arrives damaged or incorrect.",
      },
      {
        question: "How do I start a return?",
        answer:
          "Contact Customer Care with your order number and reason for return. We’ll explain the next steps and any applicable return costs. Refund processing details are set out in our Returns & Refund Policy.",
      },
      {
        question: "Can I exchange a shade or size?",
        answer:
          "Contact Customer Care before returning an item. We’ll confirm whether an exchange is available and explain any conditions or costs.",
      },
    ],
  },
  {
    title: "Products & Ingredients",
    items: [
      {
        question: "Where can I check vegan or cruelty-free information?",
        answer:
          "Check the product page and final packaging for product-specific information. Contact Customer Care if you need clarification before ordering.",
      },
      {
        question: "Where can I check product information?",
        answer:
          "Check each product page and the final product packaging for product details, usage instructions and manufacturer information. Contact Customer Care if you need details that are not listed.",
      },
      {
        question: "How should I store my beauty products?",
        answer:
          "Follow the storage instructions on the product packaging. Keep caps and containers securely closed, and store your lip products in a cool, dry place away from direct sunlight.",
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
          "Checkout shows the payment methods available for your country, currency, device and order. These may include cards, Apple Pay, Google Pay, Link, PayPal, Klarna and Clearpay. Check the options and any provider terms shown at checkout.",
      },
      {
        question: "Can I modify or cancel my order?",
        answer:
          "We begin processing orders promptly, so changes or cancellations cannot always be guaranteed. If you need to amend or cancel an order, please contact our Customer Care team as soon as possible and we’ll do our best to assist before it is dispatched.",
      },
      {
        question: "Do you offer samples?",
        answer:
          "Only the items listed in your order are included. Any additional items offered with a purchase will be shown before checkout.",
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
