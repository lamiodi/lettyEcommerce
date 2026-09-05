import { cookies } from "next/headers";
import { UgcManager } from "@/components/admin/ugc/ugc-manager";
import { UgcVideo, DEFAULT_UGC_VIDEOS } from "@/lib/data/ugc-videos";

export const dynamic = "force-dynamic";

async function fetchUgcVideos(): Promise<UgcVideo[]> {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.getAll().map((c) => `${c.name}=${c.value}`).join("; ");
  try {
    const res = await fetch(`${base}/api/admin/ugc`, {
      headers: cookieHeader ? { cookie: cookieHeader } : undefined,
      cache: "no-store",
    });
    if (!res.ok) return DEFAULT_UGC_VIDEOS;
    const json = (await res.json()) as { data: UgcVideo[] };
    return json.data && json.data.length > 0 ? json.data : DEFAULT_UGC_VIDEOS;
  } catch {
    return DEFAULT_UGC_VIDEOS;
  }
}

export default async function AdminUgcPage() {
  const videos = await fetchUgcVideos();
  return <UgcManager initial={videos} />;
}
