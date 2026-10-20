import Link from "next/link";
import { Minus, Plus, Truck } from "lucide-react";
import { MWAH_COPY } from "@/lib/mwah-copy";

function CopySection({ title, paragraphs, bullets }: { title: string; paragraphs?: string[]; bullets?: string[] }) {
  return <div className="space-y-3"><h4 className="text-[10px] font-medium uppercase tracking-[0.15em] text-ink">{title}</h4>{paragraphs?.map(paragraph => <p key={paragraph} className="text-xs leading-7 text-stone">{paragraph}</p>)}{bullets && <ul className="list-disc space-y-2 pl-4 text-xs leading-6 text-stone marker:text-[#a87886]">{bullets.map(item => <li key={item}>{item}</li>)}</ul>}</div>;
}

/** Native disclosure rows preserve keyboard access and work before hydration. */
export function MwahDetails() {
  const sections = [
    { title: "Product Info", content: <div className="space-y-7"><CopySection title="What it is" paragraphs={MWAH_COPY.whatItIs} /><CopySection title="What it does" bullets={MWAH_COPY.whatItDoes} /><CopySection title="Product details" bullets={MWAH_COPY.productDetails} /><CopySection title="What else to know" bullets={MWAH_COPY.whatElse} /><CopySection title="Why we’re obsessed" paragraphs={MWAH_COPY.whyWeLove} bullets={MWAH_COPY.favourites} /></div> },
    { title: "How to Use", content: <div className="space-y-3">{MWAH_COPY.howToUse.map((paragraph, index) => <p key={paragraph} className={index === MWAH_COPY.howToUse.length - 1 ? "pt-2 font-forum text-lg italic text-ink" : "text-xs leading-7 text-stone"}>{paragraph}</p>)}</div> },
    { title: "Ingredients", content: <div className="space-y-3"><p className="text-xs leading-7 text-stone">{MWAH_COPY.ingredients}</p><p className="text-[10px] leading-6 text-stone">Please check the final packaging for the complete ingredient list.</p></div> },
  ];
  return <section aria-label="Mwah product information" className="mt-8">
    <Link href="/shipping" className="mb-4 inline-flex min-h-11 items-center gap-2 text-[11px] text-ink underline underline-offset-4"><Truck className="h-3.5 w-3.5" strokeWidth={1.4} aria-hidden />Shipping info</Link>
    <div className="border-t border-ink/20">{sections.map(section => <details key={section.title} className="group border-b border-ink/20">
      <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 py-5 font-serif text-sm uppercase tracking-[0.08em] text-ink transition hover:text-stone focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink [&::-webkit-details-marker]:hidden">
        <span>{section.title}</span><Plus className="h-4 w-4 shrink-0 group-open:hidden" strokeWidth={1.3} aria-hidden /><Minus className="hidden h-4 w-4 shrink-0 group-open:block" strokeWidth={1.3} aria-hidden />
      </summary>
      <div className="pb-7 pr-2">{section.content}</div>
    </details>)}</div>
  </section>;
}
