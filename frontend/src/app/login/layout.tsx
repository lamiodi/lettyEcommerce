import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Sign In — LETTY",
  description: "Sign in to your LETTY account to view orders, wishlists and VIP perks.",
  robots: { index: false },
};

export default function LoginLayout({ children }: { children: ReactNode }) {
  return children;
}
