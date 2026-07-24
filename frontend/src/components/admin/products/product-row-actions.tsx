"use client";

/**
 * Per-row actions for the product list: toggle active, soft-delete,
 * restore (when viewing deleted). Inline confirmations only — no
 * separate screen required.
 */
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Power, Trash2, Undo2 } from "lucide-react";
import { toast } from "sonner";
import {
  deleteProductAction,
  restoreProductAction,
  updateProductAction,
} from "@/lib/actions/admin-products";

interface ProductRow {
  id: string;
  name: string;
  is_active: boolean;
  deleted_at: string | null;
}

export function ProductRowActions({ product }: { product: ProductRow }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function toggleActive() {
    startTransition(async () => {
      const res = await updateProductAction(product.id, { is_active: !product.is_active });
      if (res.error) toast.error(res.error);
      else {
        toast.success(product.is_active ? "Moved to draft" : "Published");
        router.refresh();
      }
      setOpen(false);
    });
  }

  function softDelete() {
    if (!confirm(`Move "${product.name}" to trash? You can restore it later.`)) return;
    startTransition(async () => {
      const res = await deleteProductAction(product.id);
      if (res.error) toast.error(res.error);
      else {
        toast.success("Moved to trash");
        router.refresh();
      }
      setOpen(false);
    });
  }

  function restore() {
    startTransition(async () => {
      const res = await restoreProductAction(product.id);
      if (res.error) toast.error(res.error);
      else {
        toast.success("Restored");
        router.refresh();
      }
      setOpen(false);
    });
  }

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={pending}
        aria-label="Actions"
        className="h-8 w-8 grid place-items-center border border-line hover:border-ink transition disabled:opacity-50"
      >
        <MoreHorizontal className="h-3.5 w-3.5" />
      </button>
      {open ? (
        <ul
          role="menu"
          className="absolute right-0 top-9 z-20 min-w-[160px] border border-line bg-ivory shadow-none"
        >
          {!product.deleted_at ? (
            <>
              <li>
                <button
                  type="button"
                  onClick={toggleActive}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-ivory/60 flex items-center gap-2"
                >
                  <Power className="h-3.5 w-3.5 text-stone" />
                  {product.is_active ? "Move to draft" : "Publish"}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={softDelete}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-ivory/60 flex items-center gap-2 text-stone"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Move to trash
                </button>
              </li>
            </>
          ) : (
            <li>
              <button
                type="button"
                onClick={restore}
                className="w-full text-left px-3 py-2 text-sm hover:bg-ivory/60 flex items-center gap-2"
              >
                <Undo2 className="h-3.5 w-3.5 text-stone" />
                Restore
              </button>
            </li>
          )}
        </ul>
      ) : null}
    </div>
  );
}
