"use client";

/**
 * MediaManager — wraps MediaUploader with the ability to set primary,
 * edit alt text, change order and remove items. Uses the same
 * Supabase signed-URL flow as MediaUploader.
 */
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { GripVertical, Star, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { MediaUploader } from "@/components/admin/media-uploader";
import {
  addMediaAction,
  updateMediaAction,
  removeMediaAction,
} from "@/lib/actions/admin-products";

interface Media {
  id: string;
  url: string;
  alt_text: string | null;
  position: number;
  is_primary: boolean;
  type: "image" | "video";
  created_at: string;
}

interface MediaManagerProps {
  productId: string;
  initial: Media[];
}

export function MediaManager({ productId, initial }: MediaManagerProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [items, setItems] = useState<Media[]>(() =>
    [...initial].sort((a, b) => a.position - b.position),
  );

  function onUploaded(file: { name: string; url: string }) {
    // Persist to backend; then refresh from server.
    startTransition(async () => {
      const res = await addMediaAction(productId, {
        url: file.url,
        position: items.length,
        is_primary: items.length === 0,
        type: "image",
      });
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Uploaded");
      router.refresh();
    });
  }

  function setPrimary(m: Media) {
    startTransition(async () => {
      const res = await updateMediaAction(productId, m.id, { is_primary: true });
      if (res.error) toast.error(res.error);
      else {
        // Optimistic local update so the user sees immediate feedback.
        setItems((prev) => prev.map((x) => ({ ...x, is_primary: x.id === m.id })));
        toast.success("Primary updated");
        router.refresh();
      }
    });
  }

  function setAlt(m: Media, alt: string) {
    startTransition(async () => {
      const res = await updateMediaAction(productId, m.id, { alt_text: alt || null });
      if (res.error) toast.error(res.error);
      else {
        setItems((prev) => prev.map((x) => (x.id === m.id ? { ...x, alt_text: alt || null } : x)));
      }
    });
  }

  function remove(m: Media) {
    if (!confirm("Remove this media item?")) return;
    startTransition(async () => {
      const res = await removeMediaAction(productId, m.id);
      if (res.error) toast.error(res.error);
      else {
        setItems((prev) => prev.filter((x) => x.id !== m.id));
        toast.success("Removed");
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-4">
      {items.length > 0 ? (
        <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {items.map((m) => (
            <li
              key={m.id}
              className="border border-line bg-ivory overflow-hidden flex flex-col"
            >
              <div className="relative aspect-square bg-ivory">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={m.url} alt={m.alt_text ?? ""} className="h-full w-full object-cover" />
                {m.is_primary ? (
                  <span className="absolute top-1 left-1 inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] uppercase tracking-[0.18em] bg-ink text-ivory">
                    <Star className="h-2.5 w-2.5" />
                    Primary
                  </span>
                ) : null}
              </div>
              <div className="p-2 space-y-2">
                <input
                  defaultValue={m.alt_text ?? ""}
                  onBlur={(e) => {
                    if ((e.target.value || "") !== (m.alt_text ?? "")) setAlt(m, e.target.value);
                  }}
                  placeholder="Alt text"
                  className="letty-input-xs w-full"
                />
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setPrimary(m)}
                    disabled={pending || m.is_primary}
                    className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.18em] text-stone hover:text-ink disabled:opacity-50"
                  >
                    <Star className="h-3 w-3" />
                    {m.is_primary ? "Primary" : "Make primary"}
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(m)}
                    disabled={pending}
                    aria-label="Remove"
                    className="h-6 w-6 grid place-items-center text-stone hover:text-ink"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-stone">No media yet — upload images below.</p>
      )}

      <MediaUploader
        bucket="product-media"
        onUploaded={onUploaded}
        onError={(m) => toast.error(m)}
      />

      {pending ? (
        <p className="text-[11px] uppercase tracking-[0.18em] text-stone inline-flex items-center gap-2">
          <Loader2 className="h-3 w-3 animate-spin" />
          Saving…
        </p>
      ) : null}

      <style jsx>{`
        :global(.letty-input-xs) {
          width: 100%;
          background: transparent;
          border: none;
          border-bottom: 1px solid #ECECEC;
          padding: 0.25rem 0;
          font-size: 0.7rem;
          color: #111111;
          border-radius: 0;
        }
        :global(.letty-input-xs:focus) {
          outline: none;
          border-bottom-color: #111111;
        }
      `}</style>
    </div>
  );
}
