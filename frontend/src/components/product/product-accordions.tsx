import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { Product } from "@/types";

/** PDP detail accordions — details, ingredients, shipping & returns. */
export function ProductAccordions({ product }: { product: Product }) {
  return (
    <Accordion className="mt-10 border-t border-line">
      <AccordionItem value="details">
        <AccordionTrigger className="text-xs font-medium uppercase tracking-luxe-sm text-ink">
          Details
        </AccordionTrigger>
        <AccordionContent>
          <ul className="flex list-disc flex-col gap-1.5 pl-5 text-sm text-stone">
            {product.details.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
        </AccordionContent>
      </AccordionItem>

      {product.ingredients && (
        <AccordionItem value="ingredients">
          <AccordionTrigger className="text-xs font-medium uppercase tracking-luxe-sm text-ink">
            Ingredients
          </AccordionTrigger>
          <AccordionContent>
            <p className="text-sm leading-relaxed text-stone">{product.ingredients}</p>
          </AccordionContent>
        </AccordionItem>
      )}

      <AccordionItem value="shipping">
        <AccordionTrigger className="text-xs font-medium uppercase tracking-luxe-sm text-ink">
          Shipping &amp; Returns
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-4 text-sm leading-relaxed text-stone">
            <div>
              <p className="font-medium text-ink">Shipping &amp; Packaging</p>
              <p className="mt-1">
                LETTY currently ships across the United Kingdom, with international delivery available to selected destinations. Delivery times and shipping costs are calculated at checkout based on your location and chosen delivery method.
              </p>
              <p className="mt-1">
                Every LETTY order arrives beautifully presented in our signature packaging, finished with ribbon and refined detailing at no additional cost.
              </p>
            </div>
            <div>
              <p className="font-medium text-ink">Returns &amp; Exchanges</p>
              <p className="mt-1">
                Unopened and unused makeup, beauty and fragrance products may be returned within 30 days of delivery for a refund. For hygiene and safety reasons, opened or used makeup, beauty and fragrance products cannot be returned unless faulty.
              </p>
              <p className="mt-1">
                Fashion and eyewear items may be returned within 14 days of delivery, provided they are unworn, unused and returned in their original condition with all tags and packaging intact. Eyewear must be returned unworn, with its original case and accessories.
              </p>
              <p className="mt-1">
                Eligible shade and size exchanges are complimentary. Contact our Customer Care team with your order number and reason to initiate a return or exchange.
              </p>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
