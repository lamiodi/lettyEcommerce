/**
 * Frontend wrappers for team admin.
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

export const inviteTeamAction = (body: { email: string; role: string }) =>
  post<{ id: string; email: string; role: string; temporary_password?: string }>(`/api/admin/team`, body);
export const updateTeamAction = (id: string, body: { role?: string; is_active?: boolean }) =>
  patch<{ id: string }>(`/api/admin/team/${id}`, body);
