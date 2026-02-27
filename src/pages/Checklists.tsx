import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  ClipboardCheck,
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  ChevronRight,
  ListChecks,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import type { Json } from "@/integrations/supabase/types";

interface TemplateItem {
  id: string;
  title: string;
  description?: string;
  category: string;
  order_index: number;
  estimated_days?: number;
  depends_on: string[];
  default_assignee_role?: string;
  is_required: boolean;
}

interface ChecklistTemplate {
  id: string;
  name: string;
  description: string | null;
  category: string;
  estimated_days: number | null;
  items: Json;
}

interface ChecklistRow {
  id: string;
  title: string;
  status: string;
  assignee: string | null;
  due_date: string | null;
  created_at: string;
  template_id: string | null;
  checklist_templates: { name: string; category: string } | null;
  checklist_items: { id: string; status: string }[];
}

const CATEGORY_LABELS: Record<string, string> = {
  new_house_startup: "New House Startup",
  staff_onboarding: "Staff Onboarding",
  resident_intake: "Resident Intake",
  adhs_renewal: "ADHS Renewal",
  monthly_ops: "Monthly Operations",
};

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; icon: React.ElementType }
> = {
  not_started: { label: "Not Started", color: "secondary", icon: Clock },
  in_progress: { label: "In Progress", color: "default", icon: AlertCircle },
  completed: { label: "Completed", color: "default", icon: CheckCircle2 },
  cancelled: { label: "Cancelled", color: "destructive", icon: XCircle },
};

export default function Checklists() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [form, setForm] = useState({
    template_id: "",
    title: "",
    assignee: "",
    due_date: "",
    notes: "",
  });

  // Fetch templates
  const { data: templates = [] } = useQuery({
    queryKey: ["checklist_templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("checklist_templates")
        .select("*")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return (data ?? []) as ChecklistTemplate[];
    },
  });

  // Fetch checklists with item counts
  const { data: checklists = [], isLoading } = useQuery({
    queryKey: ["checklists"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("checklists")
        .select(
          "*, checklist_templates(name, category), checklist_items(id, status)"
        )
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ChecklistRow[];
    },
  });

  // KPIs
  const total = checklists.length;
  const inProgress = checklists.filter((c) => c.status === "in_progress").length;
  const completed = checklists.filter((c) => c.status === "completed").length;
  const overdueCnt = checklists.filter(
    (c) =>
      c.due_date &&
      c.status !== "completed" &&
      c.status !== "cancelled" &&
      new Date(c.due_date) < new Date()
  ).length;

  // Filter checklists
  const filtered = checklists.filter((c) => {
    const statusMatch = filterStatus === "all" || c.status === filterStatus;
    const catMatch =
      filterCategory === "all" ||
      c.checklist_templates?.category === filterCategory;
    return statusMatch && catMatch;
  });

  // Create checklist: instantiate all items from template
  const createMutation = useMutation({
    mutationFn: async () => {
      if (!form.template_id) throw new Error("Select a template");
      if (!form.title.trim()) throw new Error("Enter a title");

      const tmpl = templates.find((t) => t.id === form.template_id);
      if (!tmpl) throw new Error("Template not found");

      const { data: checklist, error: ce } = await supabase
        .from("checklists")
        .insert({
          template_id: form.template_id,
          title: form.title.trim(),
          assignee: form.assignee || null,
          due_date: form.due_date || null,
          notes: form.notes || null,
          status: "not_started",
        })
        .select()
        .single();
      if (ce) throw ce;

      const items = (tmpl.items as TemplateItem[]) || [];
      if (items.length > 0) {
        const itemRows = items.map((item) => ({
          checklist_id: checklist.id,
          template_item_id: item.id,
          title: item.title,
          description: item.description || null,
          category: item.category,
          order_index: item.order_index,
          status: "pending" as const,
          depends_on: item.depends_on ?? [],
          is_required: item.is_required ?? true,
          assignee: form.assignee || null,
        }));
        const { error: ie } = await supabase
          .from("checklist_items")
          .insert(itemRows);
        if (ie) throw ie;
      }

      // Audit log
      await supabase.from("checklist_audit_log").insert({
        checklist_id: checklist.id,
        action: "created",
        new_value: { title: checklist.title, template: tmpl.name } as Json,
        performed_by: "current_user",
      });

      return checklist;
    },
    onSuccess: (checklist) => {
      queryClient.invalidateQueries({ queryKey: ["checklists"] });
      setShowCreate(false);
      setForm({ template_id: "", title: "", assignee: "", due_date: "", notes: "" });
      toast.success("Checklist created");
      navigate(`/checklists/${checklist.id}`);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const selectedTemplate = templates.find((t) => t.id === form.template_id);

  const getProgress = (items: { status: string }[]) => {
    if (!items.length) return 0;
    const done = items.filter(
      (i) => i.status === "completed" || i.status === "skipped"
    ).length;
    return Math.round((done / items.length) * 100);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Checklists</h1>
          <p className="text-muted-foreground">
            Smart operational checklists with dependencies and progress tracking
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Checklist
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <ListChecks className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{total}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{inProgress}</p>
                <p className="text-sm text-muted-foreground">In Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{completed}</p>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{overdueCnt}</p>
                <p className="text-sm text-muted-foreground">Overdue</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="not_started">Not Started</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Checklist List */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ClipboardCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No checklists found</p>
            <p className="text-muted-foreground mb-4">
              Create your first checklist from one of the 5 pre-built templates.
            </p>
            <Button onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Checklist
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((c) => {
            const cfg = STATUS_CONFIG[c.status] ?? STATUS_CONFIG.not_started;
            const StatusIcon = cfg.icon;
            const progress = getProgress(c.checklist_items);
            const isOverdue =
              c.due_date &&
              c.status !== "completed" &&
              c.status !== "cancelled" &&
              new Date(c.due_date) < new Date();

            return (
              <Card
                key={c.id}
                className="cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => navigate(`/checklists/${c.id}`)}
              >
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-semibold truncate">{c.title}</h3>
                        <Badge variant={cfg.color as any} className="text-xs">
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {cfg.label}
                        </Badge>
                        {c.checklist_templates && (
                          <Badge variant="outline" className="text-xs">
                            {CATEGORY_LABELS[c.checklist_templates.category] ??
                              c.checklist_templates.name}
                          </Badge>
                        )}
                        {isOverdue && (
                          <Badge variant="destructive" className="text-xs">
                            Overdue
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {c.assignee && <span>Assignee: {c.assignee}</span>}
                        {c.due_date && (
                          <span>
                            Due: {format(new Date(c.due_date), "MMM d, yyyy")}
                          </span>
                        )}
                        <span>
                          {c.checklist_items.length} items
                        </span>
                      </div>
                      {c.checklist_items.length > 0 && (
                        <div className="mt-2 flex items-center gap-3">
                          <Progress value={progress} className="flex-1 h-2" />
                          <span className="text-sm font-medium w-10 text-right">
                            {progress}%
                          </span>
                        </div>
                      )}
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-1" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>New Checklist</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Template *</Label>
              <Select
                value={form.template_id}
                onValueChange={(v) => {
                  const tmpl = templates.find((t) => t.id === v);
                  setForm((f) => ({
                    ...f,
                    template_id: v,
                    title: tmpl ? tmpl.name : f.title,
                  }));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}{" "}
                      <span className="text-muted-foreground text-xs">
                        ({(t.items as TemplateItem[]).length} items)
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedTemplate?.description && (
                <p className="text-sm text-muted-foreground">
                  {selectedTemplate.description}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="e.g. New House Startup — 123 Main St"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Assignee</Label>
                <Input
                  value={form.assignee}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, assignee: e.target.value }))
                  }
                  placeholder="Staff name or email"
                />
              </div>
              <div className="space-y-2">
                <Label>Due Date</Label>
                <Input
                  type="date"
                  value={form.due_date}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, due_date: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={form.notes}
                onChange={(e) =>
                  setForm((f) => ({ ...f, notes: e.target.value }))
                }
                placeholder="Optional notes about this checklist..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? "Creating..." : "Create Checklist"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
