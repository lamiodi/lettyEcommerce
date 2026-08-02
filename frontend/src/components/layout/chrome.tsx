"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Lock } from "lucide-react";
import type { ReactNode } from "react";
import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { Header } from "@/components/layout/header";
import { Newsletter } from "@/components/layout/newsletter";
import { Footer } from "@/components/layout/footer";
import { Logo } from "@/components/shared/logo";
import { PageTransition } from "@/components/shared/page-transition";

/**
 * Site chrome. The checkout flow gets a distilled, distraction-free frame
 * (luxury standard); every other page gets the full chrome.
 */
export function Chrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isCheckout = pathname.startsWith("/checkout");

  if (isCheckout) {
    return (
      <div className="flex min-h-screen flex-col">
        <header className="border-b border-line bg-ivory">
          <div className="mx-auto grid h-16 max-w-6xl grid-cols-[1fr_auto_1fr] items-center px-4 md:px-8">
            <span aria-hidden />
            <Logo className="[&_img]:h-10 md:[&_img]:h-12" />
            <p className="flex items-center justify-end gap-2 text-xs uppercase tracking-luxe-sm text-stone">
              <Lock className="h-3.5 w-3.5" aria-hidden />
              Secure Checkout
            </p>
          </div>
        </header>
        <main className="flex-1">
          <PageTransition>{children}</PageTransition>
        </main>
        <footer className="border-t border-line bg-surface">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-6 text-xs text-stone md:flex-row md:px-8">
            <p>© {new Date().getFullYear()} LETTY. All rights reserved.</p>
            <p>
              Need help?{" "}
              <Link href="/contact" className="text-ink underline underline-offset-4">
                Contact the concierge
              </Link>
            </p>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <AnnouncementBar />
      <Header />
      <main className="flex-1">
        <PageTransition>{children}</PageTransition>
      </main>
      <Newsletter />
      <Footer />
    </div>
  );
}
