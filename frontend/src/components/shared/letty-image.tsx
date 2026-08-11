"use client";

import Image from "next/image";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { getImage, type ImageKey } from "@/lib/images";
import { cn } from "@/lib/utils";

interface LettyImageProps {
  imageKey: ImageKey;
  alt?: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
  fill?: boolean;
  width?: number;
  height?: number;
}

/**
 * Registry-aware image. All site imagery flows through this component so
 * swapping placeholder photography for final brand assets happens in
 * exactly one place: lib/images.ts.
 *
 * Renders a subtle brand-themed Skeleton behind the image while it loads,
 * fading in once the asset decodes. Honors the "no rounded corners" rule
 * by default.
 */
export function LettyImage({
  imageKey,
  alt,
  className,
  sizes = "(max-width: 768px) 100vw, 50vw",
  priority = false,
  fill = true,
  width,
  height,
}: LettyImageProps) {
  const [loaded, setLoaded] = useState(false);
  const asset = getImage(imageKey);

  if (fill) {
    return (
      <div className="relative h-full w-full overflow-hidden bg-secondary">
        <Skeleton
          className={cn(
            "absolute inset-0 transition-opacity duration-700",
            loaded ? "opacity-0" : "opacity-100",
          )}
        />
        <Image
          src={asset.src}
          alt={alt ?? asset.alt}
          fill
          sizes={sizes}
          priority={priority}
          onLoad={() => setLoaded(true)}
          className={cn(
            "object-cover transition-opacity duration-500 ease-out",
            loaded ? "opacity-100" : "opacity-0",
            className,
          )}
        />
      </div>
    );
  }
  return (
    <div
      className="relative overflow-hidden bg-secondary"
      style={{ width, height }}
    >
      <Skeleton
        className={cn(
          "absolute inset-0 transition-opacity duration-500",
          loaded ? "opacity-0" : "opacity-100",
        )}
      />
      <Image
        src={asset.src}
        alt={alt ?? asset.alt}
        width={width ?? 800}
        height={height ?? 1000}
        onLoad={() => setLoaded(true)}
        className={cn(
          "object-cover transition-opacity duration-500 ease-out",
          loaded ? "opacity-100" : "opacity-0",
          className,
        )}
      />
    </div>
  );
}
