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
import { Progress } from "@/components/ui/progress";
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
  Award,
  Plus,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  Calendar,
  DollarSign,
  FileText,
  ChevronDown,
  ChevronUp,
  Trash2,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { differenceInDays, format, parseISO, isAfter, isBefore, addDays } from "date-fns";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Accreditation {
  id: string;
  accreditation_type: string;
  accreditation_name: string;
  issuing_body: string;
  status: string;
  applied_at: string | null;
  issued_at: string | null;
  expires_at: string | null;
  renewal_due_at: string | null;
  next_inspection_at: string | null;
  application_fee: number | null;
  annual_fee: number | null;
  fee_notes: string | null;
  notes: string | null;
  certificate_url: string | null;
  created_at: string;
}

interface PrepItem {
  id: string;
  accreditation_id: string;
  title: string;
  description: string | null;
  status: string;
  due_date: string | null;
  completed_at: string | null;
  sort_order: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ACCREDITATION_TYPES: { value: string; label: string; body: string; description: string }[] = [
  {
    value: "narr_azrha",
    label: "NARR / AzRHA",
    body: "Arizona Recovery Housing Association",
    description: "NARR national standard; AzRHA is the AZ state affiliate. Streamlines ADHS licensing, gates referrals and funding.",
  },
  {
    value: "adhs_slh",
    label: "ADHS License — SLH",
    body: "Arizona Department of Health Services",
    description: "Mandatory ADHS Sober Living Home license. Fee: $500 + $100 × max residents. Annual renewal + on-site inspection.",
  },
  {
    value: "adhs_bhrf",
    label: "ADHS License — BHRF",
    body: "Arizona Department of Health Services",
    description: "Behavioral Health Residential Facility license. Clinical services permitted. Higher staffing/facility requirements.",
  },
  {
    value: "carf",
    label: "CARF Accreditation",
    body: "Commission on Accreditation of Rehabilitation Facilities",
    description: "National BH accreditation. Prep journey may take 1+ year. Strong continuous improvement model.",
  },
  {
    value: "carf_asam",
    label: "CARF ASAM LOC",
    body: "CARF / American Society of Addiction Medicine",
    description: "CARF certification aligned to ASAM levels of care for residential SUD treatment.",
  },
  {
    value: "joint_commission",
    label: "Joint Commission",
    body: "The Joint Commission",
    description: "Behavioral Health Care & Human Services accreditation. Strong market signaling; custom quote required.",
  },
  {
    value: "other",
    label: "Other",
    body: "",
    description: "Custom accreditation or certification.",
  },
];

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ElementType; color: string }> = {
  planning: { label: "Planning", variant: "secondary", icon: Clock, color: "text-muted-foreground" },
  applied: { label: "Applied", variant: "default", icon: FileText, color: "text-blue-600" },
  in_review: { label: "In Review", variant: "default", icon: RefreshCw, color: "text-blue-600" },
  inspection_scheduled: { label: "Inspection Scheduled", variant: "default", icon: Calendar, color: "text-amber-600" },
  active: { label: "Active", variant: "default", icon: CheckCircle2, color: "text-green-600" },
  expired: { label: "Expired", variant: "destructive", icon: XCircle, color: "text-red-600" },
  denied: { label: "Denied", variant: "destructive", icon: XCircle, color: "text-red-600" },
  withdrawn: { label: "Withdrawn", variant: "outline", icon: XCircle, color: "text-muted-foreground" },
};

const STATUS_STEPS = ["planning", "applied", "in_review", "inspection_scheduled", "active"];

const DEFAULT_PREP_ITEMS: Record<string, string[]> = {
  narr_azrha: [
    "Submit AzRHA membership application + $400 annual fee",
    "Attend 2 monthly AzRHA meetings (3rd Wednesday, 9 AM)",
    "Email inspector@myazrha.org for current inspection checklist",
    "Submit all policies & procedures for documentation review",
    "Pass documentation review against NARR and AzRHA Quality Standards",
    "Schedule and pass on-site inspection ($100/house fee)",
    "Pay annual bed dues ($10/bed for Level I/II)",
    "Receive AzRHA certification",
  ],
  adhs_slh: [
    "Complete ADHS Sober Living Home application",
    "Attach AzRHA certification (if obtained)",
    "Submit Owner Attestation Form",
    "Pay licensing fee: $500 + $100 × maximum number of residents",
    "Submit documentation of local zoning, building, fire code compliance",
    "Pass ADHS mandatory on-site inspection",
    "Receive ADHS license (12-month validity)",
  ],
  adhs_bhrf: [
    "Determine BHRF class and applicable R9-10 rule requirements",
    "Complete BHRF application and all required attachments",
    "Confirm qualified clinical staff and supervision structure",
    "Submit policies & procedures per R9-10 requirements",
    "Submit evidence of compliance with local zoning and fire codes",
    "Pass ADHS on-site survey",
    "Receive BHRF license",
  ],
  carf: [
    "Contact CARF to request standards manual and self-evaluation guide",
    "Conduct internal gap analysis against CARF standards",
    "Develop quality improvement plan addressing gaps",
    "Implement required policies and procedures",
    "Conduct internal mock survey (recommended)",
    "Submit formal application and intent to survey",
    "Host CARF on-site survey team",
    "Address any conformance issues identified",
    "Receive accreditation decision",
  ],
  carf_asam: [
    "Identify applicable ASAM level(s) of care",
    "Obtain CARF ASAM LOC standards manual",
    "Conduct gap analysis against ASAM criteria",
    "Align clinical documentation to ASAM LOC requirements",
    "Apply for CARF ASAM LOC survey",
    "Pass on-site survey",
    "Receive CARF ASAM LOC certification",
  ],
  joint_commission: [
    "Contact Joint Commission for Behavioral Health Care program information",
    "Request custom pricing quote via JC pricing form",
    "Conduct standards self-assessment",
    "Develop corrective action plan for gaps",
    "Submit Joint Commission application",
    "Prepare for and host on-site survey",
    "Address findings post-survey",
    "Receive accreditation decision",
  ],
  other: [
    "Research accreditation requirements",
    "Gather required documentation",
    "Submit application",
    "Pass review / inspection",
    "Receive accreditation",
  ],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getExpiryStatus(expires_at: string | null): "ok" | "warning" | "expired" | null {
  if (!expires_at) return null;
  const exp = parseISO(expires_at);
  const now = new Date();
  if (isBefore(exp, now)) return "expired";
  if (isBefore(exp, addDays(now, 60))) return "warning";
  return "ok";
}

function adhs_slh_fee(maxResidents: number) {
  return 500 + 100 * maxResidents;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ADHSFeeCalculator() {
  const [residents, setResidents] = useState(8);
  const fee = adhs_slh_fee(residents);
  return (
    <Card className="border-blue-200 bg-blue-50/40 dark:bg-blue-950/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-blue-600" />
          ADHS SLH License Fee Calculator
        </CardTitle>
        <CardDescription className="text-xs">Formula: $500 + ($100 × max residents)</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-3">
          <Label className="text-xs w-28 shrink-0">Max Residents</Label>
          <Input
            type="number"
            min={1}
            max={100}
            value={residents}
            onChange={(e) => setResidents(Number(e.target.value))}
            className="w-24"
          />
        </div>
        <div className="flex justify-between items-center pt-1 border-t">
          <span className="text-sm text-muted-foreground">Annual License Fee</span>
          <span className="text-lg font-bold text-blue-700">${fee.toLocaleString()}</span>
        </div>
        <p className="text-xs text-muted-foreground">License valid 12 months; annual renewal required. BHRF fees vary by class — contact ADHS for exact quote.</p>
      </CardContent>
    </Card>
  );
}

function PrepItemsPanel({ accreditation }: { accreditation: Accreditation }) {
  const queryClient = useQueryClient();

  const { data: items = [] } = useQuery({
    queryKey: ["accred-prep", accreditation.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("accreditation_prep_items")
        .select("*")
        .eq("accreditation_id", accreditation.id)
        .order("sort_order");
      if (error) throw error;
      return (data ?? []) as PrepItem[];
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async (item: PrepItem) => {
      const newStatus = item.status === "completed" ? "pending" : "completed";
      const { error } = await supabase
        .from("accreditation_prep_items")
        .update({
          status: newStatus,
          completed_at: newStatus === "completed" ? new Date().toISOString() : null,
        })
        .eq("id", item.id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["accred-prep", accreditation.id] }),
    onError: (e: any) => toast.error(e.message),
  });

  const completed = items.filter((i) => i.status === "completed").length;
  const pct = items.length > 0 ? Math.round((completed / items.length) * 100) : 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Progress value={pct} className="flex-1 h-2" />
        <span className="text-xs text-muted-foreground w-12 text-right">{completed}/{items.length}</span>
      </div>
      <div className="space-y-1.5">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-start gap-2 cursor-pointer group"
            onClick={() => toggleMutation.mutate(item)}
          >
            <div className={`mt-0.5 shrink-0 h-4 w-4 rounded-sm border flex items-center justify-center transition-colors ${item.status === "completed" ? "bg-green-500 border-green-500" : "border-muted-foreground/40 group-hover:border-green-400"}`}>
              {item.status === "completed" && <CheckCircle2 className="h-3 w-3 text-white" />}
            </div>
            <span className={`text-sm leading-5 ${item.status === "completed" ? "line-through text-muted-foreground" : ""}`}>
              {item.title}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AccreditationCard({ accreditation, onDeleted }: { accreditation: Accreditation; onDeleted: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const queryClient = useQueryClient();

  const cfg = STATUS_CONFIG[accreditation.status] ?? STATUS_CONFIG.planning;
  const StatusIcon = cfg.icon;
  const expiryStatus = getExpiryStatus(accreditation.expires_at);
  const typeInfo = ACCREDITATION_TYPES.find((t) => t.value === accreditation.accreditation_type);

  const daysUntilExpiry = accreditation.expires_at
    ? differenceInDays(parseISO(accreditation.expires_at), new Date())
    : null;

  const stepIndex = STATUS_STEPS.indexOf(accreditation.status);

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("accreditations").delete().eq("id", accreditation.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accreditations"] });
      onDeleted();
      toast.success("Accreditation removed");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      const { error } = await supabase
        .from("accreditations")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", accreditation.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accreditations"] });
      toast.success("Status updated");
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <Card className={`transition-all ${expiryStatus === "expired" ? "border-red-300" : expiryStatus === "warning" ? "border-amber-300" : ""}`}>
      <CardContent className="p-4 space-y-3">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className={`mt-0.5 rounded-full p-1.5 shrink-0 ${accreditation.status === "active" ? "bg-green-100" : "bg-muted"}`}>
              <Award className={`h-4 w-4 ${accreditation.status === "active" ? "text-green-600" : "text-muted-foreground"}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                <h3 className="font-semibold text-sm">{accreditation.accreditation_name}</h3>
                <Badge variant={cfg.variant} className="text-xs">
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {cfg.label}
                </Badge>
                {expiryStatus === "expired" && (
                  <Badge variant="destructive" className="text-xs">Expired</Badge>
                )}
                {expiryStatus === "warning" && (
                  <Badge className="text-xs bg-amber-100 text-amber-800 border-amber-300">Expiring Soon</Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{accreditation.issuing_body}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setExpanded((e) => !e)}
            >
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-red-600"
              onClick={() => {
                if (confirm("Remove this accreditation?")) deleteMutation.mutate();
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Key dates summary */}
        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
          {accreditation.issued_at && (
            <span>Issued: {format(parseISO(accreditation.issued_at), "MMM d, yyyy")}</span>
          )}
          {accreditation.expires_at && (
            <span className={expiryStatus === "expired" ? "text-red-600 font-medium" : expiryStatus === "warning" ? "text-amber-700 font-medium" : ""}>
              Expires: {format(parseISO(accreditation.expires_at), "MMM d, yyyy")}
              {daysUntilExpiry !== null && daysUntilExpiry > 0 && ` (${daysUntilExpiry}d)`}
              {daysUntilExpiry !== null && daysUntilExpiry <= 0 && " (EXPIRED)"}
            </span>
          )}
          {accreditation.next_inspection_at && (
            <span>Next Inspection: {format(parseISO(accreditation.next_inspection_at), "MMM d, yyyy")}</span>
          )}
          {accreditation.annual_fee && (
            <span>Annual Fee: ${accreditation.annual_fee.toLocaleString()}</span>
          )}
        </div>

        {/* Progress timeline for in-progress items */}
        {stepIndex >= 0 && accreditation.status !== "active" && (
          <div className="flex items-center gap-1">
            {STATUS_STEPS.map((step, i) => (
              <div key={step} className="flex items-center gap-1 flex-1">
                <div
                  className={`h-2 w-2 rounded-full shrink-0 cursor-pointer transition-colors ${i <= stepIndex ? "bg-primary" : "bg-muted"}`}
                  title={STATUS_CONFIG[step]?.label}
                  onClick={() => updateStatusMutation.mutate(step)}
                />
                {i < STATUS_STEPS.length - 1 && (
                  <div className={`h-0.5 flex-1 ${i < stepIndex ? "bg-primary" : "bg-muted"}`} />
                )}
              </div>
            ))}
            <span className="text-xs text-muted-foreground ml-1">{cfg.label}</span>
          </div>
        )}

        {/* Expanded section */}
        {expanded && (
          <div className="space-y-4 pt-1">
            <Separator />

            {/* Description from type */}
            {typeInfo && typeInfo.description && (
              <p className="text-xs text-muted-foreground">{typeInfo.description}</p>
            )}

            {/* Status quick-change */}
            <div className="space-y-1">
              <Label className="text-xs">Update Status</Label>
              <Select
                value={accreditation.status}
                onValueChange={(v) => updateStatusMutation.mutate(v)}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_CONFIG).map(([v, c]) => (
                    <SelectItem key={v} value={v} className="text-xs">{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Notes */}
            {accreditation.notes && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Notes</p>
                <p className="text-sm">{accreditation.notes}</p>
              </div>
            )}

            {/* Prep checklist */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Prep Checklist</p>
              <PrepItemsPanel accreditation={accreditation} />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const defaultForm = {
  accreditation_type: "",
  accreditation_name: "",
  issuing_body: "",
  status: "planning",
  applied_at: "",
  issued_at: "",
  expires_at: "",
  renewal_due_at: "",
  next_inspection_at: "",
  application_fee: "",
  annual_fee: "",
  fee_notes: "",
  notes: "",
};

export default function Accreditation() {
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [filterStatus, setFilterStatus] = useState("all");

  const { data: accreditations = [], isLoading } = useQuery({
    queryKey: ["accreditations"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("accreditations")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Accreditation[];
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const typeInfo = ACCREDITATION_TYPES.find((t) => t.value === form.accreditation_type);
      if (!form.accreditation_type) throw new Error("Select an accreditation type");

      const { data: { user } } = await supabase.auth.getUser();

      const name = form.accreditation_name.trim() || typeInfo?.label || form.accreditation_type;
      const body = form.issuing_body.trim() || typeInfo?.body || "";

      const { data: acc, error } = await supabase
        .from("accreditations")
        .insert({
          user_id: user?.id,
          accreditation_type: form.accreditation_type,
          accreditation_name: name,
          issuing_body: body,
          status: form.status,
          applied_at: form.applied_at || null,
          issued_at: form.issued_at || null,
          expires_at: form.expires_at || null,
          renewal_due_at: form.renewal_due_at || null,
          next_inspection_at: form.next_inspection_at || null,
          application_fee: form.application_fee ? Number(form.application_fee) : null,
          annual_fee: form.annual_fee ? Number(form.annual_fee) : null,
          fee_notes: form.fee_notes || null,
          notes: form.notes || null,
        })
        .select()
        .single();
      if (error) throw error;

      // Seed prep items from defaults
      const prepTitles = DEFAULT_PREP_ITEMS[form.accreditation_type] ?? DEFAULT_PREP_ITEMS.other;
      if (prepTitles.length > 0) {
        await supabase.from("accreditation_prep_items").insert(
          prepTitles.map((title, i) => ({
            accreditation_id: acc.id,
            title,
            status: "pending",
            sort_order: i,
          }))
        );
      }

      return acc;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accreditations"] });
      setShowAdd(false);
      setForm(defaultForm);
      toast.success("Accreditation added");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const set = (k: keyof typeof form) => (v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const onTypeChange = (type: string) => {
    const t = ACCREDITATION_TYPES.find((x) => x.value === type);
    setForm((f) => ({
      ...f,
      accreditation_type: type,
      accreditation_name: t?.label ?? "",
      issuing_body: t?.body ?? "",
    }));
  };

  const filtered = filterStatus === "all"
    ? accreditations
    : accreditations.filter((a) => a.status === filterStatus);

  // KPIs
  const active = accreditations.filter((a) => a.status === "active").length;
  const expiringSoon = accreditations.filter((a) => getExpiryStatus(a.expires_at) === "warning").length;
  const expired = accreditations.filter((a) => getExpiryStatus(a.expires_at) === "expired" || a.status === "expired").length;
  const inProgress = accreditations.filter((a) => ["applied", "in_review", "inspection_scheduled"].includes(a.status)).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Accreditation Tracker</h1>
          <p className="text-muted-foreground">Track ADHS licensing, AzRHA/NARR, CARF, and Joint Commission certifications</p>
        </div>
        <Button onClick={() => setShowAdd(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Accreditation
        </Button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle2 className="h-8 w-8 text-green-500 shrink-0" />
            <div>
              <p className="text-2xl font-bold">{active}</p>
              <p className="text-xs text-muted-foreground">Active</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <RefreshCw className="h-8 w-8 text-blue-500 shrink-0" />
            <div>
              <p className="text-2xl font-bold">{inProgress}</p>
              <p className="text-xs text-muted-foreground">In Progress</p>
            </div>
          </CardContent>
        </Card>
        <Card className={expiringSoon > 0 ? "border-amber-300" : ""}>
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className={`h-8 w-8 shrink-0 ${expiringSoon > 0 ? "text-amber-500" : "text-muted-foreground"}`} />
            <div>
              <p className="text-2xl font-bold">{expiringSoon}</p>
              <p className="text-xs text-muted-foreground">Expiring ≤60d</p>
            </div>
          </CardContent>
        </Card>
        <Card className={expired > 0 ? "border-red-300" : ""}>
          <CardContent className="p-4 flex items-center gap-3">
            <XCircle className={`h-8 w-8 shrink-0 ${expired > 0 ? "text-red-500" : "text-muted-foreground"}`} />
            <div>
              <p className="text-2xl font-bold">{expired}</p>
              <p className="text-xs text-muted-foreground">Expired</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main list */}
        <div className="lg:col-span-2 space-y-3">
          {/* Filter */}
          <div className="flex gap-2 flex-wrap">
            {["all", "planning", "applied", "in_review", "inspection_scheduled", "active", "expired"].map((s) => (
              <Button
                key={s}
                variant={filterStatus === s ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterStatus(s)}
                className="text-xs h-7"
              >
                {s === "all" ? "All" : STATUS_CONFIG[s]?.label ?? s}
              </Button>
            ))}
          </div>

          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Loading...</div>
          ) : filtered.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Award className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium">No accreditations tracked</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Add your ADHS license, AzRHA/NARR certification, or other accreditations to track status and prep checklists.
                </p>
                <Button onClick={() => setShowAdd(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Accreditation
                </Button>
              </CardContent>
            </Card>
          ) : (
            filtered.map((a) => (
              <AccreditationCard
                key={a.id}
                accreditation={a}
                onDeleted={() => {}}
              />
            ))
          )}
        </div>

        {/* Sidebar: ADHS fee calculator + info */}
        <div className="space-y-4">
          <ADHSFeeCalculator />

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Accreditation Reference</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-muted-foreground">
              {ACCREDITATION_TYPES.filter((t) => t.value !== "other").map((t) => (
                <div key={t.value} className="space-y-0.5">
                  <p className="font-medium text-foreground">{t.label}</p>
                  <p>{t.description}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Accreditation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Accreditation Type *</Label>
              <Select value={form.accreditation_type} onValueChange={onTypeChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {ACCREDITATION_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.accreditation_type && ACCREDITATION_TYPES.find((t) => t.value === form.accreditation_type)?.description && (
                <p className="text-xs text-muted-foreground">
                  {ACCREDITATION_TYPES.find((t) => t.value === form.accreditation_type)?.description}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2 col-span-2">
                <Label>Name</Label>
                <Input value={form.accreditation_name} onChange={(e) => set("accreditation_name")(e.target.value)} placeholder="e.g. AzRHA Certification" />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Issuing Body</Label>
                <Input value={form.issuing_body} onChange={(e) => set("issuing_body")(e.target.value)} placeholder="e.g. Arizona Recovery Housing Association" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Current Status</Label>
              <Select value={form.status} onValueChange={set("status")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_CONFIG).map(([v, c]) => (
                    <SelectItem key={v} value={v}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator />
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Key Dates</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs">Date Applied</Label>
                <Input type="date" value={form.applied_at} onChange={(e) => set("applied_at")(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Date Issued</Label>
                <Input type="date" value={form.issued_at} onChange={(e) => set("issued_at")(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Expiration Date</Label>
                <Input type="date" value={form.expires_at} onChange={(e) => set("expires_at")(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Renewal Due</Label>
                <Input type="date" value={form.renewal_due_at} onChange={(e) => set("renewal_due_at")(e.target.value)} />
              </div>
              <div className="space-y-2 col-span-2">
                <Label className="text-xs">Next Inspection</Label>
                <Input type="date" value={form.next_inspection_at} onChange={(e) => set("next_inspection_at")(e.target.value)} />
              </div>
            </div>

            <Separator />
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Fees</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs">Application Fee ($)</Label>
                <Input type="number" value={form.application_fee} onChange={(e) => set("application_fee")(e.target.value)} placeholder="0" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Annual Fee ($)</Label>
                <Input type="number" value={form.annual_fee} onChange={(e) => set("annual_fee")(e.target.value)} placeholder="0" />
              </div>
              <div className="space-y-2 col-span-2">
                <Label className="text-xs">Fee Notes</Label>
                <Input value={form.fee_notes} onChange={(e) => set("fee_notes")(e.target.value)} placeholder="e.g. $400 membership + $100/house inspection + $10/bed/yr" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => set("notes")(e.target.value)}
                placeholder="Any relevant notes about this accreditation..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={() => addMutation.mutate()} disabled={addMutation.isPending}>
              {addMutation.isPending ? "Adding..." : "Add & Seed Checklist"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
