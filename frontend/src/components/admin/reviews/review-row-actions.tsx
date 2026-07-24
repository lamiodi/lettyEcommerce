"use client";

/**
 * Review row actions: approve / unapprove / delete.
 */
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, X as XIcon, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { approveReviewAction, deleteReviewAction } from "@/lib/actions/admin-reviews";

interface ReviewRow {
  id: string;
  is_approved: boolean;
  product: { name: string } | null;
}

export function ReviewRowActions({ review }: { review: ReviewRow }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function approve(approved: boolean) {
    startTransition(async () => {
      const res = await approveReviewAction(review.id, approved);
      if (res.error) toast.error(res.error);
      else {
        toast.success(approved ? "Approved" : "Unapproved");
        router.refresh();
      }
    });
  }

  function remove() {
    if (!confirm("Delete this review permanently?")) return;
    startTransition(async () => {
      const res = await deleteReviewAction(review.id);
      if (res.error) toast.error(res.error);
      else {
        toast.success("Deleted");
        router.refresh();
      }
    });
  }

  return (
    <div className="flex items-center justify-end gap-1">
      {review.is_approved ? (
        <button
          type="button"
          onClick={() => approve(false)}
          disabled={pending}
          aria-label="Unapprove"
          className="h-8 w-8 grid place-items-center text-stone hover:text-ink disabled:opacity-50"
        >
          <XIcon className="h-3.5 w-3.5" />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => approve(true)}
          disabled={pending}
          aria-label="Approve"
          className="h-8 w-8 grid place-items-center text-ink hover:text-stone disabled:opacity-50"
        >
          <Check className="h-3.5 w-3.5" />
        </button>
      )}
      <button
        type="button"
        onClick={remove}
        disabled={pending}
        aria-label="Delete"
        className="h-8 w-8 grid place-items-center text-stone hover:text-ink"
      >
        {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
      </button>
    </div>
  );
}
