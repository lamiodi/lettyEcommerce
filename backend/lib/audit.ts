/**
 * Shared audit helper. Centralizes the `audit_logs` insert so every admin
 * action writes the same shape of row.
 */
import { supabaseAdmin } from "@/lib/supabase/server";
import type { AdminClaims } from "@/lib/auth/rbac";

export interface AuditOpts {
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
}

export async function writeAudit(
  admin: AdminClaims | null,
  opts: AuditOpts,
): Promise<void> {
  const { error } = await supabaseAdmin().from("audit_logs").insert({
    admin_id: admin?.sub ?? null,
    action: opts.action,
    entity_type: opts.entityType,
    entity_id: opts.entityId,
    metadata: opts.metadata ?? {},
    ip_address: opts.ipAddress ?? null,
  });
  if (error) {
    // Audit failures must not crash the calling action — log and move on.
    // eslint-disable-next-line no-console
    console.error("[audit] failed to write audit log", { error: error.message, opts });
  }
}
