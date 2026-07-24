/**
 * Frontend wrappers for the inventory REST endpoints.
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

export function restockInventoryAction(
  variantId: string,
  body: { quantity: number; notes?: string },
) {
  return request<{ id: string; new_stock: number }>(`/api/admin/inventory`, {
    method: "POST",
    body: JSON.stringify({ op: "restock", variant_id: variantId, ...body }),
  });
}

export function adjustInventoryAction(
  variantId: string,
  body: { new_quantity: number; reason: string },
) {
  return request<{ id: string; new_quantity: number }>(`/api/admin/inventory`, {
    method: "POST",
    body: JSON.stringify({ op: "adjust", variant_id: variantId, ...body }),
  });
}
