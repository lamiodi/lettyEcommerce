/**
 * Frontend wrappers for coupon admin endpoints.
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

export function createCouponAction(body: Record<string, any>) {
  return post<{ id: string }>(`/api/admin/coupons`, body);
}
export function updateCouponAction(id: string, body: Record<string, any>) {
  return patch<{ id: string }>(`/api/admin/coupons/${id}`, body);
}
export function deleteCouponAction(id: string) {
  return del<{ id: string }>(`/api/admin/coupons/${id}`);
}
