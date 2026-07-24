/**
 * POST /api/admin/notifications/[id]/read
 *
 * Mark a single admin notification as read. Idempotent.
 */
import { NextRequest } from "next/server";
import { asyncHandler } from "@/lib/handler";
import { checkPermission } from "@/lib/auth/rbac";
import { supabaseAdmin } from "@/lib/supabase/server";

export const POST = asyncHandler(async (_req: NextRequest, ctx: { params: { id: string } }) => {
  const claims = await checkPermission("read");
  const { id } = ctx.params;

  const { error } = await supabaseAdmin()
    .from("admin_notifications")
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq("id", id);
  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  // Audit log.
  await supabaseAdmin().from("admin_audit_log").insert({
    actor_id: claims.sub,
    action: "MARK_NOTIFICATION_READ",
    entity_type: "notification",
    entity_id: id,
  });

  return Response.json({ data: { ok: true } });
});
