"use client";

import dynamic from "next/dynamic";
import { createPortal } from "react-dom";
import { useHydrated } from "@/hooks/use-hydrated";

/** Welcome offer popup for department pages (Makeup & Beauty, Fragrance,
 *  Fashion, Eyewear). Opens on a timer independent of the homepage
 *  earn-points chain, once per session. Loaded off the critical path and
 *  portaled to document.body, mirroring the HomePopups pattern. */
const OfferPopup = dynamic(
  () => import("@/components/home/offer-popup").then((m) => m.OfferPopup),
  { ssr: false },
);

export function DepartmentOfferPopup() {
  const hydrated = useHydrated();
  if (!hydrated) return null;

  return createPortal(<OfferPopup waitForEarnPoints={false} />, document.body);
}
