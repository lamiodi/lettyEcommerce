/**
 * DELETE /api/admin/newsletter/:id
 * PATCH  /api/admin/newsletter/:id — toggle is_active
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

const updateSchema = z.object({ is_subscribed: z.boolean() });

export const PATCH = asyncHandler(async (req: NextRequest, ctx: Ctx) => {
  const admin = await checkPermission("update");
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: "Invalid payload" }, { status: 400 });
  const patch: Record<string, any> = { is_subscribed: parsed.data.is_subscribed };
  if (!parsed.data.is_subscribed) patch.unsubscribed_at = new Date().toISOString();
  const { data, error } = await supabaseAdmin()
    .from("newsletter_subscribers")
    .update(patch)
    .eq("id", id)
    .select("id")
    .single();
  if (error || !data) throw new NotFoundError("Subscriber not found");
  await writeAudit(admin, { action: "UPDATE_NEWSLETTER", entityType: "newsletter_subscriber", entityId: data.id });
  revalidatePath("/admin/newsletter");
  return ok(data);
});

export const DELETE = asyncHandler(async (_req: NextRequest, ctx: Ctx) => {
  const admin = await checkPermission("delete");
  const { id } = await ctx.params;
  const { data, error } = await supabaseAdmin()
    .from("newsletter_subscribers")
    .delete()
    .eq("id", id)
    .select("id")
    .single();
  if (error || !data) throw new NotFoundError("Subscriber not found");
  await writeAudit(admin, { action: "DELETE_NEWSLETTER", entityType: "newsletter_subscriber", entityId: data.id });
  revalidatePath("/admin/newsletter");
  return ok({ id: data.id });
});
