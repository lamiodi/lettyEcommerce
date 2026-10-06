import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Reset Password — LETTY",
  description: "Choose a new password for your LETTY account.",
  robots: { index: false },
};

export default function ResetPasswordLayout({ children }: { children: ReactNode }) {
  return children;
}
