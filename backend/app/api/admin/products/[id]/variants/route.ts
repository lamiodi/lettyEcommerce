/**
 * GET   /api/admin/products/:id/variants — list variants for a product
 * POST  /api/admin/products/:id/variants — create a variant
 */
import { NextRequest } from "next/server";
import { z } from "zod";
import { asyncHandler } from "@/lib/handler";
import { created, ok } from "@/lib/responses";
import { checkPermission } from "@/lib/auth/rbac";
import { supabaseAdmin } from "@/lib/supabase/server";
import { NotFoundError, ConflictError } from "@/lib/errors";
import { writeAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";

type Ctx = { params: Promise<{ id: string }> };

export const GET = asyncHandler(async (_req: NextRequest, ctx: Ctx) => {
  await checkPermission("read");
  const { id } = await ctx.params;
  const { data, error } = await supabaseAdmin()
    .from("product_variants")
    .select(
      `id, sku, barcode, price_override_ngn, price_override_usd, weight_grams,
       stock_quantity, reserved_quantity, low_stock_threshold, is_active, position,
       variant_options (id, option_name, option_value)`,
    )
    .eq("product_id", id)
    .order("position", { ascending: true });
  if (error) throw new Error(error.message);
  return ok(data ?? []);
});

const optionSchema = z.object({
  option_name: z.string().min(1).max(60),
  option_value: z.string().min(1).max(120),
});

const createSchema = z.object({
  sku: z.string().min(1).max(80),
  barcode: z.string().max(80).optional().nullable(),
  price_override_ngn: z.number().nonnegative().optional().nullable(),
  price_override_usd: z.number().nonnegative().optional().nullable(),
  weight_grams: z.number().int().nonnegative().optional().nullable(),
  stock_quantity: z.number().int().nonnegative().default(0),
  low_stock_threshold: z.number().int().nonnegative().default(5),
  is_active: z.boolean().default(true),
  position: z.number().int().default(0),
  options: z.array(optionSchema).max(8).default([]),
});

export const POST = asyncHandler(async (req: NextRequest, ctx: Ctx) => {
  const admin = await checkPermission("create");
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
  }

  const { options, ...variantData } = parsed.data;

  // Check product exists and isn't deleted.
  const { data: product } = await supabaseAdmin()
    .from("products")
    .select("id")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();
  if (!product) throw new NotFoundError("Product not found");

  // Check SKU uniqueness.
  const { data: existingSku } = await supabaseAdmin()
    .from("product_variants")
    .select("id")
    .eq("sku", variantData.sku)
    .maybeSingle();
  if (existingSku) throw new ConflictError("SKU already in use");

  const { data: variant, error } = await supabaseAdmin()
    .from("product_variants")
    .insert({ ...variantData, product_id: id })
    .select("id, sku")
    .single();
  if (error || !variant) throw new Error(error?.message ?? "Insert failed");

  if (options.length > 0) {
    await supabaseAdmin()
      .from("variant_options")
      .insert(options.map((o) => ({ ...o, variant_id: variant.id })));
  }

  await writeAudit(admin, {
    action: "CREATE_VARIANT",
    entityType: "product_variant",
    entityId: variant.id,
    metadata: { sku: variant.sku, product_id: id },
  });
  revalidatePath("/admin/products");
  return created({ id: variant.id, sku: variant.sku });
});
