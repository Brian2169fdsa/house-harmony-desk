import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { triageRequest } from "@/services/agents/maintenanceTriageAgent";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";

type House = {
  id: string;
  name: string;
};

type Service = {
  id: string;
  name: string;
  category: string;
};

type Vendor = {
  id: string;
  name: string;
  phone: string;
  discount_pct: number;
};

type VendorService = {
  vendor_id: string;
  service_id: string;
  preferred: boolean;
  vendors: Vendor;
};

const requestSchema = z.object({
  house_id: z.string().uuid("Please select a house"),
  service_id: z.string().uuid("Please select a service"),
  title: z.string().trim().min(1, "Title is required").max(200, "Title too long"),
  description: z.string().max(2000, "Description too long")
});

interface NewRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewRequestDialog({ open, onOpenChange }: NewRequestDialogProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    house_id: "",
    service_id: "",
    vendor_id: "",
    title: "",
    description: "",
    priority: "medium" as "low" | "medium" | "high",
    requested_for_at: "",
    contact_phone: "",
  });

  const { data: houses = [] } = useQuery({
    queryKey: ["houses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("houses")
        .select("id, name")
        .order("name");

      if (error) throw error;
      return data as House[];
    },
  });

  const { data: services = [] } = useQuery({
    queryKey: ["services"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .order("name");

      if (error) throw error;
      return data as Service[];
    },
  });

  const { data: vendorServices = [] } = useQuery({
    queryKey: ["vendor-services", formData.service_id],
    queryFn: async () => {
      if (!formData.service_id) return [];

      const { data, error } = await supabase
        .from("vendor_services")
        .select(`
          vendor_id,
          service_id,
          preferred,
          vendors(id, name, phone, discount_pct)
        `)
        .eq("service_id", formData.service_id)
        .eq("coverage_city", "Phoenix");

      if (error) throw error;
      return data as VendorService[];
    },
    enabled: !!formData.service_id,
  });

  // Auto-select preferred vendor when service changes
  useEffect(() => {
    if (vendorServices.length > 0) {
      const preferred = vendorServices.find((vs) => vs.preferred);
      if (preferred) {
        setFormData((prev) => ({
          ...prev,
          vendor_id: preferred.vendor_id,
          contact_phone: preferred.vendors.phone,
        }));
      }
    }
  }, [vendorServices]);

  const createRequestMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { data: created, error } = await supabase
        .from("maintenance_requests")
        .insert({
          ...data,
          requested_for_at: data.requested_for_at || null,
        })
        .select("id")
        .single();

      if (error) throw error;
      return created;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["maintenance-requests"] });
      toast({ title: "Request created successfully" });
      onOpenChange(false);
      setFormData({
        house_id: "",
        service_id: "",
        vendor_id: "",
        title: "",
        description: "",
        priority: "medium",
        requested_for_at: "",
        contact_phone: "",
      });

      // Auto-triage via AI agent if enabled
      const agentEnabled = localStorage.getItem("ENABLE_MAINTENANCE_AGENT") === "true";
      if (agentEnabled && data?.id) {
        triageRequest(data.id).catch(() => {});
      }
    },
    onError: () => {
      toast({
        title: "Error creating request",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const result = requestSchema.safeParse(formData);
    if (!result.success) {
      toast({
        title: result.error.errors[0].message,
        variant: "destructive",
      });
      return;
    }
    
    createRequestMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Maintenance Request</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="house">House *</Label>
            <Select
              value={formData.house_id}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, house_id: value }))
              }
            >
              <SelectTrigger id="house">
                <SelectValue placeholder="Select a house" />
              </SelectTrigger>
              <SelectContent>
                {houses.map((house) => (
                  <SelectItem key={house.id} value={house.id}>
                    {house.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="service">Service *</Label>
            <Select
              value={formData.service_id}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, service_id: value }))
              }
            >
              <SelectTrigger id="service">
                <SelectValue placeholder="Select a service" />
              </SelectTrigger>
              <SelectContent>
                {services.map((service) => (
                  <SelectItem key={service.id} value={service.id}>
                    {service.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {vendorServices.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="vendor">Vendor</Label>
              <Select
                value={formData.vendor_id}
                onValueChange={(value) => {
                  const vendor = vendorServices.find(
                    (vs) => vs.vendor_id === value
                  )?.vendors;
                  setFormData((prev) => ({
                    ...prev,
                    vendor_id: value,
                    contact_phone: vendor?.phone || "",
                  }));
                }}
              >
                <SelectTrigger id="vendor">
                  <SelectValue placeholder="Auto-selected" />
                </SelectTrigger>
                <SelectContent>
                  {vendorServices.map((vs) => (
                    <SelectItem key={vs.vendor_id} value={vs.vendor_id}>
                      {vs.vendors.name}
                      {vs.vendors.discount_pct > 0 &&
                        ` (${vs.vendors.discount_pct}% discount)`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder="Brief description of the issue"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, description: e.target.value }))
              }
              placeholder="Detailed description"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value: any) =>
                  setFormData((prev) => ({ ...prev, priority: value }))
                }
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

            <div className="space-y-2">
              <Label htmlFor="requested_for_at">Requested Time</Label>
              <Input
                id="requested_for_at"
                type="datetime-local"
                value={formData.requested_for_at}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    requested_for_at: e.target.value,
                  }))
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact_phone">Contact Phone</Label>
            <Input
              id="contact_phone"
              type="tel"
              value={formData.contact_phone}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  contact_phone: e.target.value,
                }))
              }
              placeholder="Vendor contact phone"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createRequestMutation.isPending}>
              {createRequestMutation.isPending ? "Creating..." : "Create Request"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
