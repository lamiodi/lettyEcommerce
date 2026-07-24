/**
 * Generic frontend wrappers for all the admin settings + ancillary
 * endpoints (settings, banners, gift cards, brands, categories).
 */
export interface ActionResult<T = any> {
  data?: T;
  error?: string;
}

async function request<T>(url: string, init: RequestInit): Promise<ActionResult<T>> {
  try {
    const res = await fetch(url, {
      ...init,
      headers: { "Content-Type": "application/json", ...(init.headers ?? {}) },
      credentials: "include",
    });
    const json = (await res.json().catch(() => ({}))) as { error?: string; data?: T };
    if (!res.ok) return { error: json.error ?? `Request failed (${res.status})` };
    return { data: json.data };
  } catch (err) {
    return { error: (err as Error).message ?? "Network error" };
  }
}

const post = <T,>(url: string, body: any) => request<T>(url, { method: "POST", body: JSON.stringify(body) });
const patch = <T,>(url: string, body: any) => request<T>(url, { method: "PATCH", body: JSON.stringify(body) });
const del = <T,>(url: string) => request<T>(url, { method: "DELETE" });

// Settings
export const updateSettingsAction = (body: Record<string, any>) => patch<{ ok: true }>(`/api/admin/settings`, body);

// Banners
export const createBannerAction = (body: Record<string, any>) => post<{ id: string }>(`/api/admin/banners`, body);
export const updateBannerAction = (id: string, body: Record<string, any>) => patch<{ id: string }>(`/api/admin/banners/${id}`, body);
export const deleteBannerAction = (id: string) => del<{ id: string }>(`/api/admin/banners/${id}`);

// Gift cards
export const createGiftCardAction = (body: Record<string, any>) => post<{ id: string; code: string }>(`/api/admin/gift-cards`, body);
export const updateGiftCardAction = (id: string, body: Record<string, any>) => patch<{ id: string }>(`/api/admin/gift-cards/${id}`, body);

// Brands
export const createBrandAction = (body: { name: string; slug?: string; is_active?: boolean }) =>
  post<{ id: string }>(`/api/admin/brands`, body);
export const updateBrandAction = (id: string, body: { name?: string; is_active?: boolean }) =>
  patch<{ id: string }>(`/api/admin/brands/${id}`, body);
export const deleteBrandAction = (id: string) => del<{ id: string }>(`/api/admin/brands/${id}`);

// Categories
export const createCategoryAction = (body: Record<string, any>) =>
  post<{ id: string }>(`/api/admin/categories`, body);
export const updateCategoryAction = (id: string, body: Record<string, any>) =>
  patch<{ id: string }>(`/api/admin/categories/${id}`, body);
export const deleteCategoryAction = (id: string) => del<{ id: string }>(`/api/admin/categories/${id}`);
