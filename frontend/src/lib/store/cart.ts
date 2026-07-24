"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartLine } from "@/types";

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
    },
  ),
);

export function useCartCount(): number {
  return useCartStore((state) => state.lines.reduce((sum, l) => sum + l.quantity, 0));
}
