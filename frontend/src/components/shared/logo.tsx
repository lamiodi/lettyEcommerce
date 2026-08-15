"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

/**
 * LETTY logo system — the official lockup (monogram + wordmark), cropped
 * from the client-supplied plates.
 *
 * Two transparent lockups, chosen by the surface the logo sits on:
 * - `light`: espresso artwork for white/cream/beige surfaces.
 *    Never use on dark backgrounds.
 * - `dark`: bone artwork for dark heroes, the entrance curtain, and
 *    other dark sections. Never use on light backgrounds.
 */
const LOCKUPS = {
  light: {
    src: "/brand/letty-logo-light.png",
    width: 557,
    height: 789,
  },
  dark: {
    src: "/brand/letty-logo-dark.png",
    width: 344,
    height: 488,
  },
} as const;

export type LogoVariant = keyof typeof LOCKUPS;

/**
 * The lockup on its own (no link). Defaults to navbar sizing:
 * 40px on mobile, 48px on desktop — override via `className`.
 */
export function LogoImage({
  variant = "light",
  className,
  priority,
}: {
  variant?: LogoVariant;
  className?: string;
  priority?: boolean;
}) {
  const lockup = LOCKUPS[variant];
  return (
    <Image
      src={lockup.src}
      alt="LETTY"
      width={lockup.width}
      height={lockup.height}
      priority={priority}
      className={cn("h-12 w-auto md:h-12", className)}
    />
  );
}

export function Logo({
  href = "/",
  className,
  variant = "light",
  onClick,
}: {
  href?: string;
  className?: string;
  variant?: LogoVariant;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}) {
  const router = useRouter();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Run any consumer-supplied callback first (e.g. close the mobile sheet).
    onClick?.(e);
    // Force a top-of-page navigation even when the user is already on `/`.
    e.preventDefault();
    router.push(href);
    router.refresh();
  };

  return (
    <Link
      href={href}
      onClick={handleClick}
      aria-label="LETTY — home"
      className={cn("group inline-flex cursor-pointer items-center", className)}
    >
      <LogoImage variant={variant} className="transition-opacity group-hover:opacity-75" />
    </Link>
  );
}
