import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  Plus,
  CheckCircle2,
  Clock,
  AlertTriangle,
  MessageSquare,
  Home,
  Shield,
  ChevronDown,
  ChevronUp,
  Trash2,
  Calendar,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { format, parseISO, isPast } from "date-fns";

// ─── Types ────────────────────────────────────────────────────────────────────

interface EngagementLog {
  id: string;
  contact_type: string;
  contact_name: string | null;
  contact_address: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  contact_role: string | null;
  contact_date: string;
  description: string;
  outcome: string | null;
  follow_up_date: string | null;
  follow_up_notes: string | null;
  status: string;
  accommodation_requested: string | null;
  accommodation_granted: boolean | null;
  accommodation_denied_reason: string | null;
  created_at: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CONTACT_TYPES: { value: string; label: string; icon: React.ElementType; color: string; description: string }[] = [
  {
    value: "neighbor_outreach",
    label: "Neighbor Outreach",
    icon: Home,
    color: "text-blue-600",
    description: "Proactive outreach to neighboring properties to build goodwill.",
  },
  {
    value: "complaint",
    label: "Complaint Received",
    icon: AlertTriangle,
    color: "text-red-600",
    description: "A neighbor, HOA, or city official has raised a concern.",
  },
  {
    value: "reasonable_accommodation",
    label: "Reasonable Accommodation",
    icon: Shield,
    color: "text-purple-600",
    description: "FHA reasonable accommodation request or deviation from spacing/zoning rules.",
  },
  {
    value: "community_meeting",
    label: "Community Meeting",
    icon: Users,
    color: "text-green-600",
    description: "Neighborhood meeting, HOA meeting, or city council appearance.",
  },
  {
    value: "city_contact",
    label: "City / Planning Contact",
    icon: MessageSquare,
    color: "text-amber-600",
    description: "Contact with city planning, zoning, or licensing department.",
  },
  {
    value: "other",
    label: "Other",
    icon: Info,
    color: "text-muted-foreground",
    description: "Any other community engagement activity.",
  },
];

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  open: { label: "Open", variant: "secondary" },
  in_progress: { label: "In Progress", variant: "default" },
  resolved: { label: "Resolved", variant: "default" },
  escalated: { label: "Escalated", variant: "destructive" },
  closed: { label: "Closed", variant: "outline" },
};

const CONTACT_ROLES = [
  { value: "neighbor", label: "Neighbor" },
  { value: "city_official", label: "City Official" },
  { value: "hoa", label: "HOA" },
  { value: "planning_dept", label: "Planning Department" },
  { value: "community_org", label: "Community Organization" },
  { value: "other", label: "Other" },
];

const defaultForm = {
  contact_type: "",
  contact_name: "",
  contact_address: "",
  contact_phone: "",
  contact_email: "",
  contact_role: "",
  contact_date: new Date().toISOString().split("T")[0],
  description: "",
  outcome: "",
  follow_up_date: "",
  follow_up_notes: "",
  status: "open",
  accommodation_requested: "",
  accommodation_granted: "",
  accommodation_denied_reason: "",
};

// ─── Log Card ─────────────────────────────────────────────────────────────────

function LogCard({
  log,
  onStatusChange,
  onDelete,
}: {
  log: EngagementLog;
  onStatusChange: (id: string, status: string) => void;
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const typeInfo = CONTACT_TYPES.find((t) => t.value === log.contact_type) ?? CONTACT_TYPES[CONTACT_TYPES.length - 1];
  const TypeIcon = typeInfo.icon;
  const statusCfg = STATUS_CONFIG[log.status] ?? STATUS_CONFIG.open;
  const followUpOverdue = log.follow_up_date && log.status !== "resolved" && log.status !== "closed" && isPast(parseISO(log.follow_up_date));

  return (
    <Card className={`transition-all ${log.contact_type === "complaint" && log.status === "open" ? "border-red-300" : ""} ${followUpOverdue ? "border-amber-300" : ""}`}>
      <CardContent className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className={`mt-0.5 shrink-0 rounded-full bg-muted p-1.5`}>
              <TypeIcon className={`h-4 w-4 ${typeInfo.color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                <span className="font-semibold text-sm">{typeInfo.label}</span>
                <Badge variant={statusCfg.variant} className="text-xs">{statusCfg.label}</Badge>
                {followUpOverdue && (
                  <Badge variant="destructive" className="text-xs">Follow-up Overdue</Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {format(parseISO(log.contact_date), "MMM d, yyyy")}
                {log.contact_name && ` · ${log.contact_name}`}
                {log.contact_address && ` · ${log.contact_address}`}
              </p>
              <p className="text-sm mt-1 line-clamp-2">{log.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setExpanded((e) => !e)}>
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-red-600"
              onClick={() => { if (confirm("Delete this log entry?")) onDelete(log.id); }}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {log.outcome && (
          <p className="text-xs text-muted-foreground pl-10"><span className="font-medium">Outcome:</span> {log.outcome}</p>
        )}

        {log.follow_up_date && (
          <p className={`text-xs pl-10 ${followUpOverdue ? "text-amber-700 font-medium" : "text-muted-foreground"}`}>
            <Calendar className="h-3 w-3 inline mr-1" />
            Follow-up: {format(parseISO(log.follow_up_date), "MMM d, yyyy")}
            {followUpOverdue && " — OVERDUE"}
          </p>
        )}

        {expanded && (
          <div className="space-y-3 pt-2 pl-10">
            <Separator />

            {log.contact_phone && (
              <p className="text-xs"><span className="font-medium text-muted-foreground">Phone:</span> {log.contact_phone}</p>
            )}
            {log.contact_email && (
              <p className="text-xs"><span className="font-medium text-muted-foreground">Email:</span> {log.contact_email}</p>
            )}
            {log.contact_role && (
              <p className="text-xs"><span className="font-medium text-muted-foreground">Role:</span> {CONTACT_ROLES.find((r) => r.value === log.contact_role)?.label ?? log.contact_role}</p>
            )}
            {log.follow_up_notes && (
              <p className="text-xs"><span className="font-medium text-muted-foreground">Follow-up notes:</span> {log.follow_up_notes}</p>
            )}

            {log.contact_type === "reasonable_accommodation" && (
              <div className="space-y-1 p-3 rounded-lg bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200">
                <p className="text-xs font-medium text-purple-800">FHA Reasonable Accommodation</p>
                {log.accommodation_requested && (
                  <p className="text-xs"><span className="font-medium text-muted-foreground">Requested:</span> {log.accommodation_requested}</p>
                )}
                {log.accommodation_granted !== null && (
                  <p className="text-xs">
                    <span className="font-medium text-muted-foreground">Decision:</span>{" "}
                    <span className={log.accommodation_granted ? "text-green-700" : "text-red-700"}>
                      {log.accommodation_granted ? "Granted" : "Denied"}
                    </span>
                  </p>
                )}
                {!log.accommodation_granted && log.accommodation_denied_reason && (
                  <p className="text-xs"><span className="font-medium text-muted-foreground">Reason:</span> {log.accommodation_denied_reason}</p>
                )}
              </div>
            )}

            <div className="flex items-center gap-2">
              <Label className="text-xs w-16 shrink-0">Status</Label>
              <Select value={log.status} onValueChange={(v) => onStatusChange(log.id, v)}>
                <SelectTrigger className="h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_CONFIG).map(([v, c]) => (
                    <SelectItem key={v} value={v} className="text-xs">{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CommunityEngagement() {
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["community_engagement"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("community_engagement_log")
        .select("*")
        .eq("user_id", user?.id)
        .order("contact_date", { ascending: false });
      if (error) throw error;
      return (data ?? []) as EngagementLog[];
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      if (!form.contact_type) throw new Error("Select a contact type");
      if (!form.description.trim()) throw new Error("Enter a description");
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from("community_engagement_log").insert({
        user_id: user?.id,
        contact_type: form.contact_type,
        contact_name: form.contact_name || null,
        contact_address: form.contact_address || null,
        contact_phone: form.contact_phone || null,
        contact_email: form.contact_email || null,
        contact_role: form.contact_role || null,
        contact_date: form.contact_date,
        description: form.description.trim(),
        outcome: form.outcome || null,
        follow_up_date: form.follow_up_date || null,
        follow_up_notes: form.follow_up_notes || null,
        status: form.status,
        accommodation_requested: form.accommodation_requested || null,
        accommodation_granted: form.accommodation_granted === "true" ? true : form.accommodation_granted === "false" ? false : null,
        accommodation_denied_reason: form.accommodation_denied_reason || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community_engagement"] });
      setShowAdd(false);
      setForm(defaultForm);
      toast.success("Log entry added");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("community_engagement_log")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["community_engagement"] }),
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("community_engagement_log").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["community_engagement"] }),
    onError: (e: any) => toast.error(e.message),
  });

  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  const filtered = logs.filter((l) => {
    const typeMatch = filterType === "all" || l.contact_type === filterType;
    const statusMatch = filterStatus === "all" || l.status === filterStatus;
    return typeMatch && statusMatch;
  });

  // KPIs
  const openComplaints = logs.filter((l) => l.contact_type === "complaint" && l.status === "open").length;
  const pendingRAs = logs.filter((l) => l.contact_type === "reasonable_accommodation" && l.status === "open").length;
  const followUpsDue = logs.filter((l) => l.follow_up_date && l.status !== "resolved" && l.status !== "closed" && isPast(parseISO(l.follow_up_date))).length;
  const outreachCount = logs.filter((l) => l.contact_type === "neighbor_outreach").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Community Engagement</h1>
          <p className="text-muted-foreground">Neighbor outreach, complaint resolution, and FHA reasonable accommodation tracking</p>
        </div>
        <Button onClick={() => setShowAdd(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Log Contact
        </Button>
      </div>

      {/* Context banner */}
      <Card className="border-blue-200 bg-blue-50/40 dark:bg-blue-950/20">
        <CardContent className="p-4 text-xs text-blue-900 dark:text-blue-200 space-y-1">
          <p className="font-semibold">Phoenix / Maricopa County NIMBY Mitigation</p>
          <p>Phoenix (2024) tightened rules to discourage clustering. Arizona requires municipalities with spacing/distance rules to provide a <strong>reasonable accommodation deviation process</strong> (FHA framework). Early neighbor outreach + clear operational policies (noise, parking, supervision, complaint resolution) reduce enforcement friction. Document every contact.</p>
        </CardContent>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className={openComplaints > 0 ? "border-red-300" : ""}>
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className={`h-8 w-8 shrink-0 ${openComplaints > 0 ? "text-red-500" : "text-muted-foreground"}`} />
            <div>
              <p className="text-2xl font-bold">{openComplaints}</p>
              <p className="text-xs text-muted-foreground">Open Complaints</p>
            </div>
          </CardContent>
        </Card>
        <Card className={pendingRAs > 0 ? "border-purple-300" : ""}>
          <CardContent className="p-4 flex items-center gap-3">
            <Shield className={`h-8 w-8 shrink-0 ${pendingRAs > 0 ? "text-purple-500" : "text-muted-foreground"}`} />
            <div>
              <p className="text-2xl font-bold">{pendingRAs}</p>
              <p className="text-xs text-muted-foreground">Pending RAs</p>
            </div>
          </CardContent>
        </Card>
        <Card className={followUpsDue > 0 ? "border-amber-300" : ""}>
          <CardContent className="p-4 flex items-center gap-3">
            <Clock className={`h-8 w-8 shrink-0 ${followUpsDue > 0 ? "text-amber-500" : "text-muted-foreground"}`} />
            <div>
              <p className="text-2xl font-bold">{followUpsDue}</p>
              <p className="text-xs text-muted-foreground">Follow-ups Due</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Home className="h-8 w-8 text-blue-500 shrink-0" />
            <div>
              <p className="text-2xl font-bold">{outreachCount}</p>
              <p className="text-xs text-muted-foreground">Outreach Contacts</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-48 h-8 text-xs">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">All Types</SelectItem>
            {CONTACT_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value} className="text-xs">{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-36 h-8 text-xs">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">All Statuses</SelectItem>
            {Object.entries(STATUS_CONFIG).map(([v, c]) => (
              <SelectItem key={v} value={v} className="text-xs">{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Log list */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No contacts logged</p>
            <p className="text-sm text-muted-foreground mb-4">
              Start logging neighbor outreach, complaints, and reasonable accommodation requests to build your compliance record.
            </p>
            <Button onClick={() => setShowAdd(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Log First Contact
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((log) => (
            <LogCard
              key={log.id}
              log={log}
              onStatusChange={(id, status) => updateStatusMutation.mutate({ id, status })}
              onDelete={(id) => deleteMutation.mutate(id)}
            />
          ))}
        </div>
      )}

      {/* Add Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Log Community Contact</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Contact Type *</Label>
              <Select value={form.contact_type} onValueChange={set("contact_type")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {CONTACT_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.contact_type && (
                <p className="text-xs text-muted-foreground">
                  {CONTACT_TYPES.find((t) => t.value === form.contact_type)?.description}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Date *</Label>
              <Input type="date" value={form.contact_date} onChange={(e) => set("contact_date")(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Description *</Label>
              <Textarea
                value={form.description}
                onChange={(e) => set("description")(e.target.value)}
                placeholder="Describe the contact, what was discussed, and any key details..."
                rows={3}
              />
            </div>

            <Separator />
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Contact Info (Optional)</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs">Name</Label>
                <Input value={form.contact_name} onChange={(e) => set("contact_name")(e.target.value)} placeholder="John Smith" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Role</Label>
                <Select value={form.contact_role} onValueChange={set("contact_role")}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {CONTACT_ROLES.map((r) => (
                      <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 col-span-2">
                <Label className="text-xs">Address</Label>
                <Input value={form.contact_address} onChange={(e) => set("contact_address")(e.target.value)} placeholder="123 Neighbor St" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Phone</Label>
                <Input value={form.contact_phone} onChange={(e) => set("contact_phone")(e.target.value)} placeholder="(602) 555-0000" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Email</Label>
                <Input type="email" value={form.contact_email} onChange={(e) => set("contact_email")(e.target.value)} placeholder="email@example.com" />
              </div>
            </div>

            <Separator />
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Outcome & Follow-up</p>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label className="text-xs">Outcome / Resolution</Label>
                <Textarea value={form.outcome} onChange={(e) => set("outcome")(e.target.value)} placeholder="What was the result of this contact?" rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs">Follow-up Date</Label>
                  <Input type="date" value={form.follow_up_date} onChange={(e) => set("follow_up_date")(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Status</Label>
                  <Select value={form.status} onValueChange={set("status")}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(STATUS_CONFIG).map(([v, c]) => (
                        <SelectItem key={v} value={v}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {form.follow_up_date && (
                <div className="space-y-2">
                  <Label className="text-xs">Follow-up Notes</Label>
                  <Textarea value={form.follow_up_notes} onChange={(e) => set("follow_up_notes")(e.target.value)} placeholder="What needs to happen at follow-up?" rows={2} />
                </div>
              )}
            </div>

            {/* Reasonable Accommodation extra fields */}
            {form.contact_type === "reasonable_accommodation" && (
              <>
                <Separator />
                <p className="text-xs font-medium text-purple-700 uppercase tracking-wide">FHA Reasonable Accommodation Details</p>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label className="text-xs">Accommodation Requested</Label>
                    <Textarea
                      value={form.accommodation_requested}
                      onChange={(e) => set("accommodation_requested")(e.target.value)}
                      placeholder="Describe the specific accommodation being requested (e.g. deviation from 300ft spacing rule)..."
                      rows={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Decision</Label>
                    <Select value={form.accommodation_granted} onValueChange={set("accommodation_granted")}>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Pending / not yet decided" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Pending</SelectItem>
                        <SelectItem value="true">Granted</SelectItem>
                        <SelectItem value="false">Denied</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {form.accommodation_granted === "false" && (
                    <div className="space-y-2">
                      <Label className="text-xs">Denial Reason</Label>
                      <Input value={form.accommodation_denied_reason} onChange={(e) => set("accommodation_denied_reason")(e.target.value)} placeholder="Stated reason for denial..." />
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={() => addMutation.mutate()} disabled={addMutation.isPending}>
              {addMutation.isPending ? "Saving..." : "Save Log Entry"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
