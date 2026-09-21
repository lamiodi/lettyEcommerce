/**
 * PATCH  /api/admin/team/:id — change role or is_active
 */
import { NextRequest } from "next/server";
import { z } from "zod";
import { asyncHandler } from "@/lib/handler";
import { ok } from "@/lib/responses";
import { checkPermission, hasPermission, ADMIN_ROLES, ROLE_LEVEL, type AdminRole } from "@/lib/auth/rbac";
import { supabaseAdmin } from "@/lib/supabase/server";
import { ConflictError, ForbiddenError, NotFoundError } from "@/lib/errors";
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

  // Self-management guards.
  if (id === admin.sub && parsed.data.role && parsed.data.role !== admin.role) {
    throw new ConflictError("You cannot change your own role");
  }
  if (id === admin.sub && parsed.data.is_active === false) {
    throw new ConflictError("You cannot deactivate yourself");
  }

  const { data: target, error: readErr } = await supabaseAdmin()
    .from("admins")
    .select("id, role, is_active")
    .eq("id", id)
    .single();
  if (readErr || !target) throw new NotFoundError("Admin not found");

  const isOwnerLevel = hasPermission(admin.role, "*");
  const targetRole = target.role as AdminRole;

  // Escalation guard: without `*` a caller may only modify members strictly
  // below their own level, and may never assign a role at/above their own.
  if (!isOwnerLevel) {
    if (ROLE_LEVEL[targetRole] >= ROLE_LEVEL[admin.role]) {
      throw new ForbiddenError(`Role '${admin.role}' cannot modify another '${targetRole}'`);
    }
    if (parsed.data.role && ROLE_LEVEL[parsed.data.role as AdminRole] >= ROLE_LEVEL[admin.role]) {
      throw new ForbiddenError(`Role '${admin.role}' cannot assign role '${parsed.data.role}'`);
    }
  }

  // Last-active-owner protection: the store must always keep at least one
  // active owner who can sign in.
  const removesOwnership =
    (parsed.data.role && parsed.data.role !== "owner" && targetRole === "owner") ||
    (parsed.data.is_active === false && targetRole === "owner" && target.is_active);
  if (removesOwnership) {
    const { count } = await supabaseAdmin()
      .from("admins")
      .select("id", { count: "exact", head: true })
      .eq("role", "owner")
      .eq("is_active", true);
    if ((count ?? 0) <= 1) {
      throw new ConflictError("Cannot demote or deactivate the last active owner");
    }
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
