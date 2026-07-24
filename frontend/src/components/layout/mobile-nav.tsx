"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Logo } from "@/components/shared/logo";
import { NAV_LINKS } from "@/lib/constants";
import { collections } from "@/lib/mock/catalog";

/** Mobile slide-in navigation with expandable collections. */
export function MobileNav() {
  const [open, setOpen] = useState(false);

  const close = () => setOpen(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button variant="ghost" size="icon" aria-label="Open menu" className="lg:hidden" />
        }
      >
        <Menu className="h-[22px] w-[22px]" strokeWidth={1.25} />
      </SheetTrigger>
      <SheetContent side="left" className="w-80 bg-ivory p-0">
        <SheetHeader className="border-b border-line px-6 py-5">
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <Logo onClick={close} />
        </SheetHeader>

        <nav className="flex flex-col px-6 py-6" aria-label="Mobile">
          <Accordion className="w-full">
            {NAV_LINKS.map((link) =>
              link.label === "Collections" ? (
                <AccordionItem key={link.label} value="collections" className="border-line">
                  <AccordionTrigger className="py-3 font-serif text-lg text-ink hover:no-underline">
                    Collections
                  </AccordionTrigger>
                  <AccordionContent>
                    <ul className="space-y-3 pb-4 pl-2">
                      {collections.map((c) => (
                        <li key={c.slug}>
                          <Link
                            href={`/collections/${c.slug}`}
                            onClick={close}
                            className="text-sm text-stone transition-colors hover:text-gold"
                          >
                            {c.name}
                          </Link>
                        </li>
                      ))}
                      <li>
                        <Link
                          href="/collections"
                          onClick={close}
                          className="text-sm font-medium text-ink underline-offset-4 hover:underline"
                        >
                          View all
                        </Link>
                      </li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              ) : (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={close}
                  className="border-b border-line py-3 font-serif text-lg text-ink transition-colors hover:text-gold"
                >
                  {link.label}
                </Link>
              ),
            )}
          </Accordion>

          <div className="mt-8 space-y-3 border-t border-line pt-6">
            {[
              { label: "Our Story", href: "/story" },
              { label: "About", href: "/about" },
              { label: "Contact", href: "/contact" },
              { label: "FAQ", href: "/faq" },
              { label: "Wishlist", href: "/wishlist" },
            ].map((l) => (
              <Link
                key={l.label}
                href={l.href}
                onClick={close}
                className="block text-sm text-stone transition-colors hover:text-ink"
              >
                {l.label}
              </Link>
            ))}
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
