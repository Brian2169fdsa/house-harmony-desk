import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Users, Plus, MoreHorizontal, Mail } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useUserRole, StaffRole } from "@/contexts/UserRoleContext";
import { RoleGuard } from "@/components/RoleGuard";
import { logAudit } from "@/lib/audit";

const ROLES: { value: StaffRole; label: string }[] = [
  { value: "owner", label: "Owner" },
  { value: "regional_manager", label: "Regional Manager" },
  { value: "house_manager", label: "House Manager" },
  { value: "staff", label: "Staff" },
  { value: "investor", label: "Investor (Read-Only)" },
];

const ROLE_COLORS: Record<string, string> = {
  owner: "bg-purple-100 text-purple-800",
  regional_manager: "bg-blue-100 text-blue-800",
  house_manager: "bg-green-100 text-green-800",
  staff: "bg-gray-100 text-gray-800",
  investor: "bg-yellow-100 text-yellow-800",
};

export default function Staff() {
  const queryClient = useQueryClient();
  const { profile: currentProfile } = useUserRole();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<StaffRole>("staff");

  const { data: staffList, isLoading } = useQuery({
    queryKey: ["staff_profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("staff_profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: invitations } = useQuery({
    queryKey: ["staff_invitations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("staff_invitations")
        .select("*")
        .is("accepted_at", null)
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const sendInvite = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from("staff_invitations").insert({
        email: inviteEmail.trim().toLowerCase(),
        role: inviteRole,
        invited_by: user?.id ?? null,
      });
      if (error) throw error;
      await logAudit("INVITE", "staff_invitations", undefined, {
        new: { email: inviteEmail, role: inviteRole },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff_invitations"] });
      toast({ title: `Invitation recorded for ${inviteEmail}` });
      setInviteOpen(false);
      setInviteEmail("");
      setInviteRole("staff");
    },
    onError: (err: any) => {
      toast({ title: err.message || "Failed to send invitation", variant: "destructive" });
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("staff_profiles")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff_profiles"] });
      toast({ title: "Staff status updated" });
    },
  });

  const updateRole = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: StaffRole }) => {
      const { error } = await supabase
        .from("staff_profiles")
        .update({ role })
        .eq("id", id);
      if (error) throw error;
      await logAudit("ROLE_CHANGE", "staff_profiles", id, { new: { role } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff_profiles"] });
      toast({ title: "Role updated" });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="h-8 w-8" />
            Staff Management
          </h1>
          <p className="text-muted-foreground">Manage team members, roles, and invitations</p>
        </div>
        <RoleGuard roles={["owner", "regional_manager"]}>
          <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Invite Staff
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle>Invite Team Member</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Email Address</Label>
                  <Input
                    type="email"
                    placeholder="jane@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Role</Label>
                  <Select
                    value={inviteRole}
                    onValueChange={(v) => setInviteRole(v as StaffRole)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLES.map((r) => (
                        <SelectItem key={r.value} value={r.value}>
                          {r.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  className="w-full"
                  onClick={() => sendInvite.mutate()}
                  disabled={!inviteEmail.trim() || sendInvite.isPending}
                >
                  <Mail className="mr-2 h-4 w-4" />
                  {sendInvite.isPending ? "Sending…" : "Send Invitation"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </RoleGuard>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {ROLES.map((r) => {
          const count = staffList?.filter((s) => s.role === r.value && s.status === "active").length ?? 0;
          return (
            <Card key={r.value}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{r.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{count}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Active Staff */}
      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Loading…</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Hire Date</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staffList && staffList.length > 0 ? (
                  staffList.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">
                        {member.full_name || "—"}
                        {member.user_id === currentProfile?.user_id && (
                          <span className="ml-2 text-xs text-muted-foreground">(you)</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            ROLE_COLORS[member.role] ?? "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {ROLES.find((r) => r.value === member.role)?.label ?? member.role}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            member.status === "active"
                              ? "default"
                              : member.status === "suspended"
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {member.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{member.hire_date ?? "—"}</TableCell>
                      <TableCell>
                        <RoleGuard roles={["owner", "regional_manager"]}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {ROLES.map((r) => (
                                <DropdownMenuItem
                                  key={r.value}
                                  onClick={() =>
                                    updateRole.mutate({ id: member.id, role: r.value })
                                  }
                                >
                                  Set role: {r.label}
                                </DropdownMenuItem>
                              ))}
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() =>
                                  updateStatus.mutate({
                                    id: member.id,
                                    status:
                                      member.status === "active" ? "inactive" : "active",
                                  })
                                }
                              >
                                {member.status === "active" ? "Deactivate" : "Reactivate"}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </RoleGuard>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No staff profiles yet. Invite team members to get started.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pending Invitations */}
      {invitations && invitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Invitations</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Expires</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invitations.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell>{inv.email}</TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {ROLES.find((r) => r.value === inv.role)?.label ?? inv.role}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(inv.expires_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
