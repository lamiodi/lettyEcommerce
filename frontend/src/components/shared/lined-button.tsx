"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { EASE_OUT } from "@/lib/motion";

interface LinedButtonProps {
  href?: string;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  className?: string;
  children: React.ReactNode;
  tone?: "ink" | "ivory";
  width?: string;
  disabled?: boolean;
}

/**
 * Template-matching "lined" button — horizontal rules above and below the
 * label, centered, with a constrained max-width. Used site-wide to keep the
 * luxury template's quiet, editorial button treatment consistent.
 *
 * Motion: smooth hover transition on text color + active press scale.
 * The horizontal rules subtly darken on hover, reinforcing interactivity.
 */
export function LinedButton({
  href,
  onClick,
  type = "button",
  className = "",
  children,
  tone = "ink",
  width = "max-w-[200px]",
  disabled = false,
}: LinedButtonProps) {
  const hrClass = tone === "ivory" ? "border-ivory/30" : "border-ink/30";
  const hrHoverClass = tone === "ivory" ? "group-hover/lined:border-ivory/50" : "group-hover/lined:border-ink/50";
  const textClass = tone === "ivory" ? "text-ivory hover:text-white" : "text-ink hover:text-stone";

  const inner = (
    <div className={`group/lined w-full flex flex-col items-center ${width} ${className} ${disabled ? "opacity-50 pointer-events-none" : ""}`}>
      <hr className={`w-full transition-colors duration-300 ${hrClass} ${hrHoverClass}`} />
      <span
        className={`w-full py-2.5 text-[11px] font-medium text-center tracking-widest uppercase transition-colors duration-300 ${textClass}`}
      >
        {children}
      </span>
      <hr className={`w-full transition-colors duration-300 ${hrClass} ${hrHoverClass}`} />
    </div>
  );

  if (href && !disabled) {
    return (
      <motion.div
        whileTap={{ scale: 0.97 }}
        transition={{ duration: 0.15, ease: EASE_OUT }}
        className="inline-block"
      >
        <Link href={href} className="inline-block">
          {inner}
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      transition={{ duration: 0.15, ease: EASE_OUT }}
      className="inline-block"
    >
      {inner}
    </motion.button>
  );
}
