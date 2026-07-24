"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

/**
 * LETTY BEAUTY oval emblem — the official brand mark.
 * `mix-blend-multiply` lets the white plate melt into ivory surfaces.
 */
export function Monogram({ className }: { className?: string }) {
  return (
    <Image
      src="/brand/letty-emblem.png"
      alt=""
      aria-hidden
      width={342}
      height={356}
      className={cn("h-[46px] w-auto mix-blend-multiply", className)}
    />
  );
}

export function Logo({
  href = "/",
  className,
  withWordmark = true,
  onClick,
}: {
  href?: string;
  className?: string;
  withWordmark?: boolean;
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
      aria-label="LETTY BEAUTY — home"
      className={cn("group inline-flex cursor-pointer items-center gap-3", className)}
    >
      <Monogram className="transition-opacity group-hover:opacity-75" />
      {withWordmark && (
        <span className="font-serif text-xl font-medium uppercase tracking-luxe-sm text-ink">
          Letty Beauty
        </span>
      )}
    </Link>
  );
}
