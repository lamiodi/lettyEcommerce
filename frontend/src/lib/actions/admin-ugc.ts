import { UgcVideo } from "@/lib/data/ugc-videos";

export interface ActionResult<T = any> {
  data?: T;
  error?: string;
}

async function request<T>(url: string, init?: RequestInit): Promise<ActionResult<T>> {
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

export function fetchAdminUgcVideosAction() {
  return request<UgcVideo[]>("/api/admin/ugc");
}

export function createUgcVideoAction(body: Omit<UgcVideo, "id">) {
  return request<UgcVideo>("/api/admin/ugc", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function updateUgcVideoAction(id: string, updates: Partial<UgcVideo>) {
  return request<{ ok: true }>("/api/admin/ugc", {
    method: "PATCH",
    body: JSON.stringify({ id, ...updates }),
  });
}

export function saveAllUgcVideosAction(items: UgcVideo[]) {
  return request<{ ok: true }>("/api/admin/ugc", {
    method: "PATCH",
    body: JSON.stringify(items),
  });
}

export function deleteUgcVideoAction(id: string) {
  return request<{ ok: true; deleted: string }>(`/api/admin/ugc?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}
