/** Server-owned preorder campaign details. Keep these aligned with the storefront. */
export const MWAH_SLUG = "letty-mwah-lip-balm";
export const MWAH_DISPATCH = "Late October–early November 2026";

export interface PreorderDetails {
  dispatch: string | null;
}

export function getProductPreorder(slug: string): PreorderDetails | null {
  return slug === MWAH_SLUG ? { dispatch: MWAH_DISPATCH } : null;
}
