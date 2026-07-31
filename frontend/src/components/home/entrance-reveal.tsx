"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { EASE_LUXURY } from "@/lib/motion";

/** Shown once per session — afterwards the landing page renders directly. */
export const ENTRANCE_STORAGE_KEY = "letty-entrance-seen";
/** Seconds the hero waits so its entrance plays as the curtain lifts. */
export const ENTRANCE_REVEAL_OFFSET = 1.9;

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

  // First paint is the opaque curtain (SSR-safe); start only if unseen.
  useEffect(() => {
    let seen = false;
    try {
      seen = sessionStorage.getItem(ENTRANCE_STORAGE_KEY) === "1";
    } catch {
      /* storage unavailable — play the reveal */
    }
    if (seen) {
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

  const wordmark: Variants = {
    cover: { opacity: 0, y: reduce ? 0 : 14 },
    playing: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: EASE_LUXURY, delay: reduce ? 0 : 0.7 },
    },
    exiting: {
      opacity: 0,
      y: reduce ? 0 : -20,
      transition: { duration: 0.4, ease: EASE_LUXURY },
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
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-ink"
      variants={curtain}
      initial="cover"
      animate={stage}
      onAnimationComplete={(definition) => {
        if (definition === "exiting") setStage("done");
      }}
    >
      {/* Blur/scale live on the wrapper so the invert filter stays intact. */}
      <motion.div variants={emblem}>
        <Image
          src="/brand/letty-emblem.png"
          alt=""
          width={342}
          height={356}
          priority
          className="h-36 w-auto invert md:h-48"
        />
      </motion.div>

      <motion.p
        variants={wordmark}
        className="mt-8 font-serif text-base uppercase tracking-luxe text-ivory md:text-lg"
      >
        Letty Beauty
      </motion.p>

      <motion.hr
        variants={hairline}
        className="mt-6 h-px w-44 border-0 bg-gold/60"
      />
    </motion.div>
  );
}
