"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

const MAX_RECENT = 8;

interface RecentlyViewedState {
  slugs: string[];
  push: (slug: string) => void;
}

export const useRecentlyViewedStore = create<RecentlyViewedState>()(
  persist(
    (set) => ({
      slugs: [],
      push: (slug) =>
        set((state) => ({
          slugs: [slug, ...state.slugs.filter((s) => s !== slug)].slice(0, MAX_RECENT),
        })),
    }),
    { name: "letty-recently-viewed" },
  ),
);
