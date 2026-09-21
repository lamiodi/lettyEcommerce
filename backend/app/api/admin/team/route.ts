/**
 * GET   /api/admin/team  — list admins
 * POST  /api/admin/team  — invite a new admin (creates row with
 *                          random temporary password; the JWT login
 *                          flow is unchanged; the owner can share the
 *                          password manually for v1)
 */
import { NextRequest } from "next/server";
import { randomInt } from "node:crypto";
import { z } from "zod";
import { asyncHandler } from "@/lib/handler";
import { created, ok } from "@/lib/responses";
import { checkPermission, hasPermission, ADMIN_ROLES, ROLE_LEVEL, hashPassword, type AdminRole } from "@/lib/auth/rbac";
import { supabaseAdmin } from "@/lib/supabase/server";
import { ConflictError, ForbiddenError } from "@/lib/errors";
import { writeAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";

export const GET = asyncHandler(async () => {
  await checkPermission("manage_team");
  const { data, error } = await supabaseAdmin()
    .from("admins")
    .select("id, email, role, is_active, last_login_at, created_at")
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return ok(data ?? []);
});

function randomPassword(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789abcdefghjkmnpqrstuvwxyz";
  let s = "";
  for (let i = 0; i < 16; i++) s += chars[randomInt(0, chars.length)];
  return s;
}

const createSchema = z.object({
  email: z.string().email(),
  role: z.enum(ADMIN_ROLES as unknown as [string, ...string[]]),
});

export const POST = asyncHandler(async (req: NextRequest) => {
  const admin = await checkPermission("manage_team");
  const body = await req.json().catch(() => ({}));
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid payload" }, { status: 400 });
  }

  // Escalation guard: without the owner-level `*` permission a caller may
  // only invite members strictly below their own role — a manager can
  // never mint an owner/admin.
  const isOwnerLevel = hasPermission(admin.role, "*");
  const newRole = parsed.data.role as AdminRole;
  if (!isOwnerLevel && ROLE_LEVEL[newRole] >= ROLE_LEVEL[admin.role]) {
    throw new ForbiddenError(`Role '${admin.role}' cannot invite a member with role '${newRole}'`);
  }

  const { data: existing } = await supabaseAdmin()
    .from("admins")
    .select("id")
    .eq("email", parsed.data.email)
    .maybeSingle();
  if (existing) throw new ConflictError("Email already in use");

  const password = randomPassword();
  const password_hash = await hashPassword(password);

  const { data, error } = await supabaseAdmin()
    .from("admins")
    .insert({
      email: parsed.data.email,
      role: parsed.data.role,
      password_hash,
      is_active: true,
    })
    .select("id, email, role")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Insert failed");
  await writeAudit(admin, {
    action: "INVITE_TEAM_MEMBER",
    entityType: "admin",
    entityId: data.id,
    metadata: { role: data.role, email: data.email },
  });
  revalidatePath("/admin/team");
  return created({ id: data.id, email: data.email, role: data.role, temporary_password: password });
});
