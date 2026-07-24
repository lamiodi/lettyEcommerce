/**
 * PATCH  /api/admin/team/:id — change role or is_active
 */
import { NextRequest } from "next/server";
import { z } from "zod";
import { asyncHandler } from "@/lib/handler";
import { ok } from "@/lib/responses";
import { checkPermission, ADMIN_ROLES } from "@/lib/auth/rbac";
import { supabaseAdmin } from "@/lib/supabase/server";
import { NotFoundError } from "@/lib/errors";
import { writeAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";

type Ctx = { params: Promise<{ id: string }> };

const updateSchema = z.object({
  role: z.enum(ADMIN_ROLES as unknown as [string, ...string[]]).optional(),
  is_active: z.boolean().optional(),
});

export const PATCH = asyncHandler(async (req: NextRequest, ctx: Ctx) => {
  const admin = await checkPermission("manage_team");
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid payload" }, { status: 400 });
  }

  // Don't let an admin demote themselves.
  if (id === admin.sub && parsed.data.role && parsed.data.role !== "owner") {
    throw new Error("You cannot demote yourself from owner");
  }
  if (id === admin.sub && parsed.data.is_active === false) {
    throw new Error("You cannot deactivate yourself");
  }

  const { data, error } = await supabaseAdmin()
    .from("admins")
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("id, role, is_active")
    .single();
  if (error || !data) throw new NotFoundError("Admin not found");
  await writeAudit(admin, {
    action: "UPDATE_TEAM_MEMBER",
    entityType: "admin",
    entityId: data.id,
    metadata: parsed.data,
  });
  revalidatePath("/admin/team");
  return ok(data);
});
