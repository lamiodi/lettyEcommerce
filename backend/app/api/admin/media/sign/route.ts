/**
 * POST /api/admin/media/sign
 *
 * Issue a signed Supabase Storage upload URL for an admin user. The
 * admin authenticates via the JWT cookie; only owners / admins (with
 * the `update_products` permission) can sign URLs.
 *
 * Body: { bucket, filename, contentType, size }
 * Response: { data: { signedUrl, publicUrl, token } }
 *
 * The signed URL is short-lived; the client uploads directly to the
 * Supabase bucket using it, then uses `publicUrl` to render the asset.
 */
import { NextRequest } from "next/server";
import { z } from "zod";
import { asyncHandler } from "@/lib/handler";
import { checkPermission } from "@/lib/auth/rbac";
import { supabaseAdmin } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

const schema = z.object({
  bucket: z.string().min(1).max(64),
  filename: z.string().min(1).max(255),
  contentType: z.string().min(1).max(120),
  size: z.number().int().positive().max(25 * 1024 * 1024), // 25MB cap
});

const ALLOWED_BUCKETS = new Set([
  "product-media",
  "variant-media",
  "editor-media",
  "site-assets",
]);

export const POST = asyncHandler(async (req: NextRequest) => {
  await checkPermission("update_products");

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid sign request", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const { bucket, filename, contentType, size } = parsed.data;
  if (!ALLOWED_BUCKETS.has(bucket)) {
    return Response.json({ error: "Bucket not allowed" }, { status: 400 });
  }
  if (!contentType.startsWith("image/")) {
    return Response.json({ error: "Only images allowed" }, { status: 400 });
  }

  // Path convention: <bucket>/<yyyy>/<mm>/<uuid>-<slug>
  const now = new Date();
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  const safe = filename
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
  const path = `${yyyy}/${mm}/${crypto.randomUUID()}-${safe}`;

  const sb = supabaseAdmin();
  const { data, error } = await sb.storage.from(bucket).createSignedUploadUrl(path);
  if (error || !data) {
    logger.error({ error, bucket, path }, "createSignedUploadUrl failed");
    return Response.json({ error: error?.message ?? "Sign failed" }, { status: 500 });
  }

  const {
    data: { publicUrl },
  } = sb.storage.from(bucket).getPublicUrl(path);

  return Response.json({ data: { signedUrl: data.signedUrl, publicUrl, token: data.token } });
});
