import { ReactNode } from "react";
import { useUserRole, StaffRole } from "@/contexts/UserRoleContext";
import { ShieldX } from "lucide-react";

interface RoleGuardProps {
  /** Roles that are allowed to see the children */
  roles: StaffRole[];
  children: ReactNode;
  /** Custom message shown when access is denied */
  message?: string;
}

/**
 * Wraps content that requires specific role(s).
 * If the current user's role is not in the allowed list, an access-denied
 * placeholder is shown instead.
 *
 * Note: if the user has no staff_profile yet (e.g. they haven't been
 * assigned a role) we fall back to showing the content — this keeps the
 * app usable before RBAC is fully configured.
 */
export function RoleGuard({ roles, children, message }: RoleGuardProps) {
  const { role, loading } = useUserRole();

  // While loading, show nothing (avoids flash)
  if (loading) return null;

  // If no profile exists yet, allow access (graceful fallback)
  if (!role) return <>{children}</>;

  if (!roles.includes(role)) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
        <ShieldX className="h-12 w-12 text-muted-foreground" />
        <p className="text-lg font-semibold">Access Restricted</p>
        <p className="text-sm text-muted-foreground max-w-xs">
          {message ?? "Your role does not have permission to view this section."}
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
