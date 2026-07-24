import type { Metadata } from "next";
import { WishlistContent } from "@/components/wishlist/wishlist-content";

export const metadata: Metadata = {
  title: "Your Wishlist",
  description: "View and manage your saved LETTY luxury ritual items.",
};

export default function WishlistPage() {
  return <WishlistContent />;
}
