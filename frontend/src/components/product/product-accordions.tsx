import { Check, Lightbulb, Sparkles } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { Product } from "@/types";

/** PDP detail accordions — Product Info, How To Use & Beauty Hacks, Ingredients, Shipping & Returns. */
export function ProductAccordions({ product }: { product: Product }) {
  return (
    <Accordion className="mt-10 border-t border-line" defaultValue="product-info">
      {/* 1. PRODUCT INFO */}
      <AccordionItem value="product-info">
        <AccordionTrigger className="text-xs font-medium uppercase tracking-luxe-sm text-ink">
          Product Info
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-4 text-sm text-stone">
            {product.whatItIs && (
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-luxe text-ink">
                  What It Is
                </p>
                <p className="mt-1 leading-relaxed">{product.whatItIs}</p>
              </div>
            )}

            {product.whatItDoes && (
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-luxe text-ink">
                  What It Does
                </p>
                <p className="mt-1 whitespace-pre-line leading-relaxed">{product.whatItDoes}</p>
              </div>
            )}

            {product.whatElseToKnow && product.whatElseToKnow.length > 0 && (
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-luxe text-ink">
                  What Else To Know
                </p>
                <ul className="mt-2.5 space-y-1.5">
                  {product.whatElseToKnow.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs leading-normal">
                      <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-secondary text-ink">
                        <Check className="h-2.5 w-2.5" />
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {product.details && product.details.length > 0 && !product.whatElseToKnow && (
              <ul className="flex list-disc flex-col gap-1.5 pl-5 text-sm text-stone">
                {product.details.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
            )}
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* 2. HOW TO USE, PRO TIP & BEAUTY HACKS */}
      {(product.howToUseSteps || product.proTip || product.beautyHack) && (
        <AccordionItem value="how-to-use">
          <AccordionTrigger className="text-xs font-medium uppercase tracking-luxe-sm text-ink">
            How To Use &amp; Pro Tips
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-5 text-sm text-stone">
              {product.howToUseSteps && product.howToUseSteps.length > 0 && (
                <div className="space-y-3">
                  {product.howToUseSteps.map((step, idx) => (
                    <div key={idx} className="rounded-lg bg-secondary/50 p-3">
                      <p className="font-serif text-sm font-medium text-ink">
                        {step.title}
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-stone">
                        {step.text}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {product.proTip && (
                <div className="rounded-lg border-l-2 border-[#C5A265] bg-[#FDFBF7] p-3.5 text-xs text-[#5C4827]">
                  <div className="flex items-center gap-1.5 font-medium uppercase tracking-luxe-sm text-[#8C6D32]">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Pro Tip</span>
                  </div>
                  <p className="mt-1.5 italic leading-relaxed">{product.proTip}</p>
                </div>
              )}

              {product.beautyHack && (
                <div className="rounded-lg border border-line bg-secondary/30 p-4">
                  <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-luxe text-ink">
                    <Lightbulb className="h-3.5 w-3.5 text-[#C5A265]" />
                    <span>Beauty Hack: {product.beautyHack.title}</span>
                  </div>
                  <ol className="mt-3 space-y-1.5 text-xs text-stone">
                    {product.beautyHack.steps.map((step, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-ink text-[9px] font-bold text-ivory">
                          {idx + 1}
                        </span>
                        <span className="leading-snug">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      )}

      {/* 3. INGREDIENTS */}
      {product.ingredients && (
        <AccordionItem value="ingredients">
          <AccordionTrigger className="text-xs font-medium uppercase tracking-luxe-sm text-ink">
            Ingredients (INCI)
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              <p className="text-xs font-medium text-ink uppercase tracking-luxe-sm">Full Formulation</p>
              <p className="text-xs leading-relaxed tracking-wide text-stone">
                {product.ingredients}
              </p>
            </div>
          </AccordionContent>
        </AccordionItem>
      )}

      {/* 4. SHIPPING & RETURNS */}
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
                Every LETTY order arrives beautifully presented in our signature luxury box, finished with custom ribbon and refined detailing at no additional cost.
              </p>
            </div>
            <div>
              <p className="font-medium text-ink">Returns &amp; Exchanges</p>
              <p className="mt-1">
                Unopened and unused makeup and lip products may be returned within 30 days of delivery for a refund. For hygiene and safety reasons, opened or tested lip products cannot be returned unless faulty.
              </p>
              <p className="mt-1">
                Eligible shade exchanges are complimentary. Contact our concierge team with your order number to initiate an exchange.
              </p>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
