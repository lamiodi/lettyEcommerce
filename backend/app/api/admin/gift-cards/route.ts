/**
 * GET   /api/admin/gift-cards
 * POST  /api/admin/gift-cards — manually issue a card
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
    .from("gift_cards")
    .select("id, code, initial_balance, current_balance, currency, recipient_email, recipient_name, status, expires_at, created_at")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw new Error(error.message);
  return ok(data ?? []);
});

const createSchema = z.object({
  initial_balance: z.number().positive(),
  currency: z.enum(["NGN", "USD", "EUR", "GBP", "GHS", "ZAR", "KES"]),
  recipient_email: z.string().email(),
  recipient_name: z.string().min(1).max(120).optional().nullable(),
  message: z.string().max(500).optional().nullable(),
  expires_at: z.string().datetime().optional().nullable(),
});

function randomCode(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 12; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return `LETY-${s.slice(0, 4)}-${s.slice(4, 8)}-${s.slice(8, 12)}`;
}

export const POST = asyncHandler(async (req: NextRequest) => {
  const admin = await checkPermission("create");
  const body = await req.json().catch(() => ({}));
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid payload" }, { status: 400 });
  }
  const code = randomCode();
  const { data, error } = await supabaseAdmin()
    .from("gift_cards")
    .insert({
      code,
      initial_balance: parsed.data.initial_balance,
      current_balance: parsed.data.initial_balance,
      currency: parsed.data.currency,
      recipient_email: parsed.data.recipient_email,
      recipient_name: parsed.data.recipient_name ?? null,
      message: parsed.data.message ?? null,
      expires_at: parsed.data.expires_at ?? null,
      status: "active",
    })
    .select("id, code")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Insert failed");
  await writeAudit(admin, { action: "ISSUE_GIFT_CARD", entityType: "gift_card", entityId: data.id, metadata: { amount: parsed.data.initial_balance, currency: parsed.data.currency } });
  revalidatePath("/admin/gift-cards");
  return created(data);
});
