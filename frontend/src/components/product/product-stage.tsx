"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ProductGallery } from "@/components/product/product-gallery";
import { PurchasePanel } from "@/components/product/purchase-panel";
import { ProductAccordions } from "@/components/product/product-accordions";
import type { Product, ProductMedia, ProductVariant } from "@/types";

interface ProductStageProps {
  product: Product;
  brandName?: string;
  badge?: string | null;
  initialShade?: string;
}

/**
 * Client-side interactive stage syncing the ProductGallery with the
 * PurchasePanel shade selector and ProductAccordions.
 */
export function ProductStage({ product, brandName, badge, initialShade }: ProductStageProps) {
  const findMatchingVariant = (shadeStr?: string | null) => {
    if (!shadeStr) return null;
    const target = shadeStr.toLowerCase().trim();
    return (
      product.variants.find((v) => {
        if (!v.color) return false;
        const c = v.color.toLowerCase().trim();
        return c === target || c.includes(target) || target.includes(c);
      }) ?? null
    );
  };

  const initialVariant = findMatchingVariant(initialShade) ?? product.variants[0] ?? null;

  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    initialVariant,
  );
  const galleryRef = useRef<HTMLDivElement>(null);

  // Sync with browser URL params on client navigation
  useEffect(() => {
    if (typeof window !== "undefined") {
      const sp = new URLSearchParams(window.location.search);
      const s = sp.get("shade") || sp.get("color");
      if (s) {
        const found = findMatchingVariant(s);
        if (found) setSelectedVariant(found);
      }
    }
  }, [product.variants]);

  const handleVariantChange = (variant: ProductVariant) => {
    setSelectedVariant(variant);

    // On mobile devices, smoothly scroll up to show the updated variant image
    if (typeof window !== "undefined") {
      const isMobile = window.matchMedia("(max-width: 1023px)").matches;
      if (isMobile && galleryRef.current) {
        const headerOffset = 76; // Space for sticky header + top breathing room
        const elementTop = galleryRef.current.getBoundingClientRect().top;
        const targetScrollY = window.scrollY + elementTop - headerOffset;

        window.scrollTo({
          top: Math.max(0, targetScrollY),
          behavior: "smooth",
        });
      }
    }
  };

  // Compute media list: When a variant is selected, show ONLY its own images!
  // Never mix in other variants' shade photography.
  const activeMedia = useMemo<ProductMedia[]>(() => {
    // 1. If variant defines its own dedicated image collection, use ONLY those images
    if (selectedVariant?.images && selectedVariant.images.length > 0) {
      return selectedVariant.images.map((img, idx) => ({
        id: `m-${selectedVariant.id}-${idx}`,
        imageKey: img,
        alt: `${product.name} — ${selectedVariant.color ?? "Selected shade"} (Image ${idx + 1})`,
        position: idx,
      }));
    }

    // 2. If variant has a single image, pair it only with generic brand/editorial imagery
    // and exclude any images that belong to different variants/shades
    if (selectedVariant?.image) {
      const allOtherVariantImages = new Set(
        product.variants
          .filter((v) => v.id !== selectedVariant.id)
          .flatMap((v) => [v.image, ...(v.images ?? [])])
          .filter(Boolean),
      );

      const sharedEditorialMedia = product.media.filter(
        (m) => !allOtherVariantImages.has(m.imageKey) && m.imageKey !== selectedVariant.image,
      );

      const primaryMedia: ProductMedia = {
        id: `m-${selectedVariant.id}-primary`,
        imageKey: selectedVariant.image,
        alt: `${product.name} — ${selectedVariant.color ?? "Selected shade"}`,
        position: 0,
      };

      return [primaryMedia, ...sharedEditorialMedia];
    }

    return product.media;
  }, [product.media, product.name, product.variants, selectedVariant]);

  return (
    <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16">
      <div ref={galleryRef} id="product-gallery" className="scroll-mt-20">
        <ProductGallery
          media={activeMedia}
          productName={product.name}
          badge={badge}
        />
      </div>
      <div className="lg:sticky lg:top-28 lg:self-start">
        <PurchasePanel
          product={product}
          brandName={brandName}
          onVariantChange={handleVariantChange}
          initialShade={initialShade}
        />
        <ProductAccordions product={product} />
      </div>
    </div>
  );
}

