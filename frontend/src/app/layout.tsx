import type { Metadata } from "next";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { Chrome } from "@/components/layout/chrome";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { SmoothScroll } from "@/components/shared/smooth-scroll";
import { Cursor } from "@/components/shared/cursor";
import { WhatsAppWidget } from "@/components/shared/whatsapp-widget";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://letty.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "LETTY — Luxury Hair, Beauty, Fragrance & Fashion",
    template: "%s | LETTY",
  },
  description:
    "LETTY is a luxury destination for hair, fragrance, beauty, fashion and cosmetics. Editorial curation, timeless formulations and modern elegance.",
  keywords: [
    "luxury beauty",
    "luxury hair care",
    "luxury fragrance",
    "designer fashion",
    "premium cosmetics",
    "LETTY",
  ],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "LETTY",
    title: "LETTY — Luxury Hair, Beauty, Fragrance & Fashion",
    description:
      "A luxury destination for hair, fragrance, beauty, fashion and cosmetics.",
  },
  twitter: {
    card: "summary_large_image",
    title: "LETTY — Luxury Hair, Beauty, Fragrance & Fashion",
    description:
      "A luxury destination for hair, fragrance, beauty, fashion and cosmetics.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Aboreto&family=Forum&family=Tenor+Sans&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-background text-foreground">
        <TooltipProvider>
          <SmoothScroll>
            <Chrome>{children}</Chrome>
          </SmoothScroll>
          <Cursor />
          <CartDrawer />
          <WhatsAppWidget />
          <Toaster position="top-center" />
        </TooltipProvider>
      </body>
    </html>
  );
}
