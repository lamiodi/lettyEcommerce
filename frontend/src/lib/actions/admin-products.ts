/**
 * Frontend-facing wrappers for the admin product REST endpoints.
 * Mirrors the `admin-orders.ts` pattern: small typed post/get helpers
 * that return `{ data } | { error }` and are safe to call from any
 * client component.
 */

export interface ActionResult<T = any> {
  data?: T;
  error?: string;
}

async function request<T = any>(url: string, init?: RequestInit): Promise<ActionResult<T>> {
  try {
    const res = await fetch(url, {
      ...init,
      headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
      credentials: "include",
    });
    const json = (await res.json().catch(() => ({}))) as { error?: string; data?: T };
    if (!res.ok) return { error: json.error ?? `Request failed (${res.status})` };
    return { data: json.data };
  } catch (err) {
    return { error: (err as Error).message ?? "Network error" };
  }
}

async function post<T = any>(url: string, body: any): Promise<ActionResult<T>> {
  return request<T>(url, { method: "POST", body: JSON.stringify(body) });
}

async function patch<T = any>(url: string, body: any): Promise<ActionResult<T>> {
  return request<T>(url, { method: "PATCH", body: JSON.stringify(body) });
}

async function del<T = any>(url: string): Promise<ActionResult<T>> {
  return request<T>(url, { method: "DELETE" });
}

// -- Products ---------------------------------------------------------------

export interface ProductPayload {
  name: string;
  slug?: string;
  brand_id?: string | null;
  category_id?: string | null;
  description?: string | null;
  short_description?: string | null;
  base_price_ngn: number;
  base_price_usd: number;
  compare_at_price_ngn?: number | null;
  compare_at_price_usd?: number | null;
  is_active?: boolean;
  is_featured?: boolean;
  is_new?: boolean;
  is_bestseller?: boolean;
}

export interface ProductUpdatePayload {
  name?: string;
  brand_id?: string | null;
  category_id?: string | null;
  description?: string | null;
  short_description?: string | null;
  base_price_ngn?: number;
  base_price_usd?: number;
  compare_at_price_ngn?: number | null;
  compare_at_price_usd?: number | null;
  is_active?: boolean;
  is_featured?: boolean;
  is_new?: boolean;
  is_bestseller?: boolean;
}

export function createProductAction(body: ProductPayload) {
  return post<{ id: string; slug: string }>(`/api/admin/products`, body);
}

export function updateProductAction(id: string, body: ProductUpdatePayload) {
  return patch<{ id: string }>(`/api/admin/products/${id}`, body);
}

export function deleteProductAction(id: string) {
  return del<{ id: string; deleted_at: string }>(`/api/admin/products/${id}`);
}

export function restoreProductAction(id: string) {
  return post<{ id: string }>(`/api/admin/products/${id}/restore`, {});
}

// -- Variants ---------------------------------------------------------------

export interface VariantOption {
  option_name: string;
  option_value: string;
}

export interface VariantPayload {
  sku: string;
  barcode?: string | null;
  price_override_ngn?: number | null;
  price_override_usd?: number | null;
  weight_grams?: number | null;
  stock_quantity?: number;
  low_stock_threshold?: number;
  is_active?: boolean;
  position?: number;
  options?: VariantOption[];
}

export function createVariantAction(productId: string, body: VariantPayload) {
  return post<{ id: string; sku: string }>(
    `/api/admin/products/${productId}/variants`,
    body,
  );
}

export function updateVariantAction(
  productId: string,
  variantId: string,
  body: Partial<VariantPayload>,
) {
  return patch<{ id: string }>(
    `/api/admin/products/${productId}/variants/${variantId}`,
    body,
  );
}

export function deleteVariantAction(productId: string, variantId: string) {
  return del<{ id: string }>(`/api/admin/products/${productId}/variants/${variantId}`);
}

// -- Media ------------------------------------------------------------------

export interface MediaPayload {
  url: string;
  alt_text?: string | null;
  position?: number;
  is_primary?: boolean;
  type?: "image" | "video";
}

export function addMediaAction(productId: string, body: MediaPayload) {
  return post<{ id: string }>(`/api/admin/products/${productId}/media`, body);
}

export function updateMediaAction(
  productId: string,
  mediaId: string,
  body: { alt_text?: string | null; position?: number; is_primary?: boolean; type?: "image" | "video" },
) {
  return patch<{ id: string }>(
    `/api/admin/products/${productId}/media/${mediaId}`,
    body,
  );
}

export function removeMediaAction(productId: string, mediaId: string) {
  return del<{ id: string }>(`/api/admin/products/${productId}/media/${mediaId}`);
}
