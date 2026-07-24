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
          <p className="text-sm leading-relaxed text-stone">
            Orders are dispatched from our atelier within 24 hours. Complimentary
            express shipping on orders over $150. Unopened products may be
            returned within 30 days; fashion pieces within 14 days with tags
            attached. Every order arrives in our signature ivory gift box.
          </p>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
