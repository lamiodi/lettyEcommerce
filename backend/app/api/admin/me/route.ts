/**
 * GET /api/admin/me — returns the currently authenticated admin.
 */
import { NextRequest } from "next/server";
import { asyncHandler } from "@/lib/handler";
import { ok } from "@/lib/responses";
import { requireAdmin } from "@/lib/auth/rbac";

export const GET = asyncHandler(async (_req: NextRequest) => {
  const admin = await requireAdmin();
  return ok({
    id: admin.sub,
    email: admin.email,
    role: admin.role,
  });
});
