/**
 * Frontend wrappers for analytics.
 */
export interface ActionResult<T = any> {
  data?: T;
  error?: string;
}

async function request<T>(url: string): Promise<ActionResult<T>> {
  try {
    const res = await fetch(url, { credentials: "include", cache: "no-store" });
    const json = (await res.json().catch(() => ({}))) as { error?: string; data?: T };
    if (!res.ok) return { error: json.error ?? `Request failed (${res.status})` };
    return { data: json.data };
  } catch (err) {
    return { error: (err as Error).message ?? "Network error" };
  }
}

export function fetchAnalyticsAction(range: "7d" | "30d" | "90d") {
  return request<any>(`/api/admin/analytics?range=${range}`);
}
