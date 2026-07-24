"use client";

/**
 * ConfirmDialog — minimal modal confirmation. Used for destructive
 * actions (refund, cancel, delete). Built on the standard <dialog>
 * element so it ships without a UI dependency.
 */
import { useEffect, useRef } from "react";
import { X } from "lucide-react";

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** When true, render the confirm button as a destructive style. */
  destructive?: boolean;
  /** When true, render the confirm button as a loading spinner. */
  loading?: boolean;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  loading = false,
}: ConfirmDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      className="bg-transparent backdrop:bg-ink/30 p-0 m-auto max-w-md w-[92vw]"
    >
      <div className="bg-ivory p-8 border border-line">
        <div className="flex items-start justify-between gap-4">
          <h2 className="font-serif text-xl text-ink">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-stone hover:text-ink transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {description ? (
          <p className="mt-3 text-sm text-stone leading-relaxed">{description}</p>
        ) : null}
        <div className="mt-8 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="h-10 px-5 text-[11px] uppercase tracking-[0.18em] text-stone hover:text-ink transition disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`h-10 px-6 text-[11px] uppercase tracking-[0.18em] transition disabled:opacity-60 ${
              destructive
                ? "bg-ink text-ivory hover:bg-stone"
                : "bg-ink text-ivory hover:bg-stone"
            }`}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-ivory border-t-transparent" />
                {confirmLabel}
              </span>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </dialog>
  );
}
