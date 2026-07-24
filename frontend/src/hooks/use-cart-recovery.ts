"use client";

/**
 * useCartRecovery — when the user lands on /cart?ref=TOKEN, fetch the
 * abandoned cart contents and merge them into the local store. Strip
 * the ?ref= param from the URL once recovered so a refresh doesn't
 * re-apply.
 *
 * Called from CartPageContent; one-time effect on mount.
 */
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useCartStore } from "@/lib/store/cart";

/**
 * Extra display data stashed in localStorage on recovery. The Zustand
 * `CartLine` only holds the {productSlug, variantId, quantity} triple;
 * anything else (name, price, image, options) lives here, keyed by
 * variantId. The cart UI's existing `detailCartLines` pipeline can pick
 * it up via a small bridge, but for v1 it falls back to slug-based
 * lookups in the mock catalog.
 */
const DISPLAY_KEY = "letty-cart-display";

interface DisplayData {
  name?: string;
  unitPrice?: number;
  primaryImage?: string | null;
  options?: Array<{ name: string; value: string }>;
  productId?: string;
}

function readDisplay(): Record<string, DisplayData> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(DISPLAY_KEY);
    return raw ? (JSON.parse(raw) as Record<string, DisplayData>) : {};
  } catch {
    return {};
  }
}

function writeDisplay(map: Record<string, DisplayData>) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(DISPLAY_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

interface RecoveredCart {
  cart: Array<{
    productId?: string;
    productSlug: string;
    variantId?: string;
    options?: Array<{ name: string; value: string }>;
    quantity: number;
    unitPrice: number;
    primaryImage?: string | null;
    name?: string;
  }> | null;
  currency?: string;
  customer_email?: string;
}

export function useCartRecovery() {
  const hydrated = useRef(false);
  const addLine = useCartStore((s) => s.addLine);
  const clear = useCartStore((s) => s.clear);
  const lines = useCartStore((s) => s.lines);

  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;

    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    const ref = url.searchParams.get("ref");
    if (!ref) return;

    // Don't disturb an already-non-empty cart.
    if (lines.length > 0) {
      url.searchParams.delete("ref");
      window.history.replaceState({}, "", url.pathname + (url.searchParams.toString() ? `?${url.searchParams}` : ""));
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/cart/recover?token=${encodeURIComponent(ref)}`, {
          credentials: "include",
        });
        if (!res.ok) {
          url.searchParams.delete("ref");
          window.history.replaceState({}, "", url.pathname);
          if (!cancelled) toast.error("We couldn't restore your bag. Please try again.");
          return;
        }
        const json = (await res.json()) as { data: RecoveredCart };
        if (cancelled) return;
        if (!json.data?.cart || json.data.cart.length === 0) {
          url.searchParams.delete("ref");
          window.history.replaceState({}, "", url.pathname);
          toast.message("Your bag is empty.");
          return;
        }

        clear();
        const display = readDisplay();
        for (const item of json.data.cart) {
          if (!item.variantId) continue; // Need a stable variantId
          addLine({
            productSlug: item.productSlug,
            variantId: item.variantId,
            quantity: Math.max(1, item.quantity),
          });
          display[item.variantId] = {
            name: item.name,
            unitPrice: item.unitPrice,
            primaryImage: item.primaryImage ?? null,
            options: item.options,
            productId: item.productId,
          };
        }
        writeDisplay(display);
        url.searchParams.delete("ref");
        window.history.replaceState({}, "", url.pathname);
        toast.success("Your bag has been restored.");
      } catch {
        url.searchParams.delete("ref");
        window.history.replaceState({}, "", url.pathname);
        if (!cancelled) toast.error("We couldn't restore your bag.");
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
