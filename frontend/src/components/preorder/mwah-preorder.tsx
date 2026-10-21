"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowDown, ArrowUpRight, Check, Minus, Plus, ShoppingBag, Truck } from "lucide-react";
import { toast } from "sonner";
import { LettyImage } from "@/components/shared/letty-image";
import { Price } from "@/components/shared/price";
import { ProductInterest } from "@/components/product/product-interest";
import { MwahDetails } from "@/components/preorder/mwah-details";
import { useCartStore } from "@/lib/store/cart";
import { cn } from "@/lib/utils";
import type { Product } from "@/types";

/** Mwah campaign using the same catalog variants and bag as the storefront. */
export function MwahPreorder({
  product,
  initialShade,
}: {
  product: Product;
  initialShade?: string;
}) {
  const findVariantId = (shade?: string) => {
    if (!shade) return product.variants[0]?.id;
    const lower = shade.toLowerCase().trim();
    const found = product.variants.find(
      (v) =>
        v.id === shade ||
        v.sku.toLowerCase() === lower ||
        v.color?.toLowerCase().includes(lower) ||
        v.sku.toLowerCase().includes(lower),
    );
    return found ? found.id : product.variants[0]?.id;
  };

  const [selectedVariantId, setSelectedVariantId] = useState<string>(
    () => findVariantId(initialShade) ?? "",
  );

  useEffect(() => {
    if (initialShade) {
      const match = findVariantId(initialShade);
      if (match) setSelectedVariantId(match);
    }
  }, [initialShade, product.variants]);

  const [quantity, setQuantity] = useState(1);
  const addLine = useCartStore((state) => state.addLine);
  const reducedMotion = useReducedMotion();

  const variant =
    product.variants.find((v) => v.id === selectedVariantId) ??
    product.variants[0];
  const isNoir =
    variant?.sku === "LET-MWAH-NR" ||
    (variant?.color ? /noir/i.test(variant.color) : false);
  const edition = isNoir ? "Noir" : "Ivory";
  const mainImageKey = isNoir ? "mwahNoir" : "mwahIvory";
  const available = (variant?.stockQuantity ?? 50) > 0;

  const handleSelectEdition = (variantId: string) => {
    setSelectedVariantId(variantId);
    setQuantity(1);
  };

  const reserve = () => {
    if (!variant || !available) return;
    addLine({ productSlug: product.slug, variantId: variant.id, quantity });
    toast.success(`${variant.color ?? `${edition} Edition`} added to your bag as a preorder`);
  };

  return (
    <div className="bg-background text-ink">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
        <div className="flex items-center justify-between gap-4 border-b border-ink/15 py-5 text-[9px] uppercase tracking-[0.18em] text-stone sm:text-[10px]">
          <Link href="/shop" className="transition hover:text-ink">The beauty edit</Link>
          <span className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-[#b77588]" aria-hidden />Preorder exclusive</span>
        </div>
        <header className="py-9 text-center sm:py-12 lg:py-14">
          <p className="text-[9px] uppercase tracking-[0.24em] text-stone sm:text-[10px]">Something lovely is on its way</p>
          <h1 className="mt-4 flex flex-wrap items-baseline justify-center gap-x-3 font-serif text-[40px] leading-[1.1] sm:gap-x-5 sm:text-6xl lg:text-[76px]"><span>Meet</span><span className="font-forum text-[1.35em] lowercase italic tracking-[-0.065em] text-[#ad657b]">mwah.</span></h1>
          <p className="mt-4 text-sm leading-relaxed text-stone sm:text-base">A little love for your lips.</p>
        </header>
        <section id="reserve" aria-label="Preorder mwah Lip Balm" className="grid scroll-mt-28 items-start gap-8 pb-12 lg:grid-cols-[1.2fr_1fr] lg:gap-12 lg:pb-20 xl:gap-20">
          <div>
            <div className="relative overflow-hidden rounded-[18px] bg-[#f2e9df]">
              <div className="absolute left-4 top-4 z-10 rounded-full border border-ink/10 bg-surface/90 px-3 py-1.5 text-[9px] uppercase tracking-[0.18em] sm:left-5 sm:top-5">The {edition} edition</div>
              <div className="relative aspect-[3/2] sm:aspect-[4/3] lg:aspect-[1.1/1]">
                <AnimatePresence initial={false} mode="sync"><motion.div key={variant?.id ?? edition} className="absolute inset-0" initial={{ opacity: reducedMotion ? 1 : 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reducedMotion ? 0 : 0.35 }}>
                  <LettyImage imageKey={mainImageKey} priority alt={`${edition} Edition mwah Lip Balm, tube and box`} sizes="(max-width: 1024px) 100vw, 55vw" className="object-contain" containerClassName="!bg-transparent" />
                </motion.div></AnimatePresence>
              </div>
              <div className="flex items-center justify-between border-t border-ink/10 px-4 py-3.5 text-[9px] uppercase tracking-[0.18em] text-stone sm:px-5"><span>Two editions. One little ritual.</span><span>10 ml</span></div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">{product.variants.map((item) => {
              const itemIsNoir = item.sku === "LET-MWAH-NR" || (item.color ? /noir/i.test(item.color) : false);
              const isSelected = variant?.id === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectEdition(item.id)}
                  aria-label={`Select ${item.color}`}
                  aria-pressed={isSelected}
                  className={cn(
                    "group flex items-center gap-3 overflow-hidden rounded-xl border p-2 text-left transition focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink cursor-pointer",
                    isSelected ? "border-ink/50 bg-surface/80 ring-1 ring-ink/30" : "border-ink/10 hover:border-ink/30"
                  )}
                >
                  <span className="block aspect-[3/2] w-[74px] shrink-0 overflow-hidden rounded-lg sm:w-[92px]">
                    <LettyImage imageKey={itemIsNoir ? "mwahNoir" : "mwahIvory"} alt="" sizes="100px" />
                  </span>
                  <span className="text-[10px] leading-relaxed text-ink sm:text-xs font-medium">
                    {item.color}
                    <span className="mt-0.5 block text-[9px] text-stone font-normal">
                      {itemIsNoir ? "Bold & distinctive" : "Soft & understated"}
                    </span>
                  </span>
                </button>
              );
            })}</div>
          </div>
          <div className="lg:sticky lg:top-28 lg:pt-2">
            <ProductInterest slug={product.slug} />
            <div className="flex items-center justify-between gap-3 text-[10px] uppercase tracking-[0.2em] text-stone"><span>LETTY</span><span className="text-[#a36377]">The lip-care ritual</span></div>
            <h2 className="mt-3 font-serif text-[27px] leading-tight sm:text-[32px]">mwah Lip Balm</h2>
            <p className="mt-2 text-[10px] uppercase tracking-[0.14em] text-stone">10 ml · SPF 15 · Soft, comfortable shine</p>
            <p className="mt-4 max-w-md text-[13px] leading-7 text-stone">{product.description}</p>
            <fieldset className="mt-7"><legend className="mb-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-ink">Choose your shade / edition</legend>
              <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Shade and edition options">{product.variants.map((item) => {
                const itemIsNoir = item.sku === "LET-MWAH-NR" || (item.color ? /noir/i.test(item.color) : false);
                const isSelected = variant?.id === item.id;
                return (
                  <label
                    key={item.id}
                    className={cn(
                      "relative flex min-h-[88px] cursor-pointer flex-col justify-between rounded-xl border p-3.5 transition focus-within:outline-2 focus-within:outline-offset-4 focus-within:outline-ink select-none",
                      itemIsNoir ? "bg-[#252221] text-[#f5eee5]" : "bg-surface text-ink",
                      isSelected ? "border-[#aa6a7f] ring-2 ring-[#aa6a7f]" : "border-ink/15 hover:border-ink/40"
                    )}
                  >
                    <input
                      className="sr-only"
                      type="radio"
                      name="mwah-edition"
                      value={item.id}
                      checked={isSelected}
                      onChange={() => handleSelectEdition(item.id)}
                    />
                    <span className="flex items-center justify-between">
                      <span className={cn("h-3.5 w-3.5 rounded-full border shadow-sm", itemIsNoir ? "border-white/40 bg-[#3e3633]" : "border-ink/25 bg-[#e9dfd0]")} />
                      <span className={cn("flex h-4 w-4 items-center justify-center rounded-full border transition-colors", isSelected ? "border-[#aa6a7f] bg-[#aa6a7f] text-white" : "border-current/30")}>
                        {isSelected && <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} aria-hidden />}
                      </span>
                    </span>
                    <span className="mt-3 text-[12px] font-medium leading-tight">{item.color}</span>
                  </label>
                );
              })}</div>
              <p className="mt-2.5 text-[10px] leading-relaxed text-stone">Two packaging editions of the same signature lip balm.</p>
            </fieldset>
            <dl className="mt-6 divide-y divide-ink/10 border-y border-ink/15">
              <div className="flex items-center justify-between gap-4 py-4"><dt className="text-xs text-stone">Preorder price</dt><dd><Price price={product.basePriceUsd} className="text-xl" /></dd></div>
              <div className="flex items-start justify-between gap-6 py-4"><dt className="shrink-0 pt-0.5 text-xs text-stone">Expected dispatch</dt><dd className="max-w-[195px] text-right text-xs leading-5 text-ink">{product.preorderDispatch}</dd></div>
            </dl>
            <div className="mt-5 flex items-center gap-3">
              <div className="flex h-[52px] shrink-0 items-center rounded-full border border-ink/20" aria-label="Preorder quantity">
                <button type="button" onClick={() => setQuantity(value => Math.max(1, value - 1))} disabled={quantity <= 1} aria-label="Decrease preorder quantity" className="flex h-11 w-9 items-center justify-center rounded-full disabled:opacity-30"><Minus className="h-3 w-3" /></button>
                <span className="min-w-4 text-center text-xs tabular-nums" aria-live="polite">{quantity}</span>
                <button type="button" onClick={() => setQuantity(value => Math.min(variant?.stockQuantity ?? 50, value + 1))} disabled={!available || quantity >= (variant?.stockQuantity ?? 50)} aria-label="Increase preorder quantity" className="flex h-11 w-9 items-center justify-center rounded-full disabled:opacity-30"><Plus className="h-3 w-3" /></button>
              </div>
              <button type="button" onClick={reserve} disabled={!available} className="flex min-h-[52px] min-w-0 flex-1 cursor-pointer items-center justify-center gap-2 rounded-full bg-ink px-4 py-3.5 text-[10px] uppercase tracking-[0.12em] text-ivory transition hover:bg-ink/90 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink disabled:cursor-not-allowed disabled:opacity-45 sm:text-[11px]"><ShoppingBag className="h-3.5 w-3.5 shrink-0" aria-hidden /><span>Preorder {edition} mwah</span><ArrowUpRight className="hidden h-3.5 w-3.5 shrink-0 sm:block" aria-hidden /></button>
            </div>
            {!available && <p role="status" className="mt-2 text-xs text-stone">Preorder allocation is being confirmed for this edition.</p>}
            <p className="mt-3 text-[10px] leading-5 text-stone">Full payment is taken at checkout. Shipping is calculated separately. Your selected edition and estimated dispatch are shown before you pay.</p>
            <div className="mt-5 flex items-start gap-2.5 text-[11px] leading-5 text-stone"><Truck className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={1.4} aria-hidden /><span>Delivery time starts after dispatch.</span></div>
            <MwahDetails />
          </div>
        </section>
        <section className="grid gap-8 border-t border-ink/15 py-10 sm:py-14 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20" aria-labelledby="little-things-heading">
          <div><p className="text-[9px] uppercase tracking-[0.2em] text-stone">Made for your everyday</p><h2 id="little-things-heading" className="mt-4 font-serif text-2xl leading-snug sm:text-[30px]">The little things<br />make it special<span className="text-[#ad657b]">.</span></h2><p className="mt-4 max-w-sm text-xs leading-6 text-stone">On your vanity. In your handbag. Wherever the day takes you, a little more LETTY.</p></div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 sm:gap-5">{[{ number: "01", title: "Your edition", text: "Ivory or Noir. Two distinctive expressions of one signature lip-care ritual." }, { number: "02", title: "Your little ritual", text: "A 10 ml everyday essential, made to find its place among your favourites." }, { number: "03", title: "Your first mwah", text: "Discover the upcoming release, with estimated dispatch shown before you order." }].map(item => <div key={item.number} className="border-t border-ink/15 pt-4"><span className="text-[10px] text-[#ad657b]">{item.number}</span><h3 className="mt-3 font-forum text-xl">{item.title}</h3><p className="mt-2 text-xs leading-6 text-stone">{item.text}</p></div>)}</div>
        </section>
        <aside className="mb-12 grid gap-4 rounded-2xl border border-ink/10 bg-surface/60 p-6 sm:p-8 md:grid-cols-[1fr_2fr] md:gap-10" aria-labelledby="preorder-note">
          <h2 id="preorder-note" className="text-[10px] uppercase leading-6 tracking-[0.15em]">A note about your preorder</h2>
          <div><p className="text-xs leading-6 text-stone">This is a preorder for the forthcoming mwah release. Estimated dispatch is <span className="text-ink">{product.preorderDispatch}</span>; delivery time starts after dispatch. Full payment is collected when your order is placed.</p><div className="mt-4 flex flex-wrap gap-x-6 gap-y-3 text-[10px] underline underline-offset-4"><Link href="/returns">Cancellation & returns</Link><Link href="/shipping">Delivery information</Link><Link href="/contact">Ask the concierge</Link></div></div>
        </aside>
        <a href="#reserve" className="mb-10 flex items-center justify-center gap-2 text-[10px] uppercase tracking-[0.16em] text-stone">Choose your little ritual<ArrowDown className="h-3 w-3" aria-hidden /></a>
      </div>
    </div>
  );
}
