/**
 * PATCH  /api/admin/tax/:id
 * DELETE /api/admin/tax/:id
 */
import { NextRequest } from "next/server";
import { z } from "zod";
import { asyncHandler } from "@/lib/handler";
import { ok } from "@/lib/responses";
import { checkPermission } from "@/lib/auth/rbac";
import { supabaseAdmin } from "@/lib/supabase/server";
import { NotFoundError } from "@/lib/errors";
import { writeAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";

type Ctx = { params: Promise<{ id: string }> };

const updateSchema = z.object({
  country: z.string().length(2).optional(),
  state: z.string().max(80).nullable().optional(),
  rate: z.number().min(0).max(100).optional(),
  is_inclusive: z.boolean().optional(),
});

export const PATCH = asyncHandler(async (req: NextRequest, ctx: Ctx) => {
  const admin = await checkPermission("update");
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
  }
  const { data, error } = await supabaseAdmin()
    .from("tax_rules")
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("id, country, state, rate, is_inclusive")
    .single();
  if (error || !data) throw new NotFoundError("Tax rule not found");
  await writeAudit(admin, { action: "UPDATE_TAX_RULE", entityType: "tax_rule", entityId: data.id, metadata: parsed.data });
  revalidatePath("/admin/tax");
  return ok(data);
});

export const DELETE = asyncHandler(async (_req: NextRequest, ctx: Ctx) => {
  const admin = await checkPermission("delete");
  const { id } = await ctx.params;
  const { data, error } = await supabaseAdmin()
    .from("tax_rules")
    .delete()
    .eq("id", id)
    .select("id")
    .single();
  if (error || !data) throw new NotFoundError("Tax rule not found");
  await writeAudit(admin, { action: "DELETE_TAX_RULE", entityType: "tax_rule", entityId: data.id });
  revalidatePath("/admin/tax");
  return ok({ id: data.id });
});
