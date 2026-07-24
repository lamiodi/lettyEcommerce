import Image from "next/image";
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
  const asset = getImage(imageKey);
  if (fill) {
    return (
      <Image
        src={asset.src}
        alt={alt ?? asset.alt}
        fill
        sizes={sizes}
        priority={priority}
        className={cn("object-cover", className)}
      />
    );
  }
  return (
    <Image
      src={asset.src}
      alt={alt ?? asset.alt}
      width={width ?? 800}
      height={height ?? 1000}
      className={cn("object-cover", className)}
    />
  );
}
