import type { Metadata, Viewport } from "next";
import { Aboreto, Alex_Brush, Forum, Tenor_Sans } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { Chrome } from "@/components/layout/chrome";
import { SessionSync } from "@/components/layout/session-sync";
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

const alexBrush = Alex_Brush({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-alex-brush",
  display: "swap",
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
    default: "LETTY, Lip Care, Makeup & Beauty",
    template: "%s | LETTY",
  },
  description:
    "Discover LETTY lip liners, lip gloss, the Lash Book Kit and mwah Lip Balm. Makeup and everyday lip care with the signature LETTY touch.",
  keywords: [
    "luxury beauty",
    "lip liner",
    "lip gloss",
    "lip balm",
    "lash kit",
    "premium cosmetics",
    "LETTY",
  ],
  openGraph: {
    type: "website",
    locale: "en_GB",
    url: siteUrl,
    siteName: "LETTY",
    title: "LETTY, Lip Care, Makeup & Beauty",
    description:
      "Discover LETTY lip liners, lip gloss, lashes and everyday lip care.",
    images: [
      {
        url: "/og/letty-og.jpg",
        width: 1200,
        height: 630,
        alt: "House of LETTY, Makeup and Lip Care",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "LETTY | Lip Care, Makeup & Beauty",
    description:
      "Discover LETTY lip liners, lip gloss, lashes and everyday lip care.",
    images: ["/og/letty-og.jpg"],
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
      suppressHydrationWarning
      className={`${tenorSans.variable} ${aboreto.variable} ${forum.variable} ${alexBrush.variable}`}
    >
      <body className="min-h-screen bg-background text-foreground font-sans antialiased">
        {/* Stamps repeat-visit state before first paint so the entrance
            curtain (gated on sessionStorage in EntranceReveal) never flashes
            black while the JS bundle hydrates. Keep the key in sync with
            ENTRANCE_STORAGE_KEY in entrance-reveal.tsx. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              'try{if(sessionStorage.getItem("letty-entrance-seen")==="1"){var s=document.createElement("style");s.textContent=".entrance-curtain{display:none!important;}";document.head.appendChild(s);}}catch(e){}',
          }}
        />
        <TooltipProvider>
          <SessionSync />
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
