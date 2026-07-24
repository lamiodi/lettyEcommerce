"use server";

/**
 * Admin account actions.
 */
import { z } from "zod";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { supabaseAdmin } from "@/lib/supabase/server";
import { checkPermission, type AdminClaims } from "@/lib/auth/rbac";
import { adminCreateSchema } from "@/lib/validations";
import { safeAction, type ActionResult } from "@/lib/handler";
import { ConflictError } from "@/lib/errors";
import { writeAudit } from "@/lib/audit";

async function audit(admin: AdminClaims, action: string, entityType: string, entityId: string, metadata: Record<string, unknown> = {}) {
  await writeAudit(admin, { action, entityType, entityId, metadata });
}

export async function createAdminAction(raw: unknown): Promise<ActionResult<{ id: string }>> {
  return safeAction(async () => {
    const admin = await checkPermission("*"); // owner only — see rbac.ts
    const parsed = adminCreateSchema.safeParse(raw);
    if (!parsed.success) throw new Error(parsed.error.message);
    const password_hash = await bcrypt.hash(parsed.data.password, 12);

    const { data, error } = await supabaseAdmin()
      .from("admins")
      .insert({
        email: parsed.data.email,
        password_hash,
        role: parsed.data.role,
        full_name: parsed.data.full_name ?? null,
      })
      .select("id")
      .single();
    if (error || !data) {
      if (error?.code === "23505") throw new ConflictError("Email already in use");
      throw new Error(error?.message ?? "Insert failed");
    }
    await audit(admin, "CREATE_ADMIN", "admin", data.id, { role: parsed.data.role });
    revalidatePath("/admin/team");
    return { id: data.id };
  });
}

const updateRoleSchema = z.object({
  admin_id: z.string().uuid(),
  role: z.enum(["owner", "admin", "manager", "inventory", "support", "marketing", "editor"]),
  is_active: z.boolean().optional(),
});

export async function updateAdminRoleAction(raw: unknown) {
  return safeAction(async () => {
    const admin = await checkPermission("*");
    const parsed = updateRoleSchema.safeParse(raw);
    if (!parsed.success) throw new Error(parsed.error.message);
    const { admin_id, role, is_active } = parsed.data;
    if (admin_id === admin.sub) throw new ConflictError("Cannot modify your own account");
    const { data, error } = await supabaseAdmin()
      .from("admins")
      .update({ role, ...(is_active != null ? { is_active } : {}) })
      .eq("id", admin_id)
      .select("id")
      .single();
    if (error || !data) throw new Error(error?.message ?? "Update failed");
    await audit(admin, "UPDATE_ADMIN_ROLE", "admin", data.id, { role });
    revalidatePath("/admin/team");
    return { id: data.id };
  });
}
