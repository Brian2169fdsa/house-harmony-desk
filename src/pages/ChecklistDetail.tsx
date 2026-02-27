import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  MinusCircle,
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  Paperclip,
  Lock,
  User,
  Calendar,
  MessageSquare,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";
import type { Json } from "@/integrations/supabase/types";

interface ChecklistItem {
  id: string;
  checklist_id: string;
  template_item_id: string | null;
  title: string;
  description: string | null;
  category: string | null;
  order_index: number;
  status: string;
  assignee: string | null;
  due_date: string | null;
  completed_at: string | null;
  completed_by: string | null;
  depends_on: string[] | null;
  notes: string | null;
  is_required: boolean;
  created_at: string;
  checklist_item_attachments: Attachment[];
}

interface Attachment {
  id: string;
  file_name: string;
  file_url: string;
  file_size: number | null;
  mime_type: string | null;
  uploaded_by: string | null;
  uploaded_at: string;
}

interface AuditEntry {
  id: string;
  action: string;
  old_value: Json;
  new_value: Json;
  performed_by: string | null;
  performed_at: string;
  checklist_item_id: string | null;
}

interface Checklist {
  id: string;
  title: string;
  status: string;
  assignee: string | null;
  due_date: string | null;
  start_date: string | null;
  completed_at: string | null;
  notes: string | null;
  created_at: string;
  checklist_templates: { name: string; category: string } | null;
}

const ITEM_STATUS_CONFIG: Record<
  string,
  { label: string; variant: string; icon: React.ElementType; color: string }
> = {
  pending: { label: "Pending", variant: "secondary", icon: Clock, color: "text-muted-foreground" },
  in_progress: { label: "In Progress", variant: "default", icon: AlertCircle, color: "text-blue-500" },
  completed: { label: "Done", variant: "default", icon: CheckCircle2, color: "text-green-500" },
  skipped: { label: "Skipped", variant: "outline", icon: MinusCircle, color: "text-muted-foreground" },
  blocked: { label: "Blocked", variant: "destructive", icon: Lock, color: "text-red-500" },
};

const CHECKLIST_STATUS_OPTIONS = [
  { value: "not_started", label: "Not Started" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

export default function ChecklistDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [editingItem, setEditingItem] = useState<ChecklistItem | null>(null);
  const [noteTexts, setNoteTexts] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  // Fetch checklist
  const { data: checklist, isLoading: checklistLoading } = useQuery({
    queryKey: ["checklist", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("checklists")
        .select("*, checklist_templates(name, category)")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data as Checklist;
    },
    enabled: !!id,
  });

  // Fetch items with attachments
  const { data: items = [], isLoading: itemsLoading } = useQuery({
    queryKey: ["checklist_items", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("checklist_items")
        .select("*, checklist_item_attachments(*)")
        .eq("checklist_id", id!)
        .order("order_index");
      if (error) throw error;
      return (data ?? []) as ChecklistItem[];
    },
    enabled: !!id,
  });

  // Fetch audit log
  const { data: auditLog = [] } = useQuery({
    queryKey: ["checklist_audit", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("checklist_audit_log")
        .select("*")
        .eq("checklist_id", id!)
        .order("performed_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as AuditEntry[];
    },
    enabled: !!id,
  });

  // Build set of completed template_item_ids for dependency resolution
  const completedTemplateIds = useMemo(() => {
    return new Set(
      items
        .filter((i) => i.status === "completed" || i.status === "skipped")
        .map((i) => i.template_item_id)
        .filter(Boolean) as string[]
    );
  }, [items]);

  const isBlocked = (item: ChecklistItem) => {
    if (!item.depends_on?.length) return false;
    return item.depends_on.some((dep) => !completedTemplateIds.has(dep));
  };

  const getBlockedByItems = (item: ChecklistItem) => {
    if (!item.depends_on?.length) return [];
    return item.depends_on
      .filter((dep) => !completedTemplateIds.has(dep))
      .map((dep) => items.find((i) => i.template_item_id === dep))
      .filter(Boolean) as ChecklistItem[];
  };

  // Progress
  const progress = useMemo(() => {
    if (!items.length) return 0;
    const done = items.filter(
      (i) => i.status === "completed" || i.status === "skipped"
    ).length;
    return Math.round((done / items.length) * 100);
  }, [items]);

  // Grouped by category
  const categories = useMemo(() => {
    const cats = new Set(items.map((i) => i.category ?? "General"));
    return Array.from(cats);
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const catMatch =
        filterCategory === "all" || item.category === filterCategory;
      const statusMatch =
        filterStatus === "all" || item.status === filterStatus;
      return catMatch && statusMatch;
    });
  }, [items, filterCategory, filterStatus]);

  // Update item status
  const updateItemStatus = useMutation({
    mutationFn: async ({
      item,
      status,
    }: {
      item: ChecklistItem;
      status: string;
    }) => {
      const now = new Date().toISOString();
      const updates: Record<string, any> = { status };
      if (status === "completed") {
        updates.completed_at = now;
        updates.completed_by = "current_user";
      } else {
        updates.completed_at = null;
        updates.completed_by = null;
      }

      const { error } = await supabase
        .from("checklist_items")
        .update(updates)
        .eq("id", item.id);
      if (error) throw error;

      await supabase.from("checklist_audit_log").insert({
        checklist_id: id!,
        checklist_item_id: item.id,
        action: "item_status_changed",
        old_value: { status: item.status } as Json,
        new_value: { status, title: item.title } as Json,
        performed_by: "current_user",
        performed_at: now,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["checklist_items", id] });
      queryClient.invalidateQueries({ queryKey: ["checklist_audit", id] });
      queryClient.invalidateQueries({ queryKey: ["checklists"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // Update item details
  const updateItemDetails = useMutation({
    mutationFn: async (item: ChecklistItem) => {
      const { error } = await supabase
        .from("checklist_items")
        .update({
          assignee: item.assignee,
          due_date: item.due_date,
          notes: item.notes,
        })
        .eq("id", item.id);
      if (error) throw error;

      await supabase.from("checklist_audit_log").insert({
        checklist_id: id!,
        checklist_item_id: item.id,
        action: "item_updated",
        new_value: {
          assignee: item.assignee,
          due_date: item.due_date,
          title: item.title,
        } as Json,
        performed_by: "current_user",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["checklist_items", id] });
      queryClient.invalidateQueries({ queryKey: ["checklist_audit", id] });
      setEditingItem(null);
      toast.success("Item updated");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // Update checklist status
  const updateChecklistStatus = useMutation({
    mutationFn: async (status: string) => {
      const updates: Record<string, any> = { status };
      if (status === "completed") updates.completed_at = new Date().toISOString();
      const { error } = await supabase
        .from("checklists")
        .update(updates)
        .eq("id", id!);
      if (error) throw error;

      await supabase.from("checklist_audit_log").insert({
        checklist_id: id!,
        action: "checklist_status_changed",
        old_value: { status: checklist?.status } as Json,
        new_value: { status } as Json,
        performed_by: "current_user",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["checklist", id] });
      queryClient.invalidateQueries({ queryKey: ["checklists"] });
      queryClient.invalidateQueries({ queryKey: ["checklist_audit", id] });
      toast.success("Checklist updated");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // Add note to item
  const addNote = useMutation({
    mutationFn: async ({ item, note }: { item: ChecklistItem; note: string }) => {
      const combined = item.notes
        ? `${item.notes}\n\n[${format(new Date(), "MMM d, yyyy HH:mm")}] ${note}`
        : `[${format(new Date(), "MMM d, yyyy HH:mm")}] ${note}`;
      const { error } = await supabase
        .from("checklist_items")
        .update({ notes: combined })
        .eq("id", item.id);
      if (error) throw error;

      await supabase.from("checklist_audit_log").insert({
        checklist_id: id!,
        checklist_item_id: item.id,
        action: "note_added",
        new_value: { note, title: item.title } as Json,
        performed_by: "current_user",
      });

      return item.id;
    },
    onSuccess: (itemId) => {
      queryClient.invalidateQueries({ queryKey: ["checklist_items", id] });
      queryClient.invalidateQueries({ queryKey: ["checklist_audit", id] });
      setNoteTexts((prev) => { const next = { ...prev }; delete next[itemId]; return next; });
      toast.success("Note added");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // Add attachment
  const addAttachment = useMutation({
    mutationFn: async ({
      item,
      file,
    }: {
      item: ChecklistItem;
      file: File;
    }) => {
      setUploading(true);
      const path = `${id}/${item.id}/${Date.now()}_${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("checklist-attachments")
        .upload(path, file);
      setUploading(false);
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage
        .from("checklist-attachments")
        .getPublicUrl(uploadData.path);
      const fileUrl = urlData.publicUrl;
      const fileName = file.name;

      const { error } = await supabase.from("checklist_item_attachments").insert({
        checklist_item_id: item.id,
        file_name: fileName,
        file_url: fileUrl,
        file_size: file?.size ?? null,
        mime_type: file?.type ?? null,
        uploaded_by: "current_user",
      });
      if (error) throw error;

      await supabase.from("checklist_audit_log").insert({
        checklist_id: id!,
        checklist_item_id: item.id,
        action: "attachment_added",
        new_value: { file_name: fileName, title: item.title } as Json,
        performed_by: "current_user",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["checklist_items", id] });
      queryClient.invalidateQueries({ queryKey: ["checklist_audit", id] });
      toast.success("Attachment added");
    },
    onError: (err: Error) => {
      setUploading(false);
      toast.error(err.message);
    },
  });

  const toggleExpand = (itemId: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      next.has(itemId) ? next.delete(itemId) : next.add(itemId);
      return next;
    });
  };

  if (checklistLoading || itemsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <p className="text-muted-foreground">Loading checklist...</p>
      </div>
    );
  }

  if (!checklist) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Checklist not found.</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => navigate("/checklists")}
        >
          Back to Checklists
        </Button>
      </div>
    );
  }

  const itemsByCategory = categories.reduce<Record<string, ChecklistItem[]>>(
    (acc, cat) => {
      acc[cat] = filteredItems.filter(
        (i) => (i.category ?? "General") === cat
      );
      return acc;
    },
    {}
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/checklists")}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
      </div>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap mb-1">
            <h1 className="text-2xl font-bold">{checklist.title}</h1>
            {checklist.checklist_templates && (
              <Badge variant="outline">
                {checklist.checklist_templates.name}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
            {checklist.assignee && (
              <span className="flex items-center gap-1">
                <User className="h-3.5 w-3.5" />
                {checklist.assignee}
              </span>
            )}
            {checklist.due_date && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                Due {format(new Date(checklist.due_date), "MMM d, yyyy")}
              </span>
            )}
            <span>
              Created{" "}
              {formatDistanceToNow(new Date(checklist.created_at), {
                addSuffix: true,
              })}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={checklist.status}
            onValueChange={(v) => updateChecklistStatus.mutate(v)}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CHECKLIST_STATUS_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Progress Bar */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium">Overall Progress</span>
                <span className="text-muted-foreground">
                  {
                    items.filter(
                      (i) =>
                        i.status === "completed" || i.status === "skipped"
                    ).length
                  }{" "}
                  / {items.length} items
                </span>
              </div>
              <Progress value={progress} className="h-3" />
            </div>
            <span className="text-2xl font-bold text-primary w-16 text-right">
              {progress}%
            </span>
          </div>
          <div className="grid grid-cols-3 md:grid-cols-5 gap-2 mt-4 text-center text-xs">
            {Object.entries(ITEM_STATUS_CONFIG).map(([status, cfg]) => {
              const count = items.filter((i) => i.status === status).length;
              return (
                <div key={status} className="space-y-1">
                  <p className="text-lg font-bold">{count}</p>
                  <p className="text-muted-foreground">{cfg.label}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="items">
        <TabsList>
          <TabsTrigger value="items">Items ({items.length})</TabsTrigger>
          <TabsTrigger value="audit">Audit Trail ({auditLog.length})</TabsTrigger>
        </TabsList>

        {/* Items Tab */}
        <TabsContent value="items" className="space-y-4">
          {/* Filters */}
          <div className="flex gap-3 flex-wrap">
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {Object.entries(ITEM_STATUS_CONFIG).map(([k, v]) => (
                  <SelectItem key={k} value={k}>
                    {v.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Items grouped by category */}
          {Object.entries(itemsByCategory).map(([cat, catItems]) => {
            if (!catItems.length) return null;
            const catDone = catItems.filter(
              (i) => i.status === "completed" || i.status === "skipped"
            ).length;

            return (
              <Card key={cat}>
                <CardHeader className="py-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{cat}</CardTitle>
                    <span className="text-sm text-muted-foreground">
                      {catDone}/{catItems.length}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 space-y-1">
                  {catItems.map((item) => {
                    const cfg =
                      ITEM_STATUS_CONFIG[item.status] ??
                      ITEM_STATUS_CONFIG.pending;
                    const StatusIcon = cfg.icon;
                    const expanded = expandedItems.has(item.id);
                    const blocked = isBlocked(item);
                    const blockedByItems = getBlockedByItems(item);
                    const effectiveStatus =
                      blocked && item.status === "pending" ? "blocked" : item.status;
                    const effectiveCfg =
                      ITEM_STATUS_CONFIG[effectiveStatus] ?? cfg;
                    const EffectiveIcon = effectiveCfg.icon;

                    return (
                      <Collapsible
                        key={item.id}
                        open={expanded}
                        onOpenChange={() => toggleExpand(item.id)}
                      >
                        <CollapsibleTrigger asChild>
                          <div className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer group">
                            {/* Status toggle button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (blocked && item.status === "pending") {
                                  toast.error(
                                    `Blocked by: ${blockedByItems
                                      .map((b) => b.title)
                                      .join(", ")}`
                                  );
                                  return;
                                }
                                const next =
                                  item.status === "pending" ||
                                  item.status === "blocked"
                                    ? "completed"
                                    : item.status === "in_progress"
                                    ? "completed"
                                    : "pending";
                                updateItemStatus.mutate({ item, status: next });
                              }}
                              className="flex-shrink-0"
                            >
                              <EffectiveIcon
                                className={`h-5 w-5 ${effectiveCfg.color}`}
                              />
                            </button>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span
                                  className={`text-sm font-medium ${
                                    item.status === "completed"
                                      ? "line-through text-muted-foreground"
                                      : ""
                                  }`}
                                >
                                  {item.title}
                                </span>
                                {!item.is_required && (
                                  <Badge
                                    variant="outline"
                                    className="text-xs py-0"
                                  >
                                    Optional
                                  </Badge>
                                )}
                                {blocked && item.status === "pending" && (
                                  <Badge
                                    variant="destructive"
                                    className="text-xs py-0"
                                  >
                                    <Lock className="h-2.5 w-2.5 mr-1" />
                                    Blocked
                                  </Badge>
                                )}
                                {item.checklist_item_attachments.length > 0 && (
                                  <Badge
                                    variant="outline"
                                    className="text-xs py-0"
                                  >
                                    <Paperclip className="h-2.5 w-2.5 mr-1" />
                                    {item.checklist_item_attachments.length}
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                                {item.assignee && (
                                  <span>{item.assignee}</span>
                                )}
                                {item.due_date && (
                                  <span>
                                    Due{" "}
                                    {format(
                                      new Date(item.due_date),
                                      "MMM d"
                                    )}
                                  </span>
                                )}
                                {item.completed_at && (
                                  <span className="text-green-600">
                                    Completed{" "}
                                    {format(
                                      new Date(item.completed_at),
                                      "MMM d"
                                    )}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 px-2 text-xs"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingItem({ ...item });
                                }}
                              >
                                Edit
                              </Button>
                              {item.status !== "skipped" && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 px-2 text-xs text-muted-foreground"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateItemStatus.mutate({
                                      item,
                                      status: "skipped",
                                    });
                                  }}
                                >
                                  Skip
                                </Button>
                              )}
                            </div>

                            {expanded ? (
                              <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            )}
                          </div>
                        </CollapsibleTrigger>

                        <CollapsibleContent>
                          <div className="ml-8 pl-3 border-l space-y-3 pb-3">
                            {item.description && (
                              <p className="text-sm text-muted-foreground">
                                {item.description}
                              </p>
                            )}

                            {/* Dependencies */}
                            {blockedByItems.length > 0 && (
                              <div className="text-sm">
                                <p className="font-medium text-red-600 flex items-center gap-1">
                                  <Lock className="h-3.5 w-3.5" />
                                  Blocked by:
                                </p>
                                <ul className="mt-1 space-y-1 ml-4">
                                  {blockedByItems.map((b) => (
                                    <li
                                      key={b.id}
                                      className="text-muted-foreground"
                                    >
                                      • {b.title}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Notes */}
                            {item.notes && (
                              <div className="bg-muted/50 rounded p-2 text-sm whitespace-pre-wrap">
                                {item.notes}
                              </div>
                            )}

                            {/* Add note */}
                            <div className="flex gap-2">
                              <Input
                                placeholder="Add a note..."
                                className="text-sm h-8"
                                value={noteTexts[item.id] ?? ""}
                                onChange={(e) =>
                                  setNoteTexts((prev) => ({
                                    ...prev,
                                    [item.id]: e.target.value,
                                  }))
                                }
                              />
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 px-3"
                                disabled={!noteTexts[item.id]?.trim()}
                                onClick={() =>
                                  addNote.mutate({
                                    item,
                                    note: noteTexts[item.id] ?? "",
                                  })
                                }
                              >
                                <MessageSquare className="h-3.5 w-3.5" />
                              </Button>
                            </div>

                            {/* Attachments */}
                            {item.checklist_item_attachments.length > 0 && (
                              <div className="space-y-1">
                                <p className="text-xs font-medium text-muted-foreground">
                                  Attachments
                                </p>
                                {item.checklist_item_attachments.map((att) => (
                                  <a
                                    key={att.id}
                                    href={att.file_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center gap-2 text-xs text-primary hover:underline"
                                  >
                                    <Paperclip className="h-3 w-3" />
                                    {att.file_name}
                                  </a>
                                ))}
                              </div>
                            )}

                            {/* Upload attachment */}
                            <div className="space-y-1">
                              <p className="text-xs font-medium text-muted-foreground">
                                Add Attachment
                              </p>
                              <div className="flex gap-2">
                                <label className="flex-1">
                                  <input
                                    type="file"
                                    className="hidden"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        addAttachment.mutate({ item, file });
                                        e.target.value = "";
                                      }
                                    }}
                                  />
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-xs w-full"
                                    disabled={uploading}
                                    asChild
                                  >
                                    <span>
                                      <Upload className="h-3 w-3 mr-1" />
                                      {uploading ? "Uploading..." : "Upload File"}
                                    </span>
                                  </Button>
                                </label>
                              </div>
                            </div>
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    );
                  })}
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        {/* Audit Trail Tab */}
        <TabsContent value="audit">
          <Card>
            <CardContent className="pt-4">
              {auditLog.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No activity recorded yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {auditLog.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex gap-3 text-sm border-b pb-3 last:border-0"
                    >
                      <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium capitalize">
                            {entry.action.replace(/_/g, " ")}
                          </span>
                          <span className="text-muted-foreground text-xs">
                            {formatDistanceToNow(
                              new Date(entry.performed_at),
                              { addSuffix: true }
                            )}
                          </span>
                        </div>
                        {entry.new_value &&
                          typeof entry.new_value === "object" && (
                            <p className="text-muted-foreground text-xs mt-0.5">
                              {(entry.new_value as Record<string, string>).title ||
                                (entry.new_value as Record<string, string>).note ||
                                JSON.stringify(entry.new_value).substring(0, 100)}
                            </p>
                          )}
                        {entry.performed_by && (
                          <p className="text-muted-foreground text-xs">
                            by {entry.performed_by}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Item Dialog */}
      {editingItem && (
        <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Item</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="font-medium text-sm">{editingItem.title}</p>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={editingItem.status}
                  onValueChange={(v) =>
                    setEditingItem((i) => i && { ...i, status: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ITEM_STATUS_CONFIG).map(([k, v]) => (
                      <SelectItem key={k} value={k}>
                        {v.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Assignee</Label>
                  <Input
                    value={editingItem.assignee ?? ""}
                    onChange={(e) =>
                      setEditingItem((i) =>
                        i && { ...i, assignee: e.target.value }
                      )
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Due Date</Label>
                  <Input
                    type="date"
                    value={editingItem.due_date ?? ""}
                    onChange={(e) =>
                      setEditingItem((i) =>
                        i && { ...i, due_date: e.target.value }
                      )
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={editingItem.notes ?? ""}
                  onChange={(e) =>
                    setEditingItem((i) => i && { ...i, notes: e.target.value })
                  }
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingItem(null)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  updateItemDetails.mutate(editingItem);
                  if (editingItem.status !== items.find(i => i.id === editingItem.id)?.status) {
                    updateItemStatus.mutate({ item: editingItem, status: editingItem.status });
                  }
                }}
                disabled={updateItemDetails.isPending}
              >
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
