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

export function HomePopups() {
  const hydrated = useHydrated();
  if (!hydrated) return null;

  // Keep fixed overlays outside the animated page and its stacking context.
  // The 10% offer popup is NOT here anymore (2026-10-11, user request): it
  // shows only on the four department sections via DepartmentOfferPopup.
  return createPortal(
    <>
      <CountryWelcomeModal />
      <EarnPointsPopup />
    </>,
    document.body,
  );
}
