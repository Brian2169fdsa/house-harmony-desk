import { supabase } from "@/integrations/supabase/client";

type AuditAction = "INSERT" | "UPDATE" | "DELETE" | "LOGIN" | "LOGOUT" | "INVITE" | "ROLE_CHANGE";

/**
 * Write an application-level audit entry.
 * DB-level changes are handled by Postgres triggers automatically.
 * Use this for higher-level events like logins, invitations, role changes.
 */
export async function logAudit(
  action: AuditAction,
  entityType: string,
  entityId?: string,
  changes?: { old?: Record<string, unknown>; new?: Record<string, unknown> }
) {
  const { data: { user } } = await supabase.auth.getUser();

  await supabase.from("audit_log").insert({
    user_id: user?.id ?? null,
    action,
    entity_type: entityType,
    entity_id: entityId ?? null,
    old_value: changes?.old ?? null,
    new_value: changes?.new ?? null,
  });
}
