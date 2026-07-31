/**
 * LETTY Motion System
 * ─────────────────────────────────────────────────────────────────────
 * A centralized, reusable motion library that every animated component
 * draws from. Keeps motion language consistent site-wide: calm, elegant,
 * restrained — never flashy.
 *
 * Philosophy: GPU-friendly transforms only (opacity + translate + scale).
 * No layout-thrashing properties. Every value is intentional.
 */

import type { Variants, Transition } from "framer-motion";

/* ─── Shared Easings ──────────────────────────────────────────────── */

/** Luxury deceleration — enters crisply, decelerates gracefully. */
export const EASE_LUXURY = [0.22, 1, 0.36, 1] as const;

/** Gentle ease-out for micro-interactions (hover, press). */
export const EASE_OUT = [0.16, 1, 0.3, 1] as const;

/** Natural ease for bidirectional transitions. */
export const EASE_INOUT = [0.4, 0, 0.2, 1] as const;

/* ─── Shared Durations ────────────────────────────────────────────── */

export const DURATION = {
  /** Micro-interactions: hover states, button press. */
  micro: 0.2,
  /** Standard element transitions. */
  normal: 0.5,
  /** Scroll-reveal sections entering viewport. */
  reveal: 0.65,
  /** Hero-level cinematic entrances. */
  hero: 0.9,
  /** Slow environmental motion (background zoom). */
  ambient: 7,
  /** Page transitions. */
  page: 0.25,
} as const;

/* ─── Shared Transitions ──────────────────────────────────────────── */

export const TRANSITION = {
  reveal: {
    duration: DURATION.reveal,
    ease: EASE_LUXURY,
  } satisfies Transition,

  hero: {
    duration: DURATION.hero,
    ease: EASE_LUXURY,
  } satisfies Transition,

  micro: {
    duration: DURATION.micro,
    ease: EASE_OUT,
  } satisfies Transition,

  page: {
    duration: DURATION.page,
    ease: EASE_INOUT,
  } satisfies Transition,
} as const;

/* ─── Reusable Variants ───────────────────────────────────────────── */

/**
 * Fade-and-rise reveal. Used for scroll-triggered section entrances.
 * Supports stagger via `custom` delay value.
 */
export const revealVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: (delay: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { ...TRANSITION.reveal, delay },
  }),
};

/**
 * Hero-level entrance. Longer duration, slightly more travel distance,
 * very subtle scale to add depth.
 */
export const heroFadeUp: Variants = {
  hidden: { opacity: 0, y: 32, scale: 0.985 },
  visible: (delay: number = 0) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { ...TRANSITION.hero, delay },
  }),
};

/** Gentle fade-in without vertical movement. */
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: (delay: number = 0) => ({
    opacity: 1,
    transition: { duration: DURATION.reveal, delay, ease: EASE_LUXURY },
  }),
};

/** Stagger container — coordinates children in a parent container. */
export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.15,
    },
  },
};

/** Child variant for use inside a staggerContainer. */
export const staggerChild: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { ...TRANSITION.reveal },
  },
};

/**
 * Page transition variants — used by the PageTransition wrapper.
 * Sub-300ms to avoid any perceived navigation lag.
 */
export const pageTransition: Variants = {
  initial: { opacity: 0 },
  enter: {
    opacity: 1,
    transition: { ...TRANSITION.page },
  },
  exit: {
    opacity: 0,
    transition: { ...TRANSITION.page },
  },
};
