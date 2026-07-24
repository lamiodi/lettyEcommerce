import type { Review } from "@/types";
import { genericReviews, reviews } from "@/lib/mock/reviews";
import { products } from "@/lib/mock/products";

export async function getReviewsByProduct(productId: string): Promise<Review[]> {
  const dedicated = reviews.filter((r) => r.productId === productId);
  if (dedicated.length > 0) return dedicated;
  // Deterministic generic fallback so every PDP shows social proof
  const index = products.findIndex((p) => p.id === productId);
  const offset = Math.abs(index) % genericReviews.length;
  return [
    genericReviews[offset],
    genericReviews[(offset + 1) % genericReviews.length],
  ];
}
