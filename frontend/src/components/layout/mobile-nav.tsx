"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, Search } from "lucide-react";
import { motion } from "framer-motion";
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
import { staggerContainer, staggerChild } from "@/lib/motion";
import { CurrencySwitcher } from "@/components/shared/currency-switcher";

interface MobileNavProps {
  onOpenSearch?: () => void;
}

/** Scrollable mobile slide-in navigation. */
export function MobileNav({ onOpenSearch }: MobileNavProps) {
  const [open, setOpen] = useState(false);

  const close = () => setOpen(false);

  const handleSearchClick = () => {
    close();
    onOpenSearch?.();
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button variant="ghost" size="icon" aria-label="Open menu" className="lg:hidden active:scale-90 transition-transform duration-200" />
        }
      >
        <Menu className="h-[22px] w-[22px]" strokeWidth={1.25} />
      </SheetTrigger>
      <SheetContent side="left" className="w-80 max-w-[90vw] overflow-y-auto bg-ivory p-0">
        <SheetHeader className="border-b border-line px-6 py-5">
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <Logo onClick={close} />
        </SheetHeader>

        <motion.nav
          className="flex flex-col px-6 py-6"
          aria-label="Mobile"
          variants={staggerContainer}
          initial="hidden"
          animate={open ? "visible" : "hidden"}
        >
          {onOpenSearch && (
            <button
              type="button"
              onClick={handleSearchClick}
              className="mb-4 flex w-full items-center gap-3 border border-line bg-secondary/50 px-3.5 py-2.5 text-xs text-stone transition-colors hover:border-stone hover:text-ink"
            >
              <Search className="h-4 w-4" strokeWidth={1.5} />
              <span>Search the Boutique...</span>
            </button>
          )}

          <div className="w-full">
            {NAV_LINKS.filter((link) => link.href !== "/collections").map((link) => (
                <motion.div key={link.label} variants={staggerChild}>
                  <Link
                    href={link.href}
                    onClick={close}
                    className="block border-b border-line py-3 font-serif text-lg text-ink transition-colors hover:text-gold"
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
          </div>

          <div className="mt-8 space-y-3 border-t border-line pt-6">
            {[
              { label: "Create an account / Sign In", href: "/login" },
            ].map((l) => (
              <motion.div key={l.label} variants={staggerChild}>
                <Link
                  href={l.href}
                  onClick={close}
                  className="flex min-h-11 items-center text-sm text-stone transition-colors hover:text-ink"
                >
                  {l.label}
                </Link>
              </motion.div>
            ))}
          </div>

          <div className="mt-8 border-t border-line pt-6">
            <p className="mb-2 text-[10px] uppercase tracking-luxe text-stone">Regional Currency</p>
            <CurrencySwitcher variant="footer" className="w-full" />
          </div>
        </motion.nav>
      </SheetContent>
    </Sheet>
  );
}
