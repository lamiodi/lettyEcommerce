"use client";

import dynamic from "next/dynamic";
import { useCartTracking } from "@/hooks/use-cart-tracking";

const CartDrawer = dynamic(
  () => import("@/components/cart/cart-drawer").then((m) => m.CartDrawer),
  { ssr: false },
);

const Cursor = dynamic(
  () => import("@/components/shared/cursor").then((m) => m.Cursor),
  { ssr: false },
);

const WhatsAppWidget = dynamic(
  () =>
    import("@/components/shared/whatsapp-widget").then((m) => m.WhatsAppWidget),
  { ssr: false },
);

/**
 * Lazy-loaded client overlays (Cart drawer, custom pointer accents, concierge).
 * Isolated into a client component so they don't block server rendering or initial HTML.
 */
export function ClientOverlays() {
  // Debounced, fire-and-forget persistence of the shopper's cart for the
  // abandoned-cart recovery pipeline.
  useCartTracking();

  return (
    <>
      <Cursor />
      <CartDrawer />
      <WhatsAppWidget />
    </>
  );
}
