"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartLine } from "@/types";

import { products } from "@/lib/mock/products";

interface CartState {
  lines: CartLine[];
  isDrawerOpen: boolean;
  addLine: (line: CartLine) => void;
  removeLine: (variantId: string) => void;
  setQuantity: (variantId: string, quantity: number) => void;
  clear: () => void;
  openDrawer: () => void;
  closeDrawer: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      isDrawerOpen: false,
      addLine: (line) =>
        set((state) => {
          const existing = state.lines.find((l) => l.variantId === line.variantId);
          if (existing) {
            return {
              lines: state.lines.map((l) =>
                l.variantId === line.variantId
                  ? { ...l, quantity: l.quantity + line.quantity }
                  : l,
              ),
              isDrawerOpen: true,
            };
          }
          return { lines: [...state.lines, line], isDrawerOpen: true };
        }),
      removeLine: (variantId) =>
        set((state) => ({ lines: state.lines.filter((l) => l.variantId !== variantId) })),
      setQuantity: (variantId, quantity) =>
        set((state) => ({
          lines:
            quantity <= 0
              ? state.lines.filter((l) => l.variantId !== variantId)
              : state.lines.map((l) => (l.variantId === variantId ? { ...l, quantity } : l)),
        })),
      clear: () => set({ lines: [] }),
      openDrawer: () => set({ isDrawerOpen: true }),
      closeDrawer: () => set({ isDrawerOpen: false }),
    }),
    {
      name: "letty-cart",
      partialize: (state) => ({ lines: state.lines }),
      onRehydrateStorage: () => (state) => {
        if (state && Array.isArray(state.lines)) {
          const validSlugs = new Set(products.map((p) => p.slug));
          state.lines = state.lines.filter(
            (l) => l && validSlugs.has(l.productSlug) && l.quantity > 0,
          );
        }
      },
    },
  ),
);

export function useCartCount(): number {
  return useCartStore((state) => {
    const validSlugs = new Set(products.map((p) => p.slug));
    return state.lines
      .filter((l) => validSlugs.has(l.productSlug))
      .reduce((sum, l) => sum + l.quantity, 0);
  });
}
