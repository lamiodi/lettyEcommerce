/**
 * /admin/team — list admins with role + active toggles.
 */
import { cookies } from "next/headers";
import { TeamList } from "@/components/admin/team/team-list";

interface Member {
  id: string;
  email: string;
  role: string;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
}

export const dynamic = "force-dynamic";

async function fetchTeam(): Promise<Member[]> {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.getAll().map((c) => `${c.name}=${c.value}`).join("; ");
  try {
    const res = await fetch(`${base}/api/admin/team`, {
      headers: cookieHeader ? { cookie: cookieHeader } : undefined,
      cache: "no-store",
    });
    if (!res.ok) return [];
    const json = (await res.json()) as { data: Member[] };
    return json.data ?? [];
  } catch {
    return [];
  }
}

export default async function TeamPage() {
  const team = await fetchTeam();
  return <TeamList initial={team} />;
}
