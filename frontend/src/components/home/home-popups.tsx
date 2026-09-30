"use client";

import dynamic from "next/dynamic";
import { createPortal } from "react-dom";
import { useHydrated } from "@/hooks/use-hydrated";

/**
 * Homepage popup chain, loaded off the critical path. None of these render
 * anything before hydration (they are sessionStorage-gated), so deferring
 * their chunks trims first-load JS without changing what the shopper sees.
 * EntranceReveal is deliberately NOT here — its curtain must paint in the
 * server HTML before any JavaScript runs.
 */
const CountryWelcomeModal = dynamic(
  () => import("./country-welcome-modal").then((m) => m.CountryWelcomeModal),
  { ssr: false },
);
const EarnPointsPopup = dynamic(
  () => import("./earn-points-popup").then((m) => m.EarnPointsPopup),
  { ssr: false },
);
const OfferPopup = dynamic(
  () => import("./offer-popup").then((m) => m.OfferPopup),
  { ssr: false },
);
const OfferFlyout = dynamic(
  () => import("./offer-flyout").then((m) => m.OfferFlyout),
  { ssr: false },
);

export function HomePopups() {
  const hydrated = useHydrated();
  if (!hydrated) return null;

  // Keep fixed overlays outside the animated page and its stacking context.
  return createPortal(
    <>
      <CountryWelcomeModal />
      <EarnPointsPopup />
      <OfferPopup />
      <OfferFlyout />
    </>,
    document.body,
  );
}
