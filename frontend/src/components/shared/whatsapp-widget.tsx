"use client";

import { useState } from "react";
import { MessageCircle, X, ArrowUpRight } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const WHATSAPP_NUMBER = "447496617074";
const WHATSAPP_DISPLAY = "+44 7496 617074";
const DEFAULT_MESSAGE = "Hello Letty Beauty, I would like assistance with...";

export function WhatsAppWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Hide inside admin dashboards
  if (pathname?.startsWith("/admin")) {
    return null;
  }

  const encodedMessage = encodeURIComponent(DEFAULT_MESSAGE);
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`;

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end print:hidden">
      {/* Luxury Concierge Card Popup */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.95 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="mb-3 w-80 sm:w-88 border border-line bg-ivory p-5 shadow-2xl backdrop-blur-md text-ink"
          >
            {/* Header */}
            <div className="flex items-start justify-between border-b border-line pb-3">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-luxe text-stone">
                  Client Concierge
                </p>
                <h3 className="font-serif text-lg font-medium text-ink">
                  Chat with LETTY
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Close concierge"
                className="p-1 text-stone transition-colors hover:text-ink"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Content preview */}
            <div className="my-4 space-y-2.5">
              <div className="rounded border border-line/60 bg-[#F4EFEA] p-3 text-xs leading-relaxed text-stone">
                <div className="mb-1 flex items-center gap-1.5 font-medium text-ink">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                  </span>
                  <span className="text-[11px] uppercase tracking-wider">Advisory Desk Online</span>
                </div>
                Welcome to LETTY. How may our client specialists assist your styling, fragrance, or order inquiry today?
              </div>
              <p className="text-[11px] text-stone">
                Direct WhatsApp line:{" "}
                <span className="font-mono text-ink">{WHATSAPP_DISPLAY}</span>
              </p>
            </div>

            {/* Action CTA */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-11 w-full items-center justify-center gap-2 bg-ink text-xs font-medium uppercase tracking-luxe text-ivory transition-transform duration-200 hover:bg-ink/90 active:scale-[0.99]"
            >
              <span>Open WhatsApp</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Trigger Pill / Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Open Letty WhatsApp Concierge"
        className={cn(
          "group relative flex items-center gap-2.5 border border-line bg-ivory/95 px-4 py-2.5 shadow-lg backdrop-blur-sm transition-all duration-300 hover:border-ink hover:bg-ivory hover:shadow-xl active:scale-95",
          isOpen && "border-ink bg-ivory",
        )}
      >
        {/* Pulse indicator */}
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </span>

        {/* Text */}
        <span className="font-serif text-xs uppercase tracking-luxe text-ink group-hover:text-stone transition-colors">
          Concierge
        </span>

        {/* WhatsApp Glyph */}
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4 fill-ink transition-transform duration-200 group-hover:scale-110"
          aria-hidden="true"
        >
          <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm.01 1.67c2.2 0 4.26.86 5.82 2.41a8.18 8.18 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.44 0-2.85-.38-4.09-1.1l-.29-.17-3.04.8 1.04-2.96-.19-.3A8.17 8.17 0 0 1 3.8 11.91c0-4.54 3.7-8.24 8.25-8.24zm4.52 11.64c-.25-.12-1.47-.72-1.7-.81-.23-.08-.39-.12-.56.12-.17.25-.64.81-.79.97-.14.17-.29.19-.54.07-.25-.12-1.05-.39-2-1.23-.74-.66-1.24-1.47-1.39-1.72-.14-.25-.02-.38.11-.5.11-.11.25-.29.37-.43.12-.14.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.35-.77-1.85-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.23.25-.87.85-.87 2.08 0 1.23.89 2.42 1.02 2.59.12.17 1.76 2.69 4.26 3.77.6.26 1.06.41 1.43.53.6.19 1.15.16 1.58.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.06-.11-.22-.17-.47-.29z" />
        </svg>
      </button>
    </div>
  );
}
