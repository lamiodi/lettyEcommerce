"use server";

/**
 * Admin CMS section actions.
 */
import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/server";
import { checkPermission, type AdminClaims } from "@/lib/auth/rbac";
import { cmsSectionSchema } from "@/lib/validations";
import { cacheInvalidate } from "@/lib/cache/redis";
import { safeAction, type ActionResult } from "@/lib/handler";
import { NotFoundError } from "@/lib/errors";
import { writeAudit } from "@/lib/audit";

async function audit(admin: AdminClaims, action: string, entityType: string, entityId: string, metadata: Record<string, unknown> = {}) {
  await writeAudit(admin, { action, entityType, entityId, metadata });
}

export async function createCmsSectionAction(raw: unknown): Promise<ActionResult<{ id: string }>> {
  return safeAction(async () => {
    const admin = await checkPermission("manage_cms");
    const parsed = cmsSectionSchema.safeParse(raw);
    if (!parsed.success) throw new Error(parsed.error.message);
    const { data, error } = await supabaseAdmin()
      .from("cms_sections")
      .insert(parsed.data)
      .select("id, page_type")
      .single();
    if (error || !data) throw new Error(error?.message ?? "Insert failed");
    await audit(admin, "CREATE_CMS_SECTION", "cms_section", data.id, { page: data.page_type });
    await cacheInvalidate(`cms:page:${data.page_type}`);
    revalidatePath("/admin/cms");
    return { id: data.id };
  });
}

export async function updateCmsSectionAction(id: string, raw: unknown) {
  return safeAction(async () => {
    const admin = await checkPermission("manage_cms");
    const parsed = cmsSectionSchema.partial().safeParse(raw);
    if (!parsed.success) throw new Error(parsed.error.message);
    const { data, error } = await supabaseAdmin()
      .from("cms_sections")
      .update({ ...parsed.data, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("id, page_type")
      .single();
    if (error || !data) throw new NotFoundError("Section not found");
    await audit(admin, "UPDATE_CMS_SECTION", "cms_section", data.id);
    await cacheInvalidate(`cms:page:${data.page_type}`);
    revalidatePath("/admin/cms");
    return { id: data.id };
  });
}

export async function deleteCmsSectionAction(id: string) {
  return safeAction(async () => {
    const admin = await checkPermission("manage_cms");
    const { data, error } = await supabaseAdmin()
      .from("cms_sections")
      .delete()
      .eq("id", id)
      .select("id, page_type")
      .single();
    if (error || !data) throw new NotFoundError("Section not found");
    await audit(admin, "DELETE_CMS_SECTION", "cms_section", data.id);
    await cacheInvalidate(`cms:page:${data.page_type}`);
    revalidatePath("/admin/cms");
    return { id: data.id };
  });
}
