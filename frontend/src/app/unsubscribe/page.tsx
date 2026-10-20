import { Suspense } from "react";
import type { Metadata } from "next";
import { UnsubscribeForm } from "./unsubscribe-form";

export const metadata: Metadata = {
  title: "Email Preferences | LETTY",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default function UnsubscribePage() {
  return (
    <div className="bg-ivory px-5 py-16 sm:py-24">
      <section className="mx-auto max-w-xl rounded-2xl border border-stone/15 bg-white p-6 sm:p-10">
        <p className="text-xs uppercase tracking-luxe text-stone">LETTY email preferences</p>
        <Suspense fallback={<p className="mt-6 text-sm text-stone">Loading your preferences...</p>}>
          <UnsubscribeForm />
        </Suspense>
      </section>
    </div>
  );
}
