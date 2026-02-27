import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  MessageSquare,
  Plus,
  Trash2,
  Edit,
  Lock,
  Eye,
} from "lucide-react";
import { toast } from "sonner";

const CATEGORIES = [
  "payments",
  "maintenance",
  "compliance",
  "intake",
  "general",
  "emergency",
  "investor",
  "staff",
];

const AVAILABLE_VARIABLES = [
  { label: "Resident Name", value: "resident_name" },
  { label: "House Name", value: "house_name" },
  { label: "Balance Due", value: "balance_due" },
  { label: "Due Date", value: "due_date" },
  { label: "Manager Name", value: "manager_name" },
  { label: "Phone Number", value: "phone_number" },
];

const SAMPLE_DATA: Record<string, string> = {
  resident_name: "John Doe",
  house_name: "Harmony House",
  balance_due: "$450.00",
  due_date: "03/15/2026",
  manager_name: "Jane Manager",
  phone_number: "(555) 123-4567",
  facility_name: "SoberOps Living",
  amount: "$500.00",
  late_fee: "$25.00",
  total_balance: "$525.00",
  meeting_date: "03/10/2026",
  meeting_time: "6:00 PM",
  location: "Main Office",
  ticket_title: "Broken Window",
  status: "In Progress",
  eta: "03/12/2026",
  notes: "Parts ordered",
  violation_type: "Curfew Violation",
  violation_count: "2",
  meeting_deadline: "03/08/2026",
  chore_name: "Kitchen Clean-up",
  subject: "Emergency Notice",
  message: "Please evacuate immediately.",
  contact_name: "Front Desk",
  contact_phone: "(555) 987-6543",
  investor_name: "Robert Investor",
  month_year: "February 2026",
  occupancy_rate: "94%",
  gross_revenue: "$42,000",
  noi: "$28,500",
  vendor_name: "ABC Plumbing",
  order_number: "WO-1024",
  service_type: "Plumbing",
  address: "123 Main St",
  priority: "High",
  requested_date: "03/05/2026",
  description: "Leaking faucet in bathroom.",
  lead_name: "Sarah Smith",
  tour_date: "03/12/2026",
  tour_time: "2:00 PM",
  staff_name: "Mike Staff",
  week_start: "03/09/2026",
  shift_details: "Mon 8am-4pm, Wed 8am-4pm, Fri 12pm-8pm",
};

export default function CommunicationTemplates() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [editTarget, setEditTarget] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [form, setForm] = useState({
    name: "",
    category: "general",
    subject_template: "",
    body_template: "",
    variables: "",
  });

  // Ref for the body textarea to support variable insertion
  const [bodyRef, setBodyRef] = useState<HTMLTextAreaElement | null>(null);

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["message_templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("message_templates")
        .select("*")
        .order("is_system", { ascending: false })
        .order("created_at");
      if (error) throw error;
      return data ?? [];
    },
  });

  const resetForm = () => {
    setForm({
      name: "",
      category: "general",
      subject_template: "",
      body_template: "",
      variables: "",
    });
    setEditTarget(null);
  };

  const openEdit = (t: any) => {
    setEditTarget(t);
    setForm({
      name: t.name,
      category: t.category,
      subject_template: t.subject_template,
      body_template: t.body_template,
      variables: (t.variables ?? []).join(", "),
    });
    setDialogOpen(true);
  };

  const openPreview = (t: any) => {
    setPreviewData(t);
    setPreviewOpen(true);
  };

  // Auto-detect variables in template text
  const detectVariables = (text: string): string[] => {
    const matches = [...text.matchAll(/\{\{(\w+)\}\}/g)].map((m) => m[1]);
    return [...new Set(matches)];
  };

  const handleBodyChange = (newBody: string) => {
    const subVars = detectVariables(form.subject_template);
    const bodyVars = detectVariables(newBody);
    const combined = [...new Set([...subVars, ...bodyVars])].join(", ");
    setForm({ ...form, body_template: newBody, variables: combined });
  };

  const handleSubjectChange = (newSubject: string) => {
    const subVars = detectVariables(newSubject);
    const bodyVars = detectVariables(form.body_template);
    const combined = [...new Set([...subVars, ...bodyVars])].join(", ");
    setForm({ ...form, subject_template: newSubject, variables: combined });
  };

  const insertVariable = (varName: string) => {
    const tag = `{{${varName}}}`;
    if (bodyRef) {
      const start = bodyRef.selectionStart;
      const end = bodyRef.selectionEnd;
      const before = form.body_template.substring(0, start);
      const after = form.body_template.substring(end);
      const newBody = before + tag + after;
      handleBodyChange(newBody);

      // Restore cursor position after React re-render
      setTimeout(() => {
        bodyRef.focus();
        bodyRef.setSelectionRange(start + tag.length, start + tag.length);
      }, 0);
    } else {
      handleBodyChange(form.body_template + tag);
    }
  };

  const replaceVariables = (text: string): string => {
    return text.replace(/\{\{(\w+)\}\}/g, (_, key) => {
      return SAMPLE_DATA[key] || `[${key}]`;
    });
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const vars = form.variables
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean);
      const payload = {
        name: form.name,
        category: form.category,
        subject_template: form.subject_template,
        body_template: form.body_template,
        variables: vars,
        is_system: false,
      };
      if (editTarget) {
        const { error } = await supabase
          .from("message_templates")
          .update(payload)
          .eq("id", editTarget.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("message_templates").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["message_templates"] });
      setDialogOpen(false);
      resetForm();
      toast.success(editTarget ? "Template updated" : "Template created");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("message_templates")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["message_templates"] });
      toast.success("Template deleted");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const categoryCounts = CATEGORIES.reduce<Record<string, number>>((acc, cat) => {
    acc[cat] = templates.filter((t: any) => t.category === cat).length;
    return acc;
  }, {});

  const filteredTemplates =
    activeTab === "all"
      ? templates
      : templates.filter((t: any) => t.category === activeTab);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Communication Templates
          </h1>
          <p className="text-muted-foreground">
            Manage reusable message templates with variable placeholders
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/communications")}>
            <MessageSquare className="h-4 w-4 mr-2" />
            Compose
          </Button>
          <Dialog
            open={dialogOpen}
            onOpenChange={(open) => {
              if (!open) resetForm();
              setDialogOpen(open);
            }}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Template
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editTarget ? "Edit Template" : "Create Message Template"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Template Name *</Label>
                    <Input
                      value={form.name}
                      onChange={(e) =>
                        setForm({ ...form, name: e.target.value })
                      }
                      placeholder="Payment Reminder"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Category *</Label>
                    <Select
                      value={form.category}
                      onValueChange={(v) =>
                        setForm({ ...form, category: v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c.charAt(0).toUpperCase() + c.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label>Subject Template *</Label>
                  <Input
                    value={form.subject_template}
                    onChange={(e) => handleSubjectChange(e.target.value)}
                    placeholder="Payment Due: {{amount}} on {{due_date}}"
                  />
                </div>

                {/* Variable Insertion Toolbar */}
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Click to insert variable:
                  </Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {AVAILABLE_VARIABLES.map((v) => (
                      <Button
                        key={v.value}
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs font-mono"
                        onClick={() => insertVariable(v.value)}
                      >
                        {`{{${v.value}}}`}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <Label>Body Template *</Label>
                  <Textarea
                    ref={(el) => setBodyRef(el)}
                    rows={6}
                    value={form.body_template}
                    onChange={(e) => handleBodyChange(e.target.value)}
                    placeholder={
                      "Hi {{resident_name}},\n\nYour payment of {{amount}} is due on {{due_date}}.\n\nThank you,\n{{facility_name}}"
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Use {"{{variable_name}}"} for dynamic values. Variables are
                    auto-detected.
                  </p>
                </div>

                <div className="space-y-1">
                  <Label>Detected Variables</Label>
                  <Input
                    value={form.variables}
                    onChange={(e) =>
                      setForm({ ...form, variables: e.target.value })
                    }
                    placeholder="resident_name, amount, due_date, facility_name"
                  />
                </div>

                {/* Live Preview */}
                {form.body_template.trim() && (
                  <Card className="bg-muted/30">
                    <CardContent className="pt-4 space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">
                        Preview with Sample Data
                      </p>
                      {form.subject_template && (
                        <p className="text-sm font-semibold">
                          {replaceVariables(form.subject_template)}
                        </p>
                      )}
                      <pre className="text-sm whitespace-pre-wrap font-sans">
                        {replaceVariables(form.body_template)}
                      </pre>
                    </CardContent>
                  </Card>
                )}
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    resetForm();
                    setDialogOpen(false);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  disabled={
                    !form.name ||
                    !form.subject_template ||
                    !form.body_template ||
                    saveMutation.isPending
                  }
                  onClick={() => saveMutation.mutate()}
                >
                  {saveMutation.isPending
                    ? "Saving..."
                    : editTarget
                    ? "Save Changes"
                    : "Create Template"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Category Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="all">
            All ({templates.length})
          </TabsTrigger>
          {CATEGORIES.map((c) => (
            <TabsTrigger key={c} value={c}>
              {c.charAt(0).toUpperCase() + c.slice(1)} ({categoryCounts[c] || 0})
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {isLoading ? (
            <p className="text-center py-8 text-muted-foreground">Loading...</p>
          ) : filteredTemplates.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <MessageSquare className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="font-medium">No templates found</p>
                <p className="text-sm text-muted-foreground">
                  {activeTab === "all"
                    ? "Create your first message template."
                    : `No templates in the "${activeTab}" category.`}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {filteredTemplates.map((t: any) => (
                <Card
                  key={t.id}
                  className={t.is_system ? "border-blue-200 dark:border-blue-800" : ""}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <CardTitle className="text-base flex items-center gap-2">
                          {t.name}
                          {t.is_system && (
                            <Badge
                              variant="secondary"
                              className="text-[10px]"
                            >
                              <Lock className="h-2.5 w-2.5 mr-0.5" />
                              System
                            </Badge>
                          )}
                        </CardTitle>
                        <Badge
                          variant="outline"
                          className="text-[10px] mt-1"
                        >
                          {t.category}
                        </Badge>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openPreview(t)}
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        {t.is_system ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEdit(t)}
                            title="Edit system template"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openEdit(t)}
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteMutation.mutate(t.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5 text-red-500" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-1">
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {t.subject_template}
                    </p>
                    {(t.variables ?? []).length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {t.variables.slice(0, 4).map((v: string) => (
                          <span
                            key={v}
                            className="text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded"
                          >{`{{${v}}}`}</span>
                        ))}
                        {t.variables.length > 4 && (
                          <span className="text-[10px] text-muted-foreground">
                            +{t.variables.length - 4} more
                          </span>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>
              Template Preview — {previewData?.name}
            </DialogTitle>
          </DialogHeader>
          {previewData && (
            <div className="space-y-4 pt-2">
              {/* Raw template */}
              <div className="rounded border p-3 bg-muted/30 space-y-2">
                <p className="text-xs text-muted-foreground font-medium">
                  Subject Template
                </p>
                <p className="font-medium text-sm">
                  {previewData.subject_template}
                </p>
              </div>
              <div className="rounded border p-3 bg-muted/30 space-y-2">
                <p className="text-xs text-muted-foreground font-medium">
                  Body Template
                </p>
                <pre className="text-sm whitespace-pre-wrap font-sans">
                  {previewData.body_template}
                </pre>
              </div>

              {/* Preview with sample data */}
              <div className="rounded border p-3 bg-green-50 dark:bg-green-900/10 space-y-2">
                <p className="text-xs text-green-700 dark:text-green-400 font-medium">
                  Preview with Sample Data
                </p>
                <p className="font-medium text-sm">
                  {replaceVariables(previewData.subject_template)}
                </p>
                <pre className="text-sm whitespace-pre-wrap font-sans">
                  {replaceVariables(previewData.body_template)}
                </pre>
              </div>

              {(previewData.variables ?? []).length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    Variables
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {previewData.variables.map((v: string) => (
                      <Badge
                        key={v}
                        variant="outline"
                        className="font-mono text-xs"
                      >{`{{${v}}}`}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {previewData.is_system && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Lock className="h-3 w-3" />
                  This is a system template and cannot be deleted.
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
