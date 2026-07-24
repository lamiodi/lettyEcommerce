/**
 * GET /api/admin/notifications — unread admin notifications.
 */
import { NextRequest } from "next/server";
import { asyncHandler } from "@/lib/handler";
import { ok } from "@/lib/responses";
import { checkPermission } from "@/lib/auth/rbac";
import { supabaseAdmin } from "@/lib/supabase/server";

export const GET = asyncHandler(async (req: NextRequest) => {
  await checkPermission("read");
  const url = new URL(req.url);
  const unreadOnly = url.searchParams.get("unread") !== "false";
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit") ?? 50)));

  let q = supabaseAdmin()
    .from("admin_notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (unreadOnly) q = q.eq("is_read", false);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return ok(data ?? []);
});
