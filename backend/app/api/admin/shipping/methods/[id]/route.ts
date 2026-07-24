/**
 * PATCH  /api/admin/shipping/methods/:id
 * DELETE /api/admin/shipping/methods/:id
 */
import { NextRequest } from "next/server";
import { z } from "zod";
import { asyncHandler } from "@/lib/handler";
import { ok } from "@/lib/responses";
import { checkPermission } from "@/lib/auth/rbac";
import { supabaseAdmin } from "@/lib/supabase/server";
import { NotFoundError } from "@/lib/errors";
import { writeAudit } from "@/lib/audit";
import { cacheInvalidate } from "@/lib/cache/redis";
import { revalidatePath } from "next/cache";

type Ctx = { params: Promise<{ id: string }> };

const numStr = z.union([z.number().nonnegative(), z.null()]).optional();

const updateSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  description: z.string().max(500).nullable().optional(),
  is_active: z.boolean().optional(),
  rate_ngn: z.number().nonnegative().optional(),
  rate_usd: z.number().nonnegative().optional(),
  rate_eur: z.number().nonnegative().optional(),
  rate_gbp: z.number().nonnegative().optional(),
  rate_ghs: z.number().nonnegative().optional(),
  rate_zar: z.number().nonnegative().optional(),
  rate_kes: z.number().nonnegative().optional(),
  free_over_ngn: numStr,
  free_over_usd: numStr,
  free_over_eur: numStr,
  free_over_gbp: numStr,
  free_over_ghs: numStr,
  free_over_zar: numStr,
  free_over_kes: numStr,
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
    .from("shipping_methods")
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("id")
    .single();
  if (error || !data) throw new NotFoundError("Method not found");
  await writeAudit(admin, { action: "UPDATE_SHIPPING_METHOD", entityType: "shipping_method", entityId: data.id, metadata: parsed.data });
  await cacheInvalidate("shipping:methods:");
  revalidatePath("/admin/shipping");
  return ok(data);
});

export const DELETE = asyncHandler(async (_req: NextRequest, ctx: Ctx) => {
  const admin = await checkPermission("delete");
  const { id } = await ctx.params;
  const { data, error } = await supabaseAdmin()
    .from("shipping_methods")
    .delete()
    .eq("id", id)
    .select("id")
    .single();
  if (error || !data) throw new NotFoundError("Method not found");
  await writeAudit(admin, { action: "DELETE_SHIPPING_METHOD", entityType: "shipping_method", entityId: data.id });
  await cacheInvalidate("shipping:methods:");
  revalidatePath("/admin/shipping");
  return ok({ id: data.id });
});
