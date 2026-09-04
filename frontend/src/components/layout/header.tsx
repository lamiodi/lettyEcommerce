"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Heart, Search, ShoppingBag, User } from "lucide-react";
import { motion } from "framer-motion";
import { useCustomerAuthStore } from "@/lib/store/customer-auth";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/shared/logo";
import { MegaMenuPanel } from "@/components/layout/mega-menu-panel";
import { MobileNav } from "@/components/layout/mobile-nav";
import { ScrollProgress } from "@/components/layout/scroll-progress";
import { SearchOverlay } from "@/components/layout/search-overlay";
import { CurrencySwitcher } from "@/components/shared/currency-switcher";
import { NAV_LINKS } from "@/lib/constants";
import { useCartStore } from "@/lib/store/cart";
import { useWishlistStore } from "@/lib/store/wishlist";
import { useHydrated } from "@/hooks/use-hydrated";
import { cn, pluralize } from "@/lib/utils";

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const openDrawer = useCartStore((s) => s.openDrawer);
  const lines = useCartStore((s) => s.lines);
  const wishlistSlugs = useWishlistStore((s) => s.slugs);
  const customer = useCustomerAuthStore((s) => s.customer);
  const hydrated = useHydrated();
  const pathname = usePathname();

  const bagCount = lines.reduce((acc, l) => acc + l.quantity, 0);
  const wishlistCount = wishlistSlugs.length;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <ScrollProgress />
      <motion.header
        initial={{ y: -4, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className={cn(
          "sticky top-0 z-50 border-b bg-ivory/95 backdrop-blur",
          "transition-[border-color,box-shadow] duration-500 ease-out",
          scrolled ? "border-line shadow-[0_1px_24px_rgba(17,17,17,0.06)]" : "border-transparent",
        )}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 md:h-[4.5rem] md:px-8">
          <div className="flex items-center gap-2">
            <Logo />
          </div>

          <nav aria-label="Primary" className="hidden lg:flex">
            <ul className="flex items-center gap-1">
              {NAV_LINKS.map((link) =>
                link.label === "Collections" ? (
                  <li key={link.label}>
                    <NavigationMenu className="static">
                      <NavigationMenuList>
                        <NavigationMenuItem>
                          <NavigationMenuTrigger className="bg-transparent px-3 py-2 text-sm font-medium capitalize text-ink hover:bg-transparent hover:text-gold data-[state=open]:bg-transparent data-[state=open]:text-gold">
                            Collections
                          </NavigationMenuTrigger>
                          <NavigationMenuContent>
                            <MegaMenuPanel />
                          </NavigationMenuContent>
                        </NavigationMenuItem>
                      </NavigationMenuList>
                    </NavigationMenu>
                  </li>
                ) : (
                  <li key={link.label} className="relative">
                    <Link
                      href={link.href}
                      className={cn(
                        "group relative block bg-transparent px-3 py-2 text-sm font-medium capitalize transition-colors duration-300",
                        pathname === link.href ? "text-gold" : "text-ink hover:text-gold",
                      )}
                    >
                      {link.label}
                      {/* Animated underline — grows from center on hover/active */}
                      <span
                        className={cn(
                          "absolute bottom-0.5 left-1/2 h-px -translate-x-1/2 bg-gold",
                          "transition-[width] duration-300 ease-out",
                          pathname === link.href ? "w-4/5" : "w-0 group-hover:w-4/5",
                        )}
                        aria-hidden
                      />
                    </Link>
                  </li>
                ),
              )}
            </ul>
          </nav>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="hidden md:block mr-1">
              <CurrencySwitcher variant="header" />
            </div>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Search the Boutique (Ctrl+K)"
              className="transition-transform duration-200 active:scale-90"
              onClick={() => setSearchOpen(true)}
            >
              <Search className="h-[22px] w-[22px]" strokeWidth={1.25} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="relative hidden sm:inline-flex transition-transform duration-200 active:scale-90"
              render={
                <Link
                  href="/login"
                  aria-label={
                    hydrated && customer
                      ? `Account (${customer.firstName || customer.email})`
                      : "Sign in to account"
                  }
                />
              }
              nativeButton={false}
            >
              <User className="h-[22px] w-[22px]" strokeWidth={1.25} />
              {hydrated && customer && (
                <span className="absolute top-1.5 right-1.5 flex h-2 w-2 rounded-full bg-gold ring-2 ring-ivory" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="relative hidden sm:inline-flex transition-transform duration-200 active:scale-90"
              render={
                <Link
                  href="/wishlist"
                  aria-label={`Wishlist${hydrated && wishlistCount > 0 ? `, ${wishlistCount} ${pluralize(wishlistCount, "item")}` : ""}`}
                />
              }
              nativeButton={false}
            >
              <Heart className="h-[22px] w-[22px]" strokeWidth={1.25} />
              {hydrated && wishlistCount > 0 && (
                <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-ink px-1 text-[10px] font-medium text-ivory">
                  {wishlistCount}
                </span>
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Shopping bag${hydrated && bagCount > 0 ? `, ${bagCount} ${pluralize(bagCount, "item")}` : ""}`}
              onClick={openDrawer}
              className="relative transition-transform duration-200 active:scale-90"
            >
              <ShoppingBag className="h-[22px] w-[22px]" strokeWidth={1.25} />
              {hydrated && bagCount > 0 && (
                <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-ink px-1 text-[10px] font-medium text-ivory">
                  {bagCount}
                </span>
              )}
            </Button>
            <MobileNav onOpenSearch={() => setSearchOpen(true)} />
          </div>
        </div>
      </motion.header>

      <SearchOverlay open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
