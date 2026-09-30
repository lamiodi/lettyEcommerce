"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { LogoImage } from "@/components/shared/logo";
import { EASE_LUXURY } from "@/lib/motion";

/** Shown once per session — afterwards the landing page renders directly. */
export const ENTRANCE_STORAGE_KEY = "letty-entrance-seen";
/** Fired once the entrance curtain has fully lifted (or was skipped), so
 *  chained overlays (country welcome modal) take the stage with their
 *  animations visible instead of playing unseen behind the curtain. */
export const ENTRANCE_DONE_EVENT = "letty:entrance-done";

let entranceDone = false;

/** Whether the curtain already finished this page load. Lets lazily-loaded
 *  overlays that mount after the event still open immediately. */
export function isEntranceDone(): boolean {
  return entranceDone;
}

/** Whether the curtain will play for this visitor on this page load. */
export function willEntranceRevealPlay(): boolean {
  if (typeof window === "undefined") return false;
  if (
    window.matchMedia("(max-width: 768px)").matches ||
    window.matchMedia("(pointer: coarse)").matches
  ) {
    return false;
  }
  try {
    return sessionStorage.getItem(ENTRANCE_STORAGE_KEY) !== "1";
  } catch {
    /* storage unavailable — play the reveal */
    return true;
  }
}

type Stage = "cover" | "playing" | "exiting" | "done";

/** Hold time (ms) with the emblem fully settled before the curtain lifts. */
const HOLD_DURATION = 2000;

/**
 * Entrance reveal — a full-screen ink curtain bearing the LETTY emblem.
 * The emblem fades/blurs in, a gold hairline expands, the wordmark rises,
 * then the whole curtain lifts to reveal the landing page beneath.
 */
export function EntranceReveal() {
  const [stage, setStage] = useState<Stage>("cover");
  const reduce = useReducedMotion() ?? false;
  const shouldPlayRef = useRef<boolean | null>(null);

  // First paint is the opaque curtain (SSR-safe); start only if unseen on desktop.
  useEffect(() => {
    // Keep the same decision when Strict Mode replays this effect.
    shouldPlayRef.current ??= willEntranceRevealPlay();
    if (!shouldPlayRef.current) {
      setStage("done");
      return;
    }
    try {
      sessionStorage.setItem(ENTRANCE_STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
    const start = requestAnimationFrame(() => setStage("playing"));
    return () => cancelAnimationFrame(start);
  }, []);

  // Hold the emblem on screen, then lift the curtain.
  useEffect(() => {
    if (stage !== "playing") return;
    const hold = setTimeout(
      () => setStage("exiting"),
      reduce ? 600 : HOLD_DURATION,
    );
    return () => clearTimeout(hold);
  }, [stage, reduce]);

  // Lock scroll while the curtain covers the page.
  useEffect(() => {
    if (stage === "done") return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [stage]);

  // Announce completion to chained overlays exactly once.
  useEffect(() => {
    if (stage !== "done" || entranceDone) return;
    entranceDone = true;
    window.dispatchEvent(new Event(ENTRANCE_DONE_EVENT));
  }, [stage]);

  const curtain: Variants = {
    cover: { y: 0, opacity: 1 },
    playing: { y: 0, opacity: 1 },
    exiting: reduce
      ? { opacity: 0, transition: { duration: 0.4, ease: EASE_LUXURY } }
      : { y: "-100%", transition: { duration: 0.9, ease: EASE_LUXURY } },
  };

  const emblem: Variants = {
    cover: reduce
      ? { opacity: 0 }
      : { opacity: 0, scale: 0.92, filter: "blur(6px)" },
    playing: reduce
      ? { opacity: 1, transition: { duration: 0.4, ease: EASE_LUXURY } }
      : {
          opacity: 1,
          scale: 1,
          filter: "blur(0px)",
          transition: { duration: 1, ease: EASE_LUXURY, delay: 0.15 },
        },
    exiting: {
      opacity: 0,
      y: reduce ? 0 : -32,
      transition: { duration: 0.45, ease: EASE_LUXURY },
    },
  };

  const hairline: Variants = {
    cover: { scaleX: 0 },
    playing: {
      scaleX: 1,
      transition: { duration: 0.9, ease: EASE_LUXURY, delay: reduce ? 0 : 0.55 },
    },
    exiting: { opacity: 0, transition: { duration: 0.3 } },
  };

  if (stage === "done") return null;

  return (
    <motion.div
      aria-hidden
      className="entrance-curtain fixed inset-0 z-[100] hidden md:flex flex-col items-center justify-center bg-ink"
      variants={curtain}
      initial="cover"
      animate={stage}
      onAnimationComplete={(definition) => {
        if (definition === "exiting") setStage("done");
      }}
    >
      {/* Blur/scale live on the wrapper so the artwork stays crisp. */}
      <motion.div variants={emblem}>
        <LogoImage
          variant="dark"
          priority
          className="h-44 w-auto md:h-60"
        />
      </motion.div>

      <motion.hr
        variants={hairline}
        className="mt-10 h-px w-44 border-0 bg-gold/60"
      />
    </motion.div>
  );
}
