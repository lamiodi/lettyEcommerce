/**
 * GET   /api/admin/settings
 * PATCH /api/admin/settings  — upsert one or more settings
 */
import { NextRequest } from "next/server";
import { z } from "zod";
import { asyncHandler } from "@/lib/handler";
import { ok } from "@/lib/responses";
import { checkPermission } from "@/lib/auth/rbac";
import { supabaseAdmin } from "@/lib/supabase/server";
import { writeAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";

const KNOWN_KEYS = ["store", "contact", "shipping", "payments", "marketing"] as const;

export const GET = asyncHandler(async () => {
  await checkPermission("read");
  const { data, error } = await supabaseAdmin()
    .from("app_settings")
    .select("key, value, description, updated_at")
    .in("key", [...KNOWN_KEYS])
    .order("key");
  if (error) throw new Error(error.message);
  // Materialize as an object keyed by key.
  const out: Record<string, { value: any; description: string | null; updated_at: string }> = {};
  for (const k of KNOWN_KEYS) {
    const row = (data ?? []).find((r) => r.key === k);
    out[k] = row
      ? { value: row.value, description: row.description, updated_at: row.updated_at }
      : { value: null, description: null, updated_at: "" };
  }
  return ok(out);
});

const updateSchema = z.object({
  store: z.record(z.unknown()).optional(),
  contact: z.record(z.unknown()).optional(),
  shipping: z.record(z.unknown()).optional(),
  payments: z.record(z.unknown()).optional(),
  marketing: z.record(z.unknown()).optional(),
});

export const PATCH = asyncHandler(async (req: NextRequest) => {
  const admin = await checkPermission("update");
  const body = await req.json().catch(() => ({}));
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid payload" }, { status: 400 });
  }
  for (const [key, value] of Object.entries(parsed.data)) {
    if (!value) continue;
    await supabaseAdmin()
      .from("app_settings")
      .upsert({ key, value, updated_at: new Date().toISOString() });
    await writeAudit(admin, { action: "UPDATE_SETTING", entityType: "setting", entityId: key });
  }
  revalidatePath("/admin/settings");
  return ok({ ok: true });
});
