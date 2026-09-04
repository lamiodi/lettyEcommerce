"use client";

import { useMemo, useState } from "react";
import { ProductGallery } from "@/components/product/product-gallery";
import { PurchasePanel } from "@/components/product/purchase-panel";
import { ProductAccordions } from "@/components/product/product-accordions";
import type { Product, ProductMedia, ProductVariant } from "@/types";

interface ProductStageProps {
  product: Product;
  brandName?: string;
  badge?: string | null;
}

/**
 * Client-side interactive stage syncing the ProductGallery with the
 * PurchasePanel shade selector and ProductAccordions.
 */
export function ProductStage({ product, brandName, badge }: ProductStageProps) {
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    product.variants[0] ?? null,
  );

  // Compute media list: If the selected variant has a specific image that isn't already the first media item,
  // we prepend or highlight it.
  const activeMedia = useMemo<ProductMedia[]>(() => {
    if (!selectedVariant?.image) return product.media;

    // Check if the variant image is already in media
    const existingIndex = product.media.findIndex(
      (m) => m.imageKey === selectedVariant.image,
    );

    if (existingIndex > 0) {
      // Bring the selected variant's media to the front
      const selected = product.media[existingIndex];
      const rest = product.media.filter((_, i) => i !== existingIndex);
      return [selected, ...rest];
    } else if (existingIndex === -1) {
      // Add as first media item
      const newMediaItem: ProductMedia = {
        id: `m-variant-${selectedVariant.id}`,
        imageKey: selectedVariant.image,
        alt: `${product.name} — ${selectedVariant.color ?? "Selected shade"}`,
        position: 0,
      };
      return [newMediaItem, ...product.media];
    }

    return product.media;
  }, [product.media, product.name, selectedVariant]);

  return (
    <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16">
      <ProductGallery
        key={selectedVariant?.id ?? "default"}
        media={activeMedia}
        productName={product.name}
        badge={badge}
      />
      <div className="lg:sticky lg:top-28 lg:self-start">
        <PurchasePanel
          product={product}
          brandName={brandName}
          onVariantChange={setSelectedVariant}
        />
        <ProductAccordions product={product} />
      </div>
    </div>
  );
}
