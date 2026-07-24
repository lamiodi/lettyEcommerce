/**
 * Frontend wrappers for shipping + tax admin endpoints.
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

// -- Zones ---------------------------------------------------------------
export const createZoneAction = (body: { name: string; countries: string[]; is_active?: boolean }) =>
  post<{ id: string }>(`/api/admin/shipping/zones`, body);
export const updateZoneAction = (id: string, body: { name?: string; countries?: string[]; is_active?: boolean }) =>
  patch<{ id: string }>(`/api/admin/shipping/zones/${id}`, body);
export const deleteZoneAction = (id: string) => del<{ id: string }>(`/api/admin/shipping/zones/${id}`);

// -- Methods -------------------------------------------------------------
export const createMethodAction = (body: Record<string, any>) =>
  post<{ id: string }>(`/api/admin/shipping/methods`, body);
export const updateMethodAction = (id: string, body: Record<string, any>) =>
  patch<{ id: string }>(`/api/admin/shipping/methods/${id}`, body);
export const deleteMethodAction = (id: string) =>
  del<{ id: string }>(`/api/admin/shipping/methods/${id}`);

// -- Tax -----------------------------------------------------------------
export const createTaxRuleAction = (body: { country: string; state?: string | null; rate: number; is_inclusive?: boolean }) =>
  post<{ id: string }>(`/api/admin/tax`, body);
export const updateTaxRuleAction = (id: string, body: { country?: string; state?: string | null; rate?: number; is_inclusive?: boolean }) =>
  patch<{ id: string }>(`/api/admin/tax/${id}`, body);
export const deleteTaxRuleAction = (id: string) => del<{ id: string }>(`/api/admin/tax/${id}`);
