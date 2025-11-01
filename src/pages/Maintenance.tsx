import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Wrench, Phone, Clock, CheckCircle2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";

export default function Maintenance() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    houseId: "",
    serviceId: "",
    title: "",
    description: "",
    priority: "medium",
    requestedForAt: "",
  });

  // Fetch houses
  const { data: houses } = useQuery({
    queryKey: ["houses"],
    queryFn: async () => {
      const { data, error } = await supabase.from("houses").select("*");
      if (error) throw error;
      return data;
    },
  });

  // Fetch services
  const { data: services } = useQuery({
    queryKey: ["services"],
    queryFn: async () => {
      const { data, error } = await supabase.from("services").select("*");
      if (error) throw error;
      return data;
    },
  });

  // Fetch vendors with services
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

  // Fetch maintenance requests with relations
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

  // Auto-select vendor when service changes
  const selectedVendor = formData.serviceId
    ? vendors?.find((v) =>
        v.vendor_services?.some(
          (vs: any) => vs.service_id === formData.serviceId && v.is_trusted
        )
      )
    : null;

  // Create maintenance request mutation
  const createRequest = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase.from("maintenance_requests").insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenanceRequests"] });
      toast({ title: "Maintenance request created" });
      setDialogOpen(false);
      setFormData({
        houseId: "",
        serviceId: "",
        title: "",
        description: "",
        priority: "medium",
        requestedForAt: "",
      });
    },
    onError: () => {
      toast({ title: "Failed to create request", variant: "destructive" });
    },
  });

  // Update status mutation
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

  const handleSubmit = () => {
    if (!formData.houseId || !formData.serviceId || !formData.title) {
      toast({ title: "Please fill required fields", variant: "destructive" });
      return;
    }
    createRequest.mutate({
      house_id: formData.houseId,
      service_id: formData.serviceId,
      vendor_id: selectedVendor?.id || null,
      title: formData.title,
      description: formData.description,
      priority: formData.priority,
      requested_for_at: formData.requestedForAt || null,
      contact_phone: selectedVendor?.phone || null,
    });
  };

  const pendingRequests = maintenanceRequests?.filter((r) => r.status === "pending") || [];
  const scheduledRequests =
    maintenanceRequests?.filter(
      (r) =>
        (r.status === "pending" || r.status === "in_progress") &&
        r.requested_for_at &&
        new Date(r.requested_for_at) > new Date()
    ) || [];
  const completedRequests = maintenanceRequests?.filter((r) => r.status === "complete") || [];

  const renderRequestCard = (request: any) => (
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
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create Maintenance Request</DialogTitle>
              <DialogDescription>Fill in the details for the new request</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="house">House *</Label>
                <Select value={formData.houseId} onValueChange={(v) => setFormData({ ...formData, houseId: v })}>
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
                <Select value={formData.serviceId} onValueChange={(v) => setFormData({ ...formData, serviceId: v })}>
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
                <Select value={formData.priority} onValueChange={(v) => setFormData({ ...formData, priority: v })}>
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
              <Button onClick={handleSubmit} className="w-full">
                Create Request
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
