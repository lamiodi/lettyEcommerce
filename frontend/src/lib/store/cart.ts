"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartLine } from "@/types";

import { normalizeCartLines } from "@/lib/cart-lines";

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
      addLine: (line) => {
        try {
          if (typeof window !== "undefined") {
            sessionStorage.removeItem("letty_confirmed_order");
            sessionStorage.removeItem("letty_last_order");
          }
        } catch {}
        return set((state) => ({ lines: normalizeCartLines([...state.lines, line]), isDrawerOpen: true }));
      },
      removeLine: (variantId) =>
        set((state) => ({ lines: state.lines.filter((l) => l.variantId !== variantId) })),
      setQuantity: (variantId, quantity) =>
        set((state) => ({
          lines:
            quantity <= 0
              ? state.lines.filter((l) => l.variantId !== variantId)
              : normalizeCartLines(state.lines.map((l) => (l.variantId === variantId ? { ...l, quantity } : l))),
        })),
      clear: () => set({ lines: [] }),
      openDrawer: () => set({ isDrawerOpen: true }),
      closeDrawer: () => set({ isDrawerOpen: false }),
    }),
    {
      name: "letty-cart",
      partialize: (state) => ({ lines: state.lines }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.lines = normalizeCartLines(state.lines);
        }
      },
    },
  ),
);

export function useCartCount(): number {
  return useCartStore((state) => {
    return normalizeCartLines(state.lines).reduce((sum, line) => sum + line.quantity, 0);
  });
}
