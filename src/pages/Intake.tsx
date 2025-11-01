import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Phone, Mail } from "lucide-react";

const STAGES = [
  { id: "lead", label: "Lead", status: "lead" },
  { id: "application", label: "Application", status: "application" },
  { id: "offer", label: "Offer", status: "offer" },
  { id: "esign", label: "E-sign", status: "esign" },
  { id: "movein", label: "Move-in", status: "movein" },
];

export default function Intake() {
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newLead, setNewLead] = useState({
    name: "",
    phone: "",
    email: "",
    referral_source: "",
  });

  const { data: leads, isLoading } = useQuery({
    queryKey: ["intake-leads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("intake_leads")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createLeadMutation = useMutation({
    mutationFn: async (lead: typeof newLead) => {
      const { data, error } = await supabase
        .from("intake_leads")
        .insert([lead])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["intake-leads"] });
      toast.success("Lead created successfully");
      setIsCreateDialogOpen(false);
      setNewLead({ name: "", phone: "", email: "", referral_source: "" });
    },
    onError: () => {
      toast.error("Failed to create lead");
    },
  });

  const updateLeadStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data, error } = await supabase
        .from("intake_leads")
        .update({ status })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["intake-leads"] });
      toast.success("Status updated");
    },
  });

  const convertToResidentMutation = useMutation({
    mutationFn: async (leadId: string) => {
      const lead = leads?.find((l) => l.id === leadId);
      if (!lead) throw new Error("Lead not found");

      const { data: resident, error: residentError } = await supabase
        .from("residents")
        .insert([
          {
            name: lead.name,
            status: "Active",
            move_in_date: new Date().toISOString().split("T")[0],
          },
        ])
        .select()
        .single();

      if (residentError) throw residentError;

      const { error: updateError } = await supabase
        .from("intake_leads")
        .update({ status: "converted" })
        .eq("id", leadId);

      if (updateError) throw updateError;

      return resident;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["intake-leads"] });
      toast.success("Converted to resident successfully");
    },
    onError: () => {
      toast.error("Failed to convert to resident");
    },
  });

  const handleCreateLead = (e: React.FormEvent) => {
    e.preventDefault();
    createLeadMutation.mutate(newLead);
  };

  const getLeadsByStage = (status: string) => {
    return leads?.filter((lead) => lead.status === status) || [];
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Intake Pipeline</h1>
          <p className="text-muted-foreground">Manage leads through admission process</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Lead
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Lead</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateLead} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={newLead.name}
                  onChange={(e) => setNewLead({ ...newLead, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={newLead.phone}
                  onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newLead.email}
                  onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="referral_source">Referral Source</Label>
                <Input
                  id="referral_source"
                  value={newLead.referral_source}
                  onChange={(e) =>
                    setNewLead({ ...newLead, referral_source: e.target.value })
                  }
                />
              </div>
              <Button type="submit" className="w-full" disabled={createLeadMutation.isPending}>
                Create Lead
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {STAGES.map((stage) => {
          const stageLeads = getLeadsByStage(stage.status);
          return (
            <div key={stage.id} className="space-y-2">
              <div className="bg-muted p-3 rounded-lg">
                <h3 className="font-semibold text-sm">{stage.label}</h3>
                <p className="text-xs text-muted-foreground">{stageLeads.length} leads</p>
              </div>
              <div className="space-y-2">
                {stageLeads.map((lead) => (
                  <Card key={lead.id} className="p-3">
                    <CardHeader className="p-0 pb-2">
                      <CardTitle className="text-sm font-medium">{lead.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 space-y-1">
                      {lead.phone && (
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Phone className="h-3 w-3 mr-1" />
                          {lead.phone}
                        </div>
                      )}
                      {lead.email && (
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Mail className="h-3 w-3 mr-1" />
                          {lead.email}
                        </div>
                      )}
                      {lead.referral_source && (
                        <p className="text-xs text-muted-foreground">
                          Source: {lead.referral_source}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Updated: {new Date(lead.updated_at).toLocaleDateString()}
                      </p>
                      <div className="space-y-1 pt-2">
                        <Select
                          value={lead.status}
                          onValueChange={(value) =>
                            updateLeadStatusMutation.mutate({ id: lead.id, status: value })
                          }
                        >
                          <SelectTrigger className="h-7 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STAGES.map((s) => (
                              <SelectItem key={s.status} value={s.status} className="text-xs">
                                {s.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {lead.status === "movein" && (
                          <Button
                            size="sm"
                            className="w-full h-7 text-xs"
                            onClick={() => convertToResidentMutation.mutate(lead.id)}
                            disabled={convertToResidentMutation.isPending}
                          >
                            Convert to Resident
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
