import { getProductPreorder, type PreorderDetails } from "./preorder-catalog";

/** Preserve the promise made at checkout even if a campaign changes later. */
export function createPreorderSnapshot(productSlug: string) {
  const preorder = getProductPreorder(productSlug);
  return {
    is_preorder: preorder !== null,
    preorder_dispatch: preorder?.dispatch ?? null,
  };
}

/** Read persisted details, with a fallback for orders created before snapshots. */
export function readPreorderSnapshot(snapshot: unknown): PreorderDetails | null {
  if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)) return null;
  const value = snapshot as Record<string, unknown>;
  if (value.is_preorder === false) return null;
  if (value.is_preorder === true) {
    return {
      dispatch: typeof value.preorder_dispatch === "string" && value.preorder_dispatch.trim()
        ? value.preorder_dispatch.trim()
        : null,
    };
  }
  return typeof value.slug === "string" ? getProductPreorder(value.slug) : null;
}
