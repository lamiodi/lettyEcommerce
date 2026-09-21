"use client";

import { useEffect, useRef } from "react";
import { useCartStore } from "@/lib/store/cart";
import { useCustomerAuthStore } from "@/lib/store/customer-auth";

const TOKEN_KEY = "letty_cart_token";
const DEBOUNCE_MS = 5000;

function getOrCreateToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const existing = window.localStorage.getItem(TOKEN_KEY);
    if (existing && /^[a-zA-Z0-9_-]{16,128}$/.test(existing)) return existing;
    const token =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID().replace(/-/g, "")
        : Math.random().toString(36).slice(2) + Date.now().toString(36);
    window.localStorage.setItem(TOKEN_KEY, token);
    return token;
  } catch {
    return null;
  }
}

/**
 * Persist the shopper's cart to the backend (abandoned-cart pipeline).
 * Debounced and fire-and-forget — never blocks or disturbs the UI. An
 * empty cart sends a final empty payload which deletes the server-side
 * row, so completed checkouts never trigger reminder emails.
 */
export function useCartTracking(): void {
  const lines = useCartStore((s) => s.lines);
  const customer = useCustomerAuthStore((s) => s.customer);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const emailRef = useRef(customer?.email);
  emailRef.current = customer?.email;

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      const token = getOrCreateToken();
      if (!token) return;

      void fetch("/api/cart/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        keepalive: true,
        body: JSON.stringify({
          recovery_token: token,
          email: emailRef.current ?? undefined,
          cart: lines.map((l) => ({ variant_id: l.variantId, quantity: l.quantity })),
        }),
      }).catch(() => {
        // Tracking is best-effort; failures are invisible to the shopper.
      });
    }, DEBOUNCE_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [lines]);
}
