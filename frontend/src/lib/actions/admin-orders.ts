/**
 * Frontend-facing wrappers for the admin order server actions defined
 * in `backend/app/admin/actions/orders.ts`. These wrappers post to
 * `/api/admin/orders/:id/...` because Next.js 14 server actions
 * are not directly importable from the frontend bundle when the
 * actions live in a separate Express app.
 *
 * Each wrapper returns `{ data } | { error }` for predictable typing.
 */
export interface ActionResult<T = any> {
  data?: T;
  error?: string;
}

async function post<T = any>(url: string, body: any): Promise<ActionResult<T>> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
    });
    const json = (await res.json().catch(() => ({}))) as { error?: string; data?: T };
    if (!res.ok) return { error: json.error ?? `Request failed (${res.status})` };
    return { data: json.data };
  } catch (err) {
    return { error: (err as Error).message ?? "Network error" };
  }
}

export async function markShippedAction(
  orderId: string,
  body: { carrier: string; tracking_number: string },
) {
  return post(`/api/admin/orders/${orderId}/ship`, body);
}

export async function markDeliveredAction(orderId: string) {
  return post(`/api/admin/orders/${orderId}/deliver`, {});
}

export async function cancelOrderAction(orderId: string) {
  return post(`/api/admin/orders/${orderId}/cancel`, {});
}

export async function refundOrderAction(
  orderId: string,
  body: { amount: number; restock: boolean; reason?: string },
) {
  return post(`/api/admin/orders/${orderId}/refund`, body);
}

export async function setInternalNoteAction(orderId: string, note: string) {
  return post(`/api/admin/orders/${orderId}/note`, { note });
}
