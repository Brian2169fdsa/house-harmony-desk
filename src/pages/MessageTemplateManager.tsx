import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Lock, Loader2, FileText, Eye } from "lucide-react";
import { toast } from "sonner";

const CATEGORIES = ["payments", "maintenance", "compliance", "intake", "general"];

export default function MessageTemplateManager() {
  const queryClient = useQueryClient();
  const [dialogOpen,   setDialogOpen]   = useState(false);
  const [previewOpen,  setPreviewOpen]  = useState(false);
  const [previewData,  setPreviewData]  = useState<any>(null);
  const [editTarget,   setEditTarget]   = useState<any>(null);
  const [filterCat,    setFilterCat]    = useState("all");
  const [form, setForm] = useState({
    name: "", category: "general", subject_template: "", body_template: "", variables: "",
  });

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
    setForm({ name: "", category: "general", subject_template: "", body_template: "", variables: "" });
    setEditTarget(null);
  };

  const openEdit = (t: any) => {
    setEditTarget(t);
    setForm({
      name:             t.name,
      category:         t.category,
      subject_template: t.subject_template,
      body_template:    t.body_template,
      variables:        (t.variables ?? []).join(", "),
    });
    setDialogOpen(true);
  };

  const openPreview = (t: any) => {
    setPreviewData(t);
    setPreviewOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const vars = form.variables
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean);
      const payload = {
        name:             form.name,
        category:         form.category,
        subject_template: form.subject_template,
        body_template:    form.body_template,
        variables:        vars,
        is_system:        false,
      };
      if (editTarget) {
        const { error } = await supabase.from("message_templates").update(payload).eq("id", editTarget.id);
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
      const { error } = await supabase.from("message_templates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["message_templates"] });
      toast.success("Template deleted");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const filtered = templates.filter(
    (t: any) => filterCat === "all" || t.category === filterCat
  );

  // Auto-detect variables in template text
  const detectVariables = (text: string) => {
    const matches = [...text.matchAll(/\{\{(\w+)\}\}/g)].map((m) => m[1]);
    return [...new Set(matches)].join(", ");
  };

  const handleBodyChange = (body: string) => {
    const subVars  = detectVariables(form.subject_template);
    const bodyVars = detectVariables(body);
    const combined = [...new Set([...subVars.split(", "), ...bodyVars.split(", ")].filter(Boolean))].join(", ");
    setForm({ ...form, body_template: body, variables: combined });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Message Templates</h1>
          <p className="text-muted-foreground">Reusable notification templates with {"{{variable}}"} substitution</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) resetForm(); setDialogOpen(open); }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />New Template</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editTarget ? "Edit Template" : "Create Message Template"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Template Name *</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Payment Reminder" />
                </div>
                <div className="space-y-1">
                  <Label>Category *</Label>
                  <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1">
                <Label>Subject Template *</Label>
                <Input
                  value={form.subject_template}
                  onChange={(e) => setForm({ ...form, subject_template: e.target.value })}
                  placeholder="Payment Due: {{amount}} on {{due_date}}"
                />
              </div>
              <div className="space-y-1">
                <Label>Body Template *</Label>
                <Textarea
                  rows={6}
                  value={form.body_template}
                  onChange={(e) => handleBodyChange(e.target.value)}
                  placeholder={"Hi {{resident_name}},\n\nYour payment of {{amount}} is due on {{due_date}}.\n\nThank you,\n{{facility_name}}"}
                />
                <p className="text-xs text-muted-foreground">
                  Use {"{{variable_name}}"} for dynamic values. Variables are auto-detected.
                </p>
              </div>
              <div className="space-y-1">
                <Label>Variables (comma-separated)</Label>
                <Input
                  value={form.variables}
                  onChange={(e) => setForm({ ...form, variables: e.target.value })}
                  placeholder="resident_name, amount, due_date, facility_name"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => { resetForm(); setDialogOpen(false); }}>Cancel</Button>
                <Button disabled={!form.name || !form.subject_template || !form.body_template || saveMutation.isPending} onClick={() => saveMutation.mutate()}>
                  {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  {editTarget ? "Save" : "Create"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 flex-wrap">
        <Button
          size="sm"
          variant={filterCat === "all" ? "default" : "outline"}
          onClick={() => setFilterCat("all")}
        >
          All ({templates.length})
        </Button>
        {CATEGORIES.map((c) => {
          const count = templates.filter((t: any) => t.category === c).length;
          return (
            <Button
              key={c}
              size="sm"
              variant={filterCat === c ? "default" : "outline"}
              onClick={() => setFilterCat(c)}
            >
              {c.charAt(0).toUpperCase() + c.slice(1)} ({count})
            </Button>
          );
        })}
      </div>

      {/* Preview dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Template Preview — {previewData?.name}</DialogTitle>
          </DialogHeader>
          {previewData && (
            <div className="space-y-3 pt-2">
              <div className="rounded border p-3 bg-muted/30">
                <p className="text-xs text-muted-foreground mb-1">Subject</p>
                <p className="font-medium">{previewData.subject_template}</p>
              </div>
              <div className="rounded border p-3 bg-muted/30">
                <p className="text-xs text-muted-foreground mb-1">Body</p>
                <pre className="text-sm whitespace-pre-wrap font-sans">{previewData.body_template}</pre>
              </div>
              {(previewData.variables ?? []).length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Variables</p>
                  <div className="flex flex-wrap gap-1">
                    {previewData.variables.map((v: string) => (
                      <Badge key={v} variant="outline" className="font-mono text-xs">{`{{${v}}}`}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Template list */}
      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-medium">No templates found</p>
            <p className="text-sm text-muted-foreground">Create your first message template above.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {filtered.map((t: any) => (
            <Card key={t.id} className={t.is_system ? "border-blue-200" : ""}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      {t.name}
                      {t.is_system && (
                        <Badge variant="secondary" className="text-[10px]">
                          <Lock className="h-2.5 w-2.5 mr-0.5" />System
                        </Badge>
                      )}
                    </CardTitle>
                    <Badge variant="outline" className="text-[10px] mt-1">{t.category}</Badge>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button size="sm" variant="ghost" onClick={() => openPreview(t)}>
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                    {!t.is_system && (
                      <>
                        <Button size="sm" variant="ghost" onClick={() => openEdit(t)}>
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => deleteMutation.mutate(t.id)}>
                          <Trash2 className="h-3.5 w-3.5 text-red-500" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0 space-y-1">
                <p className="text-sm text-muted-foreground line-clamp-1">{t.subject_template}</p>
                {(t.variables ?? []).length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {t.variables.slice(0, 4).map((v: string) => (
                      <span key={v} className="text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded">{`{{${v}}}`}</span>
                    ))}
                    {t.variables.length > 4 && (
                      <span className="text-[10px] text-muted-foreground">+{t.variables.length - 4} more</span>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
