import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  FileText,
  Plus,
  Eye,
  Trash2,
  Download,
  Clock,
  FileCheck,
} from "lucide-react";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";

interface DocumentTemplate {
  id: string;
  name: string;
  category: string;
  template_content: string;
  variables_json: any;
  created_at: string;
}

interface GeneratedDocument {
  id: string;
  template_id: string | null;
  title: string;
  filled_content: string;
  created_at: string;
  document_templates: { name: string; category: string } | null;
}

const CATEGORY_LABELS: Record<string, string> = {
  lease: "Lease",
  house_rules: "House Rules",
  intake_form: "Intake Form",
  incident_report: "Incident Report",
  consent: "Consent",
  other: "Other",
};

const CATEGORY_COLORS: Record<string, string> = {
  lease: "default",
  house_rules: "secondary",
  intake_form: "default",
  incident_report: "destructive",
  consent: "outline",
  other: "outline",
};

export default function Documents() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [previewDoc, setPreviewDoc] = useState<GeneratedDocument | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<GeneratedDocument | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch document templates
  const { data: templates = [], isLoading: templatesLoading } = useQuery({
    queryKey: ["document_templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("document_templates")
        .select("*")
        .order("name");
      if (error) throw error;
      return (data ?? []) as DocumentTemplate[];
    },
  });

  // Fetch generated documents
  const { data: generated = [], isLoading: generatedLoading } = useQuery({
    queryKey: ["generated_documents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("generated_documents")
        .select("*, document_templates(name, category)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as GeneratedDocument[];
    },
  });

  // Delete generated document
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("generated_documents")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["generated_documents"] });
      setDeleteTarget(null);
      toast.success("Document deleted");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const filteredGenerated = generated.filter(
    (d) =>
      !searchQuery ||
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.document_templates?.name ?? "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
  );

  const printDocument = (doc: GeneratedDocument) => {
    const win = window.open("", "_blank");
    if (!win) {
      toast.error("Pop-up blocked — allow pop-ups to print.");
      return;
    }
    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${doc.title}</title>
        <style>
          body { font-family: Georgia, serif; max-width: 750px; margin: 40px auto; padding: 0 20px; color: #111; }
          h1 { font-size: 22px; } h2 { font-size: 18px; } h3 { font-size: 15px; margin-top: 20px; }
          table { width: 100%; border-collapse: collapse; }
          td, th { padding: 6px 8px; border: 1px solid #ccc; font-size: 13px; }
          ul, ol { margin: 8px 0 8px 20px; } li { margin: 4px 0; }
          .document { line-height: 1.6; }
          @media print { body { margin: 20px; } }
        </style>
      </head>
      <body>${doc.filled_content}</body>
      </html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 500);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Documents</h1>
          <p className="text-muted-foreground">
            Generate and manage facility documents from templates
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{templates.length}</p>
                <p className="text-sm text-muted-foreground">Templates</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <FileCheck className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{generated.length}</p>
                <p className="text-sm text-muted-foreground">Generated</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="templates">
        <TabsList>
          <TabsTrigger value="templates">
            Templates ({templates.length})
          </TabsTrigger>
          <TabsTrigger value="generated">
            Generated ({generated.length})
          </TabsTrigger>
        </TabsList>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-3">
          {templatesLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading templates...
            </div>
          ) : templates.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium">No templates found</p>
                <p className="text-muted-foreground">
                  Run the database migration to load the 5 pre-built document templates.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {templates.map((tmpl) => {
                const varCount = Array.isArray(tmpl.variables_json)
                  ? (tmpl.variables_json as any[]).length
                  : 0;
                return (
                  <Card
                    key={tmpl.id}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h3 className="font-semibold">{tmpl.name}</h3>
                            <Badge
                              variant={
                                (CATEGORY_COLORS[tmpl.category] as any) ??
                                "outline"
                              }
                              className="text-xs"
                            >
                              {CATEGORY_LABELS[tmpl.category] ?? tmpl.category}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {varCount} variable{varCount !== 1 ? "s" : ""}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Added{" "}
                            {formatDistanceToNow(new Date(tmpl.created_at), {
                              addSuffix: true,
                            })}
                          </p>
                        </div>
                        <Button
                          onClick={() =>
                            navigate(`/documents/generate/${tmpl.id}`)
                          }
                          size="sm"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Generate
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Generated Documents Tab */}
        <TabsContent value="generated" className="space-y-3">
          <Input
            placeholder="Search generated documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-xs"
          />
          {generatedLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading...
            </div>
          ) : filteredGenerated.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium">No documents generated yet</p>
                <p className="text-muted-foreground">
                  Select a template above and fill in the variables to generate
                  your first document.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {filteredGenerated.map((doc) => (
                <Card key={doc.id}>
                  <CardContent className="py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-medium truncate">{doc.title}</h3>
                          {doc.document_templates && (
                            <Badge
                              variant={
                                (CATEGORY_COLORS[
                                  doc.document_templates.category
                                ] as any) ?? "outline"
                              }
                              className="text-xs"
                            >
                              {doc.document_templates.name}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Clock className="h-3 w-3" />
                          {format(
                            new Date(doc.created_at),
                            "MMM d, yyyy 'at' h:mm a"
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setPreviewDoc(doc)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => printDocument(doc)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeleteTarget(doc)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Preview Dialog */}
      {previewDoc && (
        <Dialog open={!!previewDoc} onOpenChange={() => setPreviewDoc(null)}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{previewDoc.title}</DialogTitle>
            </DialogHeader>
            <div
              className="prose prose-sm max-w-none border rounded p-4 text-sm"
              dangerouslySetInnerHTML={{ __html: previewDoc.filled_content }}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setPreviewDoc(null)}>
                Close
              </Button>
              <Button onClick={() => printDocument(previewDoc)}>
                <Download className="h-4 w-4 mr-2" />
                Print / Save PDF
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirm Dialog */}
      {deleteTarget && (
        <Dialog
          open={!!deleteTarget}
          onOpenChange={() => setDeleteTarget(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Document</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete "{deleteTarget.title}"? This
              cannot be undone.
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteTarget(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => deleteMutation.mutate(deleteTarget.id)}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? "Deleting..." : "Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
