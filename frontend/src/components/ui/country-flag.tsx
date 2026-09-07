"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";

export interface CountryFlagProps {
  code?: string;
  name?: string;
  flagFallback?: string;
  className?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
}

const SIZE_CLASSES: Record<NonNullable<CountryFlagProps["size"]>, string> = {
  xs: "w-3.5 h-2.5 min-w-[14px]",
  sm: "w-4 h-3 min-w-[16px]",
  md: "w-5 h-3.5 min-w-[20px]",
  lg: "w-6 h-4 min-w-[24px]",
  xl: "w-8 h-5.5 min-w-[32px]",
};

/**
 * Universal Country Flag Component.
 * Solves the critical Windows OS limitation where Unicode emoji flags render as plain text letters (e.g. "GB" instead of 🇬🇧).
 * Uses high-resolution SVG flags with automatic graceful fallback to Unicode flag/code.
 */
export function CountryFlag({
  code = "GB",
  name,
  flagFallback,
  className,
  size = "md",
}: CountryFlagProps) {
  const [hasError, setHasError] = useState(false);
  const normalizedCode = (code || "").trim().toLowerCase();

  if (!normalizedCode || hasError) {
    return (
      <span
        className={cn("inline-flex items-center justify-center select-none text-sm leading-none", className)}
        aria-hidden="true"
        title={name || code}
      >
        {flagFallback || code}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-[2px] shadow-[0_0_0_1px_rgba(0,0,0,0.12)] bg-stone/10 align-middle select-none",
        SIZE_CLASSES[size],
        className,
      )}
      title={name || code}
      aria-hidden="true"
    >
      <img
        src={`https://flagcdn.com/${normalizedCode}.svg`}
        alt={name ? `${name} flag` : `${code} flag`}
        className="h-full w-full object-cover"
        loading="lazy"
        decoding="async"
        onError={() => setHasError(true)}
      />
    </span>
  );
}
