/**
 * GET   /api/admin/tax
 * POST  /api/admin/tax
 */
import { NextRequest } from "next/server";
import { z } from "zod";
import { asyncHandler } from "@/lib/handler";
import { created, ok } from "@/lib/responses";
import { checkPermission } from "@/lib/auth/rbac";
import { supabaseAdmin } from "@/lib/supabase/server";
import { writeAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";

export const GET = asyncHandler(async () => {
  await checkPermission("read");
  const { data, error } = await supabaseAdmin()
    .from("tax_rules")
    .select("id, country, state, rate, is_inclusive, created_at, updated_at")
    .order("country", { ascending: true })
    .order("state", { ascending: true });
  if (error) throw new Error(error.message);
  return ok(data ?? []);
});

const createSchema = z.object({
  country: z.string().length(2),
  state: z.string().max(80).optional().nullable(),
  rate: z.number().min(0).max(100),
  is_inclusive: z.boolean().default(true),
});

export const POST = asyncHandler(async (req: NextRequest) => {
  const admin = await checkPermission("create");
  const body = await req.json().catch(() => ({}));
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
  }
  const { data, error } = await supabaseAdmin()
    .from("tax_rules")
    .insert({
      country: parsed.data.country,
      state: parsed.data.state ?? null,
      rate: parsed.data.rate,
      is_inclusive: parsed.data.is_inclusive,
    })
    .select("id, country, state, rate, is_inclusive")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Insert failed");
  await writeAudit(admin, { action: "CREATE_TAX_RULE", entityType: "tax_rule", entityId: data.id, metadata: parsed.data });
  revalidatePath("/admin/tax");
  return created(data);
});
