import { useState, useRef, useEffect } from "react";
import { triageRequest } from "@/services/agents/maintenanceTriageAgent";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Wrench, Phone, Clock, CheckCircle2, Paperclip, X, ExternalLink, MessageSquare, DollarSign, Star, AlertTriangle, Send } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format, differenceInHours, differenceInMinutes, parseISO } from "date-fns";

const maintenanceSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200, "Title too long"),
  description: z.string().max(2000, "Description too long").optional().or(z.literal("")),
  priority: z.enum(["low", "medium", "high"]),
  houseId: z.string().uuid("Invalid house selection"),
  serviceId: z.string().uuid("Invalid service selection"),
});

const BUCKET = "maintenance-attachments";

export default function Maintenance() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    houseId: "",
    serviceId: "",
    title: "",
    description: "",
    priority: "medium",
    requestedForAt: "",
  });
  const [attachmentFiles, setAttachmentFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  const { data: houses } = useQuery({
    queryKey: ["houses"],
    queryFn: async () => {
      const { data, error } = await supabase.from("houses").select("*");
      if (error) throw error;
      return data;
    },
  });

  const { data: services } = useQuery({
    queryKey: ["services"],
    queryFn: async () => {
      const { data, error } = await supabase.from("services").select("*");
      if (error) throw error;
      return data;
    },
  });

  const { data: vendors } = useQuery({
    queryKey: ["vendors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendors")
        .select("*, vendor_services(service_id)")
        .eq("active", true);
      if (error) throw error;
      return data;
    },
  });

  const { data: maintenanceRequests } = useQuery({
    queryKey: ["maintenanceRequests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("maintenance_requests")
        .select("*, houses(name), services(name), vendors(name, phone, discount_pct)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: slaRules = [] } = useQuery({
    queryKey: ["maintenance_sla_rules"],
    queryFn: async () => {
      const { data, error } = await supabase.from("maintenance_sla_rules").select("*");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: allComments = [] } = useQuery({
    queryKey: ["maintenance_comments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("maintenance_comments")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: allCosts = [] } = useQuery({
    queryKey: ["maintenance_costs"],
    queryFn: async () => {
      const { data, error } = await supabase.from("maintenance_costs").select("*");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: vendorRatings = [] } = useQuery({
    queryKey: ["vendor_ratings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("vendor_ratings").select("*");
      if (error) throw error;
      return data ?? [];
    },
  });

  const [commentText, setCommentText] = useState<Record<string, string>>({});

  const addComment = useMutation({
    mutationFn: async ({ requestId, comment }: { requestId: string; comment: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from("maintenance_comments").insert({
        request_id: requestId,
        user_id: user?.id,
        comment,
      });
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["maintenance_comments"] });
      setCommentText((prev) => ({ ...prev, [vars.requestId]: "" }));
    },
    onError: () => toast({ title: "Failed to add comment", variant: "destructive" }),
  });

  const selectedVendor = formData.serviceId
    ? vendors?.find((v) =>
        v.vendor_services?.some(
          (vs: any) => vs.service_id === formData.serviceId && v.is_trusted
        )
      )
    : null;

  const createRequest = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase.from("maintenance_requests").insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenanceRequests"] });
      toast({ title: "Maintenance request created" });
      setDialogOpen(false);
      resetForm();
    },
    onError: () => {
      toast({ title: "Failed to create request", variant: "destructive" });
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const updateData: any = { status };
      if (status === "complete") {
        updateData.completed_at = new Date().toISOString();
      }
      const { error } = await supabase
        .from("maintenance_requests")
        .update(updateData)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenanceRequests"] });
      toast({ title: "Status updated" });
    },
  });

  const resetForm = () => {
    setFormData({
      houseId: "",
      serviceId: "",
      title: "",
      description: "",
      priority: "medium",
      requestedForAt: "",
    });
    setAttachmentFiles([]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const newFiles = Array.from(e.target.files);
    setAttachmentFiles((prev) => [...prev, ...newFiles]);
    e.target.value = "";
  };

  const removeFile = (index: number) => {
    setAttachmentFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async (requestId: string): Promise<Array<{ name: string; path: string; url: string }>> => {
    const uploaded: Array<{ name: string; path: string; url: string }> = [];
    for (const file of attachmentFiles) {
      const path = `${requestId}/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from(BUCKET).upload(path, file);
      if (error) {
        console.error("Upload error:", error.message);
        continue;
      }
      const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
      uploaded.push({ name: file.name, path, url: urlData.publicUrl });
    }
    return uploaded;
  };

  const handleSubmit = async () => {
    const result = maintenanceSchema.safeParse({
      title: formData.title,
      description: formData.description,
      priority: formData.priority,
      houseId: formData.houseId,
      serviceId: formData.serviceId,
    });

    if (!result.success) {
      toast({ title: result.error.errors[0].message, variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      // Insert request first to get ID
      const { data: inserted, error: insertError } = await supabase
        .from("maintenance_requests")
        .insert([
          {
            house_id: formData.houseId,
            service_id: formData.serviceId,
            vendor_id: selectedVendor?.id || null,
            title: formData.title,
            description: formData.description,
            priority: formData.priority,
            requested_for_at: formData.requestedForAt || null,
          },
        ])
        .select()
        .single();

      if (insertError) throw insertError;

      let attachments: any[] = [];
      if (attachmentFiles.length > 0 && inserted?.id) {
        attachments = await uploadFiles(inserted.id);
        if (attachments.length > 0) {
          await supabase
            .from("maintenance_requests")
            .update({ attachments })
            .eq("id", inserted.id);
        }
      }

      queryClient.invalidateQueries({ queryKey: ["maintenanceRequests"] });
      toast({ title: "Maintenance request created" });
      setDialogOpen(false);
      resetForm();

      // Fire-and-forget: run AI triage in background
      if (inserted?.id) {
        const agentEnabled =
          typeof window !== "undefined" &&
          localStorage.getItem("ENABLE_MAINTENANCE_AGENT") === "true";
        if (agentEnabled) {
          triageRequest(inserted.id).catch(() => {
            // triage errors are non-fatal
          });
        }
      }
    } catch (err: any) {
      toast({ title: err.message || "Failed to create request", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const getAttachmentPublicUrl = (path: string) =>
    supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;

  const pendingRequests = maintenanceRequests?.filter((r) => r.status === "pending") || [];
  const scheduledRequests =
    maintenanceRequests?.filter(
      (r) =>
        (r.status === "pending" || r.status === "in_progress") &&
        r.requested_for_at &&
        new Date(r.requested_for_at) > new Date()
    ) || [];
  const completedRequests = maintenanceRequests?.filter((r) => r.status === "complete") || [];

  const renderRequestCard = (request: any) => {
    const attachments: Array<{ name: string; path: string; url: string }> =
      Array.isArray(request.attachments) ? request.attachments : [];

    return (
      <Card key={request.id} className="mb-4">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-lg">{request.title}</CardTitle>
              <CardDescription>
                <Badge variant="outline" className="mr-2">
                  {request.houses?.name}
                </Badge>
                {request.services?.name}
              </CardDescription>
            </div>
            <Badge
              variant={
                request.priority === "high"
                  ? "destructive"
                  : request.priority === "medium"
                  ? "default"
                  : "secondary"
              }
            >
              {request.priority}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {request.vendors && (
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium">{request.vendors.name}</span>
              {request.vendors.discount_pct > 0 && (
                <Badge variant="secondary" className="text-xs">
                  Trusted Partner · {request.vendors.discount_pct}% Discount
                </Badge>
              )}
            </div>
          )}
          {request.requested_for_at && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              {format(new Date(request.requested_for_at), "PPp")}
            </div>
          )}
          {request.vendors?.phone && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="h-4 w-4" />
              <a href={`tel:${request.vendors.phone}`} className="underline">
                {request.vendors.phone}
              </a>
            </div>
          )}
          {attachments.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Attachments</p>
              <div className="flex flex-wrap gap-2">
                {attachments.map((att, i) => (
                  <a
                    key={i}
                    href={att.url || getAttachmentPublicUrl(att.path)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary underline"
                  >
                    <Paperclip className="h-3 w-3" />
                    {att.name}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ))}
              </div>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Select
              value={request.status}
              onValueChange={(value) => updateStatus.mutate({ id: request.id, status: value })}
            >
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="complete">Complete</SelectItem>
                <SelectItem value="canceled">Canceled</SelectItem>
              </SelectContent>
            </Select>
            {request.status !== "complete" && (
              <Button
                size="sm"
                onClick={() => updateStatus.mutate({ id: request.id, status: "complete" })}
              >
                <CheckCircle2 className="h-4 w-4 mr-1" />
                Mark Complete
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="container py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Wrench className="h-8 w-8" />
            Maintenance
          </h1>
          <p className="text-muted-foreground">Manage maintenance requests and vendors</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>New Request</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Maintenance Request</DialogTitle>
              <DialogDescription>Fill in the details for the new request</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="house">House *</Label>
                <Select
                  value={formData.houseId}
                  onValueChange={(v) => setFormData({ ...formData, houseId: v })}
                >
                  <SelectTrigger id="house">
                    <SelectValue placeholder="Select house" />
                  </SelectTrigger>
                  <SelectContent>
                    {houses?.map((h) => (
                      <SelectItem key={h.id} value={h.id}>
                        {h.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="service">Service *</Label>
                <Select
                  value={formData.serviceId}
                  onValueChange={(v) => setFormData({ ...formData, serviceId: v })}
                >
                  <SelectTrigger id="service">
                    <SelectValue placeholder="Select service" />
                  </SelectTrigger>
                  <SelectContent>
                    {services?.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {selectedVendor && (
                <div className="p-3 bg-muted rounded-md text-sm">
                  <div className="font-medium">Auto-selected Vendor:</div>
                  <div>{selectedVendor.name}</div>
                  {selectedVendor.discount_pct > 0 && (
                    <Badge variant="secondary" className="mt-1">
                      {selectedVendor.discount_pct}% Discount
                    </Badge>
                  )}
                </div>
              )}
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Brief description"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Details about the issue"
                />
              </div>
              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(v) => setFormData({ ...formData, priority: v })}
                >
                  <SelectTrigger id="priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="requestedTime">Requested Time</Label>
                <Input
                  id="requestedTime"
                  type="datetime-local"
                  value={formData.requestedForAt}
                  onChange={(e) => setFormData({ ...formData, requestedForAt: e.target.value })}
                />
              </div>

              {/* File attachments */}
              <div>
                <Label>Attachments (photos/files)</Label>
                <div className="mt-1 space-y-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full"
                  >
                    <Paperclip className="h-4 w-4 mr-2" />
                    Add Photos / Files
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,application/pdf,.doc,.docx"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  {attachmentFiles.length > 0 && (
                    <div className="space-y-1">
                      {attachmentFiles.map((file, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between text-xs bg-muted rounded px-2 py-1"
                        >
                          <span className="truncate max-w-[200px]">{file.name}</span>
                          <button
                            type="button"
                            onClick={() => removeFile(i)}
                            className="ml-2 text-muted-foreground hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <Button onClick={handleSubmit} className="w-full" disabled={uploading}>
                {uploading ? "Uploading..." : "Create Request"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList>
          <TabsTrigger value="pending">Pending ({pendingRequests.length})</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled ({scheduledRequests.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completedRequests.length})</TabsTrigger>
          <TabsTrigger value="vendors">Vendors</TabsTrigger>
        </TabsList>
        <TabsContent value="pending" className="mt-6">
          {pendingRequests.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No pending requests
              </CardContent>
            </Card>
          ) : (
            pendingRequests.map(renderRequestCard)
          )}
        </TabsContent>
        <TabsContent value="scheduled" className="mt-6">
          {scheduledRequests.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No scheduled requests
              </CardContent>
            </Card>
          ) : (
            scheduledRequests.map(renderRequestCard)
          )}
        </TabsContent>
        <TabsContent value="completed" className="mt-6">
          {completedRequests.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No completed requests
              </CardContent>
            </Card>
          ) : (
            completedRequests.map(renderRequestCard)
          )}
        </TabsContent>
        <TabsContent value="vendors" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Trusted Partners</CardTitle>
              <CardDescription>Vendors with active service agreements</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {vendors
                  ?.filter((v) => v.is_trusted)
                  .map((vendor) => (
                    <div key={vendor.id} className="flex items-center justify-between border-b pb-3">
                      <div>
                        <div className="font-medium">{vendor.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {vendor.phone} • {vendor.email}
                        </div>
                      </div>
                      {vendor.discount_pct > 0 && (
                        <Badge variant="secondary">{vendor.discount_pct}% Discount</Badge>
                      )}
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
