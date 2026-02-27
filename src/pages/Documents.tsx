import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileText,
  Plus,
  Eye,
  Download,
  Pencil,
  Trash2,
  Upload,
  ExternalLink,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { RoleGuard } from "@/components/RoleGuard";
import { logAudit } from "@/lib/audit";

type DocumentCategory =
  | "lease"
  | "house_rules"
  | "intake_form"
  | "incident_report"
  | "consent"
  | "other";

const CATEGORIES: { value: DocumentCategory; label: string }[] = [
  { value: "lease", label: "Lease Agreement" },
  { value: "house_rules", label: "House Rules" },
  { value: "intake_form", label: "Intake Form" },
  { value: "incident_report", label: "Incident Report" },
  { value: "consent", label: "Consent Form" },
  { value: "other", label: "Other" },
];

// Extract {{variable}} placeholders from template content
function extractVariables(content: string): string[] {
  const matches = content.match(/\{\{(\w+)\}\}/g) ?? [];
  return [...new Set(matches.map((m) => m.slice(2, -2)))];
}

// Fill template variables
function fillTemplate(content: string, vars: Record<string, string>): string {
  return content.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`);
}

export default function Documents() {
  const queryClient = useQueryClient();

  // Template form state
  const [templateOpen, setTemplateOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any | null>(null);
  const [templateName, setTemplateName] = useState("");
  const [templateCategory, setTemplateCategory] = useState<DocumentCategory>("lease");
  const [templateContent, setTemplateContent] = useState("");

  // Generate document dialog state
  const [generateOpen, setGenerateOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any | null>(null);
  const [generateResidentId, setGenerateResidentId] = useState<string>("");
  const [generateTitle, setGenerateTitle] = useState("");
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});

  // Preview dialog state
  const [previewDoc, setPreviewDoc] = useState<any | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Resident docs upload
  const [residentDocResidentId, setResidentDocResidentId] = useState("");
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const fileInputRef = useState<HTMLInputElement | null>(null);

  // ── Queries ──────────────────────────────────────────────────────────────

  const { data: templates, isLoading: templatesLoading } = useQuery({
    queryKey: ["document_templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("document_templates")
        .select("*")
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: generated, isLoading: generatedLoading } = useQuery({
    queryKey: ["generated_documents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("generated_documents")
        .select("*, residents(first_name, last_name), document_templates(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: residents } = useQuery({
    queryKey: ["residents_list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("residents")
        .select("id, first_name, last_name")
        .order("first_name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: residentDocs } = useQuery({
    queryKey: ["resident_documents", residentDocResidentId],
    queryFn: async () => {
      if (!residentDocResidentId) return [];
      const { data, error } = await supabase
        .from("resident_documents")
        .select("*")
        .eq("resident_id", residentDocResidentId)
        .order("uploaded_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!residentDocResidentId,
  });

  // ── Mutations ─────────────────────────────────────────────────────────────

  const saveTemplate = useMutation({
    mutationFn: async () => {
      const variables = extractVariables(templateContent);
      const { data: { user } } = await supabase.auth.getUser();

      if (editingTemplate) {
        const { error } = await supabase
          .from("document_templates")
          .update({
            name: templateName,
            category: templateCategory,
            template_content: templateContent,
            variables_json: variables,
          })
          .eq("id", editingTemplate.id);
        if (error) throw error;
        await logAudit("UPDATE", "document_templates", editingTemplate.id, {
          new: { name: templateName, category: templateCategory },
        });
      } else {
        const { error } = await supabase.from("document_templates").insert({
          name: templateName,
          category: templateCategory,
          template_content: templateContent,
          variables_json: variables,
          created_by: user?.id ?? null,
        });
        if (error) throw error;
        await logAudit("INSERT", "document_templates", undefined, {
          new: { name: templateName, category: templateCategory },
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["document_templates"] });
      toast({ title: editingTemplate ? "Template updated" : "Template created" });
      closeTemplateDialog();
    },
    onError: (err: any) => {
      toast({ title: err.message || "Failed to save template", variant: "destructive" });
    },
  });

  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("document_templates").delete().eq("id", id);
      if (error) throw error;
      await logAudit("DELETE", "document_templates", id, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["document_templates"] });
      toast({ title: "Template deleted" });
    },
    onError: (err: any) => {
      toast({ title: err.message || "Failed to delete", variant: "destructive" });
    },
  });

  const generateDocument = useMutation({
    mutationFn: async () => {
      if (!selectedTemplate) return;
      const { data: { user } } = await supabase.auth.getUser();
      const filled = fillTemplate(selectedTemplate.template_content, variableValues);
      const { error } = await supabase.from("generated_documents").insert({
        template_id: selectedTemplate.id,
        resident_id: generateResidentId || null,
        title: generateTitle || selectedTemplate.name,
        filled_content: filled,
        created_by: user?.id ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["generated_documents"] });
      toast({ title: "Document generated" });
      setGenerateOpen(false);
      setSelectedTemplate(null);
      setGenerateResidentId("");
      setGenerateTitle("");
      setVariableValues({});
    },
    onError: (err: any) => {
      toast({ title: err.message || "Failed to generate", variant: "destructive" });
    },
  });

  const deleteGenerated = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("generated_documents").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["generated_documents"] });
      toast({ title: "Document deleted" });
    },
  });

  const deleteResidentDoc = useMutation({
    mutationFn: async ({ id, file_path }: { id: string; file_path: string }) => {
      await supabase.storage.from("resident-documents").remove([file_path]);
      const { error } = await supabase.from("resident_documents").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resident_documents", residentDocResidentId] });
      toast({ title: "Document removed" });
    },
  });

  // ── Helpers ───────────────────────────────────────────────────────────────

  function openNewTemplate() {
    setEditingTemplate(null);
    setTemplateName("");
    setTemplateCategory("lease");
    setTemplateContent("");
    setTemplateOpen(true);
  }

  function openEditTemplate(t: any) {
    setEditingTemplate(t);
    setTemplateName(t.name);
    setTemplateCategory(t.category as DocumentCategory);
    setTemplateContent(t.template_content);
    setTemplateOpen(true);
  }

  function closeTemplateDialog() {
    setTemplateOpen(false);
    setEditingTemplate(null);
  }

  function openGenerate(t: any) {
    setSelectedTemplate(t);
    setGenerateTitle(t.name);
    const vars = extractVariables(t.template_content);
    const initial: Record<string, string> = {};
    vars.forEach((v) => (initial[v] = ""));
    setVariableValues(initial);
    setGenerateResidentId("");
    setGenerateOpen(true);
  }

  function downloadText(content: string, filename: string) {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleResidentDocUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!residentDocResidentId || !e.target.files?.length) return;
    setUploadingFiles(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      for (const file of Array.from(e.target.files)) {
        const path = `${residentDocResidentId}/${Date.now()}-${file.name}`;
        const { error: uploadErr } = await supabase.storage
          .from("resident-documents")
          .upload(path, file);
        if (uploadErr) throw uploadErr;
        const { data: { publicUrl } } = supabase.storage
          .from("resident-documents")
          .getPublicUrl(path);
        const { error: dbErr } = await supabase.from("resident_documents").insert({
          resident_id: residentDocResidentId,
          file_name: file.name,
          file_path: path,
          file_url: publicUrl,
          file_size: file.size,
          uploaded_by: user?.id ?? null,
        });
        if (dbErr) throw dbErr;
      }
      queryClient.invalidateQueries({ queryKey: ["resident_documents", residentDocResidentId] });
      toast({ title: "Files uploaded" });
    } catch (err: any) {
      toast({ title: err.message || "Upload failed", variant: "destructive" });
    } finally {
      setUploadingFiles(false);
      e.target.value = "";
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const detectedVars = extractVariables(templateContent);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <FileText className="h-8 w-8" />
          Documents
        </h1>
        <p className="text-muted-foreground">
          Manage templates, generate documents, and store resident files
        </p>
      </div>

      <Tabs defaultValue="templates">
        <TabsList>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="generated">Generated Docs</TabsTrigger>
          <TabsTrigger value="resident-docs">Resident Files</TabsTrigger>
        </TabsList>

        {/* ── Templates ─────────────────────────────────────────────── */}
        <TabsContent value="templates" className="space-y-4 mt-4">
          <div className="flex justify-end">
            <RoleGuard roles={["owner", "regional_manager", "house_manager"]}>
              <Dialog open={templateOpen} onOpenChange={setTemplateOpen}>
                <DialogTrigger asChild>
                  <Button onClick={openNewTemplate}>
                    <Plus className="mr-2 h-4 w-4" />
                    New Template
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>
                      {editingTemplate ? "Edit Template" : "New Template"}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label>Template Name</Label>
                        <Input
                          value={templateName}
                          onChange={(e) => setTemplateName(e.target.value)}
                          placeholder="e.g. Resident Lease Agreement"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>Category</Label>
                        <Select
                          value={templateCategory}
                          onValueChange={(v) => setTemplateCategory(v as DocumentCategory)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {CATEGORIES.map((c) => (
                              <SelectItem key={c.value} value={c.value}>
                                {c.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label>
                        Content{" "}
                        <span className="text-muted-foreground text-xs font-normal">
                          — use {"{{variable_name}}"} for merge fields
                        </span>
                      </Label>
                      <Textarea
                        value={templateContent}
                        onChange={(e) => setTemplateContent(e.target.value)}
                        rows={12}
                        placeholder={`This agreement is between {{resident_name}} and {{facility_name}}...\n\nDate: {{date}}\nMonthly Rent: ${{rent_amount}}`}
                        className="font-mono text-sm"
                      />
                    </div>
                    {detectedVars.length > 0 && (
                      <div className="text-sm text-muted-foreground">
                        Detected variables:{" "}
                        {detectedVars.map((v) => (
                          <Badge key={v} variant="secondary" className="mr-1 font-mono">
                            {v}
                          </Badge>
                        ))}
                      </div>
                    )}
                    <Button
                      className="w-full"
                      disabled={!templateName.trim() || !templateContent.trim() || saveTemplate.isPending}
                      onClick={() => saveTemplate.mutate()}
                    >
                      {saveTemplate.isPending ? "Saving…" : editingTemplate ? "Update Template" : "Create Template"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </RoleGuard>
          </div>

          {templatesLoading ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Loading…</p>
          ) : templates && templates.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {templates.map((t: any) => {
                const vars = Array.isArray(t.variables_json) ? t.variables_json : [];
                return (
                  <Card key={t.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-base leading-tight">{t.name}</CardTitle>
                        <Badge variant="outline" className="shrink-0 text-xs">
                          {CATEGORIES.find((c) => c.value === t.category)?.label ?? t.category}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {vars.length > 0 && (
                        <div className="text-xs text-muted-foreground">
                          Variables:{" "}
                          {(vars as string[]).map((v) => (
                            <code
                              key={v}
                              className="mr-1 rounded bg-muted px-1 py-0.5"
                            >
                              {v}
                            </code>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="flex-1"
                          onClick={() => openGenerate(t)}
                        >
                          <FileText className="mr-1 h-3 w-3" />
                          Generate
                        </Button>
                        <RoleGuard roles={["owner", "regional_manager", "house_manager"]}>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditTemplate(t)}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-destructive"
                            onClick={() => {
                              if (confirm("Delete this template?")) deleteTemplate.mutate(t.id);
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </RoleGuard>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No templates yet. Create your first template to get started.
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── Generated Documents ───────────────────────────────────── */}
        <TabsContent value="generated" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Generated Documents</CardTitle>
            </CardHeader>
            <CardContent>
              {generatedLoading ? (
                <p className="text-sm text-muted-foreground py-4 text-center">Loading…</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Template</TableHead>
                      <TableHead>Resident</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Signed</TableHead>
                      <TableHead className="w-[100px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {generated && generated.length > 0 ? (
                      generated.map((doc: any) => (
                        <TableRow key={doc.id}>
                          <TableCell className="font-medium">{doc.title}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {doc.document_templates?.name ?? "—"}
                          </TableCell>
                          <TableCell className="text-sm">
                            {doc.residents
                              ? `${doc.residents.first_name} ${doc.residents.last_name}`
                              : "—"}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(doc.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            {doc.signed_at ? (
                              <Badge variant="default" className="text-xs">
                                Signed
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs">
                                Unsigned
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setPreviewDoc(doc);
                                  setPreviewOpen(true);
                                }}
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() =>
                                  downloadText(
                                    doc.filled_content,
                                    `${doc.title.replace(/\s+/g, "_")}.txt`
                                  )
                                }
                              >
                                <Download className="h-3 w-3" />
                              </Button>
                              <RoleGuard roles={["owner", "regional_manager", "house_manager"]}>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-destructive"
                                  onClick={() => {
                                    if (confirm("Delete this document?"))
                                      deleteGenerated.mutate(doc.id);
                                  }}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </RoleGuard>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="text-center text-muted-foreground py-8"
                        >
                          No documents generated yet. Use a template to generate one.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Resident Files ────────────────────────────────────────── */}
        <TabsContent value="resident-docs" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Resident File Upload</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4 items-end">
                <div className="flex-1 space-y-1">
                  <Label>Select Resident</Label>
                  <Select
                    value={residentDocResidentId}
                    onValueChange={setResidentDocResidentId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a resident…" />
                    </SelectTrigger>
                    <SelectContent>
                      {(residents ?? []).map((r: any) => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.first_name} {r.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {residentDocResidentId && (
                  <div>
                    <Label htmlFor="resident-file-upload" className="cursor-pointer">
                      <Button
                        asChild
                        disabled={uploadingFiles}
                        variant="outline"
                      >
                        <span>
                          <Upload className="mr-2 h-4 w-4" />
                          {uploadingFiles ? "Uploading…" : "Upload Files"}
                        </span>
                      </Button>
                    </Label>
                    <input
                      id="resident-file-upload"
                      type="file"
                      multiple
                      className="hidden"
                      onChange={handleResidentDocUpload}
                    />
                  </div>
                )}
              </div>

              {residentDocResidentId && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>File Name</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Uploaded</TableHead>
                      <TableHead className="w-[80px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {residentDocs && residentDocs.length > 0 ? (
                      (residentDocs as any[]).map((doc) => (
                        <TableRow key={doc.id}>
                          <TableCell className="font-medium">
                            <a
                              href={doc.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 hover:underline"
                            >
                              {doc.file_name}
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {doc.file_size
                              ? `${(doc.file_size / 1024).toFixed(1)} KB`
                              : "—"}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(doc.uploaded_at ?? doc.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive"
                              onClick={() =>
                                deleteResidentDoc.mutate({
                                  id: doc.id,
                                  file_path: doc.file_path,
                                })
                              }
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="text-center text-muted-foreground py-6"
                        >
                          No files uploaded for this resident yet.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── Generate Document Dialog ───────────────────────────────── */}
      <Dialog open={generateOpen} onOpenChange={setGenerateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Generate Document</DialogTitle>
          </DialogHeader>
          {selectedTemplate && (
            <div className="space-y-4">
              <div className="space-y-1">
                <Label>Document Title</Label>
                <Input
                  value={generateTitle}
                  onChange={(e) => setGenerateTitle(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label>Resident (optional)</Label>
                <Select
                  value={generateResidentId}
                  onValueChange={setGenerateResidentId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select resident…" />
                  </SelectTrigger>
                  <SelectContent>
                    {(residents ?? []).map((r: any) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.first_name} {r.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {Object.keys(variableValues).length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Fill Variables</Label>
                  {Object.keys(variableValues).map((varName) => (
                    <div key={varName} className="space-y-1">
                      <Label className="text-xs text-muted-foreground font-mono">
                        {"{{"}{varName}{"}}"}
                      </Label>
                      <Input
                        value={variableValues[varName]}
                        onChange={(e) =>
                          setVariableValues((prev) => ({
                            ...prev,
                            [varName]: e.target.value,
                          }))
                        }
                        placeholder={`Enter ${varName}…`}
                      />
                    </div>
                  ))}
                </div>
              )}

              <Button
                className="w-full"
                disabled={!generateTitle.trim() || generateDocument.isPending}
                onClick={() => generateDocument.mutate()}
              >
                {generateDocument.isPending ? "Generating…" : "Generate Document"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Preview Dialog ─────────────────────────────────────────── */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{previewDoc?.title}</DialogTitle>
          </DialogHeader>
          {previewDoc && (
            <div className="space-y-4">
              <pre className="text-sm whitespace-pre-wrap font-sans bg-muted p-4 rounded-lg">
                {previewDoc.filled_content}
              </pre>
              <Button
                variant="outline"
                onClick={() =>
                  downloadText(
                    previewDoc.filled_content,
                    `${previewDoc.title.replace(/\s+/g, "_")}.txt`
                  )
                }
              >
                <Download className="mr-2 h-4 w-4" />
                Download as Text
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
