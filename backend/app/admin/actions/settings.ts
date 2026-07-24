"use server";

/**
 * Admin settings actions.
 */
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/server";
import { checkPermission, type AdminClaims } from "@/lib/auth/rbac";
import { cacheInvalidate } from "@/lib/cache/redis";
import { safeAction, type ActionResult } from "@/lib/handler";

const upsertSchema = z.object({
  key: z.string().min(1).max(80),
  value: z.unknown(),
  description: z.string().max(400).optional().nullable(),
});

export async function upsertSettingAction(
  raw: unknown,
): Promise<ActionResult<{ key: string }>> {
  return safeAction(async () => {
    const admin = await checkPermission("manage_settings");
    const parsed = upsertSchema.safeParse(raw);
    if (!parsed.success) throw new Error(parsed.error.message);

    const { data, error } = await supabaseAdmin()
      .from("settings")
      .upsert(
        {
          key: parsed.data.key,
          value: parsed.data.value,
          description: parsed.data.description ?? null,
          updated_by: admin.sub,
        },
        { onConflict: "key" },
      )
      .select("key")
      .single();
    if (error || !data) throw new Error(error?.message ?? "Upsert failed");

    await supabaseAdmin().from("audit_logs").insert({
      admin_id: admin.sub,
      action: "UPSERT_SETTING",
      entity_type: "setting",
      entity_id: data.key,
      metadata: { value: parsed.data.value },
    });

    await cacheInvalidate("settings:");
    revalidatePath("/admin/settings");
    return { key: data.key };
  });
}
