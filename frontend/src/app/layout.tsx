import type { Metadata, Viewport } from "next";
import { Aboreto, Forum, Tenor_Sans } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { Chrome } from "@/components/layout/chrome";
import { SmoothScroll } from "@/components/shared/smooth-scroll";
import "./globals.css";

import { ClientOverlays } from "@/components/layout/client-overlays";

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
  // Decorative face — don't compete with the LCP image for early bandwidth.
  preload: false,
});

const forum = Forum({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-forum",
  display: "swap",
  // Decorative face — don't compete with the LCP image for early bandwidth.
  preload: false,
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ede5da",
};

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.houseofletty.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "LETTY — Luxury Beauty, Fragrance, Fashion & Eyewear",
    template: "%s | LETTY",
  },
  description:
    "LETTY is a luxury destination for makeup, beauty rituals, bespoke fragrance, fashion and sculpted eyewear. Editorial curation, timeless formulations and modern elegance.",
  keywords: [
    "luxury beauty",
    "couture makeup",
    "luxury fragrance",
    "designer fashion",
    "luxury eyewear",
    "premium cosmetics",
    "LETTY",
  ],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "LETTY",
    title: "LETTY — Luxury Beauty, Fragrance, Fashion & Eyewear",
    description:
      "A luxury destination for makeup, beauty, fragrance, fashion and eyewear.",
  },
  twitter: {
    card: "summary_large_image",
    title: "LETTY — Luxury Beauty, Fragrance, Fashion & Eyewear",
    description:
      "A luxury destination for makeup, beauty, fragrance, fashion and eyewear.",
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
          <ClientOverlays />
          <Toaster position="top-center" />
        </TooltipProvider>
      </body>
    </html>
  );
}
