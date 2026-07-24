"use server";

/**
 * Admin review moderation.
 */
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/server";
import { checkPermission, type AdminClaims } from "@/lib/auth/rbac";
import { safeAction, type ActionResult } from "@/lib/handler";
import { NotFoundError } from "@/lib/errors";
import { writeAudit } from "@/lib/audit";

async function audit(admin: AdminClaims, action: string, entityType: string, entityId: string, metadata: Record<string, unknown> = {}) {
  await writeAudit(admin, { action, entityType, entityId, metadata });
}

export async function approveReviewAction(reviewId: string) {
  return safeAction(async () => {
    const admin = await checkPermission("read");
    const { data, error } = await supabaseAdmin()
      .from("reviews")
      .update({ is_approved: true, approved_at: new Date().toISOString(), approved_by: admin.sub })
      .eq("id", reviewId)
      .select("id, product_id")
      .single();
    if (error || !data) throw new NotFoundError("Review not found");

    await audit(admin, "APPROVE_REVIEW", "review", reviewId);
    revalidatePath("/admin/reviews");
    revalidatePath(`/product/${data.product_id}`);
    return { id: reviewId };
  });
}

export async function rejectReviewAction(reviewId: string) {
  return safeAction(async () => {
    const admin = await checkPermission("read");
    const { error } = await supabaseAdmin().from("reviews").delete().eq("id", reviewId);
    if (error) throw new Error(error.message);
    await audit(admin, "REJECT_REVIEW", "review", reviewId);
    revalidatePath("/admin/reviews");
    return { id: reviewId };
  });
}
