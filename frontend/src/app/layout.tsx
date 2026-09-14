import type { Metadata, Viewport } from "next";
import dynamic from "next/dynamic";
import { Aboreto, Forum, Tenor_Sans } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { Chrome } from "@/components/layout/chrome";
import { SmoothScroll } from "@/components/shared/smooth-scroll";
import "./globals.css";

const CartDrawer = dynamic(
  () => import("@/components/cart/cart-drawer").then((m) => m.CartDrawer),
  { ssr: false },
);
const Cursor = dynamic(
  () => import("@/components/shared/cursor").then((m) => m.Cursor),
  { ssr: false },
);
const WhatsAppWidget = dynamic(
  () => import("@/components/shared/whatsapp-widget").then((m) => m.WhatsAppWidget),
  { ssr: false },
);

const tenorSans = Tenor_Sans({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-tenor-sans",
  display: "swap",
});

const aboreto = Aboreto({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-aboreto",
  display: "swap",
});

const forum = Forum({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-forum",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ede5da",
};

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
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${tenorSans.variable} ${aboreto.variable} ${forum.variable}`}
    >
      <body className="min-h-screen bg-background text-foreground font-sans antialiased">
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
