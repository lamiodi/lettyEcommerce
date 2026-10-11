"use client";

import { useEffect, useId, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, X } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useHydrated } from "@/hooks/use-hydrated";
import { useScrollLock } from "@/hooks/use-scroll-lock";
import {
  COUNTRY_POPUP_DISMISSED_EVENT,
  COUNTRY_POPUP_DISMISSED_KEY,
} from "@/components/home/country-welcome-modal";

export const EARN_POINTS_SEEN_KEY = "letty-earn-points-seen-session";
export const EARN_POINTS_CLOSED_EVENT = "letty:earn-points-closed";

const EASE_LUXE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/** Loyalty teaser popup, shown first in the homepage popup chain (before the
 *  10% offer capture): a two-panel card — "A little more for those who choose
 *  to belong." with a Discover button into the VIP Sanctuary. All motion is
 *  transform/opacity only and reduced-motion aware so it stays smooth on
 *  mobile. */
export function EarnPointsPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const hydrated = useHydrated();
  useScrollLock(isOpen);
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const headingId = useId();

  useEffect(() => {
    if (!hydrated) return;

    let seen = false;
    let countryHandled = true;
    try {
      seen = sessionStorage.getItem(EARN_POINTS_SEEN_KEY) === "1";
      countryHandled = sessionStorage.getItem(COUNTRY_POPUP_DISMISSED_KEY) === "1";
    } catch {
      /* ignore */
    }
    if (seen) return;

    let openTimer: ReturnType<typeof setTimeout> | undefined;
    const open = () => {
      setIsOpen(true);
    };

    if (countryHandled) {
      // Country modal won't appear this session — show on a short timer.
      openTimer = setTimeout(open, 6000);
      return () => clearTimeout(openTimer);
    }

    // Otherwise wait for the country modal to be confirmed/dismissed.
    const onCountryHandled = () => {
      openTimer = setTimeout(open, 1500);
    };
    window.addEventListener(COUNTRY_POPUP_DISMISSED_EVENT, onCountryHandled, { once: true });
    return () => {
      window.removeEventListener(COUNTRY_POPUP_DISMISSED_EVENT, onCountryHandled);
      clearTimeout(openTimer);
    };
  }, [hydrated]);

  const close = () => {
    try {
      sessionStorage.setItem(EARN_POINTS_SEEN_KEY, "1");
    } catch {
      /* storage unavailable */
    }
    window.dispatchEvent(new Event(EARN_POINTS_CLOSED_EVENT));
    setIsOpen(false);
  };

  const discover = () => {
    close();
    router.push("/vip");
  };

  // Staggered content reveal. The exit state embeds its own transition so
  // closing is never delayed by the entrance stagger.
  const rise = (delay: number) => ({
    initial: { opacity: 0, y: reduceMotion ? 0 : 12 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, transition: { duration: 0.18 } },
    transition: { delay, duration: reduceMotion ? 0.2 : 0.45, ease: EASE_LUXE },
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={headingId}
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overscroll-contain p-4 sm:p-6"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.28 } }}
            transition={{ duration: 0.35 }}
            onClick={close}
            className="fixed inset-0 bg-ink/60 md:backdrop-blur-sm"
          />

          <button
            type="button"
            onClick={close}
            aria-label="Close Inner Circle popup"
            className="fixed right-3 top-3 z-20 cursor-pointer p-2.5 text-ivory/70 transition-colors hover:text-ivory"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Modal card — message panel + campaign photo */}
          <motion.div
            initial={{ opacity: 0, y: reduceMotion ? 0 : 26, scale: reduceMotion ? 1 : 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{
              opacity: 0,
              y: reduceMotion ? 0 : 10,
              scale: reduceMotion ? 1 : 0.98,
              transition: { duration: 0.28, ease: EASE_LUXE },
            }}
            transition={{ duration: 0.5, ease: EASE_LUXE }}
            className="my-auto flex w-full max-w-2xl flex-col sm:flex-row"
          >
            <div className="flex-1 bg-ivory px-7 py-9 shadow-2xl sm:px-11 sm:py-14">
              <motion.p
                {...rise(0.18)}
                className="text-[10px] font-semibold uppercase tracking-[0.3em] text-gold sm:text-[11px]"
              >
                The Inner Circle
              </motion.p>
              <motion.span
                {...rise(0.18)}
                className="mt-3 block h-px w-14 bg-gold"
              />

              <motion.h2
                id={headingId}
                {...rise(0.26)}
                className="mt-5 font-forum text-[24px] uppercase leading-[1.18] tracking-[0.01em] text-ink sm:text-[30px] sm:leading-[1.16]"
              >
                A Little More
                <span className="block">For Those Who</span>
                <span className="block">Choose to Belong.</span>
              </motion.h2>

              <motion.p
                {...rise(0.34)}
                className="mt-5 max-w-[34ch] text-[13px] leading-relaxed text-stone sm:text-sm"
              >
                <span className="font-semibold text-ink">Earn points</span> as you
                shop, discover exclusive rewards, and enjoy privileges created
                especially for the House of Letty community.
              </motion.p>

              <motion.button
                {...rise(0.42)}
                type="button"
                onClick={discover}
                whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                className="mt-8 inline-flex h-12 cursor-pointer items-center gap-2.5 bg-ink px-8 text-[10px] font-medium uppercase tracking-[0.22em] text-ivory transition-colors duration-200 hover:bg-stone sm:mt-10 sm:text-[11px]"
              >
                Discover the Inner Circle
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </motion.button>
            </div>

            {/* Campaign photo with brand lockup — below the message on mobile,
                beside it on larger screens */}
            <div className="relative h-44 w-full shrink-0 overflow-hidden sm:h-auto sm:w-[38%]">
              <motion.div
                initial={{ scale: reduceMotion ? 1 : 1.08 }}
                animate={{ scale: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.18 } }}
                transition={{ duration: 0.9, ease: EASE_LUXE }}
                className="absolute inset-0"
              >
                <Image
                  src="/ima/IMG_7187.JPG.jpeg"
                  alt="LETTY beauty editorial — model wearing gold jewellery in warm light"
                  fill
                  sizes="(min-width: 640px) 256px, 100vw"
                  className="object-cover"
                />
              </motion.div>
              <div className="absolute inset-0 bg-gradient-to-t from-ink/55 to-transparent" />
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.18 } }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="absolute inset-x-0 bottom-4 flex flex-col items-center gap-1.5 sm:bottom-6"
              >
                <span className="pl-[0.35em] font-serif text-base tracking-[0.35em] text-ivory sm:text-xl">
                  LETTY
                </span>
                <span className="h-px w-8 bg-ivory/70" />
                <span className="pl-[0.3em] text-[8px] font-medium uppercase tracking-[0.3em] text-ivory/90 sm:text-[9px]">
                  House of Letty
                </span>
              </motion.div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
