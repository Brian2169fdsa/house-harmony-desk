import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft,
  Eye,
  EyeOff,
  Download,
  Save,
  FileText,
} from "lucide-react";
import { toast } from "sonner";

interface VariableDef {
  name: string;
  label: string;
  type: "text" | "date" | "number" | "textarea";
  required: boolean;
  default_value?: string;
}

interface DocumentTemplate {
  id: string;
  name: string;
  category: string;
  template_content: string;
  variables_json: VariableDef[] | any;
  created_at: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  lease: "Lease",
  house_rules: "House Rules",
  intake_form: "Intake Form",
  incident_report: "Incident Report",
  consent: "Consent",
  other: "Other",
};

function substituteVariables(
  content: string,
  values: Record<string, string>
): string {
  return content.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return values[key] !== undefined ? values[key] : match;
  });
}

export default function DocumentGenerate() {
  const { templateId } = useParams<{ templateId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [values, setValues] = useState<Record<string, string>>({});
  const [docTitle, setDocTitle] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  // Fetch template
  const { data: template, isLoading } = useQuery({
    queryKey: ["document_template", templateId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("document_templates")
        .select("*")
        .eq("id", templateId!)
        .single();
      if (error) throw error;
      return data as DocumentTemplate;
    },
    enabled: !!templateId,
  });

  // Initialize values from template defaults
  useEffect(() => {
    if (template) {
      const vars = Array.isArray(template.variables_json)
        ? (template.variables_json as VariableDef[])
        : [];
      const defaults: Record<string, string> = {};
      vars.forEach((v) => {
        defaults[v.name] = v.default_value ?? "";
      });
      // Auto-populate today's date for date fields
      const today = new Date().toISOString().split("T")[0];
      vars.forEach((v) => {
        if (v.type === "date" && !v.default_value) {
          defaults[v.name] = today;
        }
      });
      setValues(defaults);
      setDocTitle(template.name);
    }
  }, [template]);

  const variables = useMemo<VariableDef[]>(() => {
    if (!template) return [];
    return Array.isArray(template.variables_json)
      ? (template.variables_json as VariableDef[])
      : [];
  }, [template]);

  // Rendered preview
  const renderedContent = useMemo(() => {
    if (!template) return "";
    return substituteVariables(template.template_content, values);
  }, [template, values]);

  // Check for unfilled required variables
  const missingRequired = useMemo(() => {
    return variables
      .filter((v) => v.required && !values[v.name]?.trim())
      .map((v) => v.label);
  }, [variables, values]);

  // Find unfilled variable placeholders in rendered output
  const unfilledPlaceholders = useMemo(() => {
    const matches = renderedContent.match(/\{\{(\w+)\}\}/g);
    return matches ? [...new Set(matches)] : [];
  }, [renderedContent]);

  // Save generated document
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!docTitle.trim()) throw new Error("Document title is required");

      const { error } = await supabase.from("generated_documents").insert({
        template_id: templateId!,
        title: docTitle.trim(),
        filled_content: renderedContent,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["generated_documents"] });
      toast.success("Document saved");
      navigate("/documents");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const printDocument = () => {
    const win = window.open("", "_blank");
    if (!win) {
      toast.error("Pop-up blocked — allow pop-ups to print.");
      return;
    }
    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${docTitle || (template?.name ?? "Document")}</title>
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
      <body>${renderedContent}</body>
      </html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 500);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <p className="text-muted-foreground">Loading template...</p>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Template not found.</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => navigate("/documents")}
        >
          Back to Documents
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/documents")}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
      </div>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FileText className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Generate Document</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">{template.name}</span>
            <Badge variant="outline">
              {CATEGORY_LABELS[template.category] ?? template.category}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
          >
            {showPreview ? (
              <>
                <EyeOff className="h-4 w-4 mr-1" />
                Hide Preview
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 mr-1" />
                Show Preview
              </>
            )}
          </Button>
          <Button variant="outline" size="sm" onClick={printDocument}>
            <Download className="h-4 w-4 mr-1" />
            Print / PDF
          </Button>
          <Button
            size="sm"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
          >
            <Save className="h-4 w-4 mr-1" />
            {saveMutation.isPending ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      <div className={`grid gap-6 ${showPreview ? "lg:grid-cols-2" : ""}`}>
        {/* Variables Form */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Document Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="doc-title">Document Title *</Label>
                <Input
                  id="doc-title"
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  placeholder="e.g. Resident Agreement — John Smith"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                Fill in Variables ({variables.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {variables.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  This template has no variables — it will be generated as-is.
                </p>
              ) : (
                variables.map((v) => (
                  <div key={v.name} className="space-y-1.5">
                    <Label htmlFor={`var-${v.name}`}>
                      {v.label}
                      {v.required && (
                        <span className="text-destructive ml-1">*</span>
                      )}
                    </Label>
                    {v.type === "textarea" ? (
                      <Textarea
                        id={`var-${v.name}`}
                        value={values[v.name] ?? ""}
                        onChange={(e) =>
                          setValues((prev) => ({
                            ...prev,
                            [v.name]: e.target.value,
                          }))
                        }
                        placeholder={v.label}
                        rows={3}
                      />
                    ) : (
                      <Input
                        id={`var-${v.name}`}
                        type={v.type === "date" ? "date" : v.type === "number" ? "number" : "text"}
                        value={values[v.name] ?? ""}
                        onChange={(e) =>
                          setValues((prev) => ({
                            ...prev,
                            [v.name]: e.target.value,
                          }))
                        }
                        placeholder={v.label}
                      />
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Warnings */}
          {(missingRequired.length > 0 || unfilledPlaceholders.length > 0) && (
            <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
              <CardContent className="pt-4 pb-4 space-y-2">
                {missingRequired.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                      Required fields missing:
                    </p>
                    <ul className="text-sm text-amber-600 dark:text-amber-500 ml-4 list-disc">
                      {missingRequired.map((f) => (
                        <li key={f}>{f}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {unfilledPlaceholders.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                      Unfilled placeholders in document:
                    </p>
                    <p className="text-xs text-amber-600 dark:text-amber-500 ml-4">
                      {unfilledPlaceholders.join(", ")}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <div className="flex gap-2">
            <Button
              className="flex-1"
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
            >
              <Save className="h-4 w-4 mr-2" />
              {saveMutation.isPending ? "Saving..." : "Save Document"}
            </Button>
            <Button variant="outline" onClick={printDocument}>
              <Download className="h-4 w-4 mr-2" />
              Print / PDF
            </Button>
          </div>
        </div>

        {/* Preview Panel */}
        {showPreview && (
          <div className="sticky top-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  Live Preview
                  {unfilledPlaceholders.length === 0 ? (
                    <Badge variant="default" className="text-xs">
                      Ready
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs">
                      {unfilledPlaceholders.length} unfilled
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className="prose prose-sm max-w-none border rounded p-4 max-h-[70vh] overflow-y-auto text-sm bg-white dark:bg-gray-950"
                  dangerouslySetInnerHTML={{ __html: renderedContent }}
                />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
