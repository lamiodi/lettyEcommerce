/**
 * GET   /api/admin/newsletter?query=&cursor=&limit=
 * POST  /api/admin/newsletter  — manual subscribe
 * DELETE /api/admin/newsletter/:id
 */
import { NextRequest } from "next/server";
import { z } from "zod";
import { asyncHandler } from "@/lib/handler";
import { created, ok, paginated } from "@/lib/responses";
import { checkPermission } from "@/lib/auth/rbac";
import { supabaseAdmin } from "@/lib/supabase/server";
import { ConflictError, NotFoundError } from "@/lib/errors";
import { writeAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";

const querySchema = z.object({
  query: z.string().max(200).optional(),
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

export const GET = asyncHandler(async (req: NextRequest) => {
  await checkPermission("read");
  const params = Object.fromEntries(new URL(req.url).searchParams.entries());
  const parsed = querySchema.safeParse(params);
  if (!parsed.success) return Response.json({ error: "Invalid query" }, { status: 400 });
  const { query, cursor, limit } = parsed.data;

  let q = supabaseAdmin()
    .from("newsletter_subscribers")
    .select("id, email, source, is_subscribed, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .limit(limit);
  if (cursor) q = q.lt("id", cursor);
  if (query) {
    const safe = query.replace(/[%_]/g, "\\$&");
    q = q.ilike("email", `%${safe}%`);
  }
  const { data, count } = await q;
  return paginated(data ?? [], count ?? 0, 1, limit);
});

const createSchema = z.object({
  email: z.string().email(),
  source: z.string().max(80).optional().nullable(),
});

export const POST = asyncHandler(async (req: NextRequest) => {
  const admin = await checkPermission("create");
  const body = await req.json().catch(() => ({}));
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid payload" }, { status: 400 });
  }
  const { data: existing } = await supabaseAdmin()
    .from("newsletter_subscribers")
    .select("id")
    .eq("email", parsed.data.email)
    .maybeSingle();
  if (existing) throw new ConflictError("Already subscribed");
  const { data, error } = await supabaseAdmin()
    .from("newsletter_subscribers")
    .insert({ email: parsed.data.email, source: parsed.data.source ?? "admin" })
    .select("id, email")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Insert failed");
  await writeAudit(admin, { action: "ADD_NEWSLETTER", entityType: "newsletter_subscriber", entityId: data.id });
  revalidatePath("/admin/newsletter");
  return created(data);
});
