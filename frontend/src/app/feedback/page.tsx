import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, HeartHandshake } from "lucide-react";

export const metadata: Metadata = {
  title: "Client Experience & Feedback | LETTY",
  description: "Thank you for sharing your experience with Maison LETTY.",
  robots: { index: false, follow: false },
};

export default async function FeedbackPage(props: {
  searchParams: Promise<{ score?: string; order?: string }>;
}) {
  const sp = await props.searchParams;
  const score = sp.score ? parseInt(sp.score, 10) : null;
  const order = sp.order;

  return (
    <div className="mx-auto max-w-2xl px-4 py-20 text-center md:py-28">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gold/10 text-gold mb-6">
        <HeartHandshake className="h-8 w-8" />
      </div>

      <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-gold">
        Maison LETTY Client Service
      </p>

      <h1 className="mt-2 font-serif text-3xl font-medium text-ink md:text-4xl">
        Thank You for Your Feedback
      </h1>

      {score !== null && !Number.isNaN(score) && (
        <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-line bg-secondary px-4 py-1.5 text-xs text-stone">
          <span>Recorded Rating:</span>
          <strong className="text-ink font-semibold">{score} / 10</strong>
        </div>
      )}

      <p className="mx-auto mt-5 max-w-lg text-sm leading-relaxed text-stone">
        As your satisfaction is our priority, your insights allow us to continually refine the quality of service, packaging, and ritual experience we offer.
      </p>

      {order && (
        <p className="mt-2 text-xs text-stone/70">
          Order reference: <span className="font-mono text-ink">{order}</span>
        </p>
      )}

      <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
        <Link
          href="/shop"
          className="inline-flex h-12 items-center justify-center border border-ink bg-ink px-8 text-xs font-medium uppercase tracking-[0.22em] text-ivory transition hover:bg-stone hover:border-stone"
        >
          Explore the Maison
        </Link>
        <Link
          href="/contact"
          className="inline-flex h-12 items-center justify-center border border-line bg-white px-8 text-xs font-medium uppercase tracking-[0.22em] text-ink transition hover:border-ink"
        >
          Contact Concierge
        </Link>
      </div>
    </div>
  );
}
