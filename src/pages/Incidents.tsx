import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";

export default function Incidents() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; type: string } | null>(null);
  const [formData, setFormData] = useState({
    house_id: "",
    resident_id: "",
    type: "",
    description: "",
    severity: "medium",
  });

  const { data: incidents = [] } = useQuery({
    queryKey: ["incidents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("incidents")
        .select("*, residents(name), houses(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: houses = [] } = useQuery({
    queryKey: ["houses"],
    queryFn: async () => {
      const { data, error } = await supabase.from("houses").select("id, name");
      if (error) throw error;
      return data;
    },
  });

  const { data: residents = [] } = useQuery({
    queryKey: ["residents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("residents")
        .select("id, name")
        .eq("status", "Active");
      if (error) throw error;
      return data;
    },
  });

  const createIncident = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const { error } = await supabase.from("incidents").insert([
        { ...payload, reported_by: user?.id },
      ]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incidents"] });
      toast({ title: "Incident logged" });
      setDialogOpen(false);
      setFormData({
        house_id: "",
        resident_id: "",
        type: "",
        description: "",
        severity: "medium",
      });
    },
    onError: () => {
      toast({ title: "Failed to log incident", variant: "destructive" });
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const update: Record<string, unknown> = { status };
      if (status === "resolved") update.resolved_at = new Date().toISOString();
      const { error } = await supabase
        .from("incidents")
        .update(update)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incidents"] });
      toast({ title: "Status updated" });
    },
  });

  const deleteIncident = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("incidents").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incidents"] });
      toast({ title: "Incident deleted" });
      setDeleteTarget(null);
    },
    onError: () => {
      toast({ title: "Failed to delete incident", variant: "destructive" });
    },
  });

  const handleSubmit = () => {
    if (!formData.type.trim() || !formData.description.trim()) {
      toast({
        title: "Type and description are required",
        variant: "destructive",
      });
      return;
    }
    createIncident.mutate({
      house_id: formData.house_id || null,
      resident_id: formData.resident_id || null,
      type: formData.type,
      description: formData.description,
      severity: formData.severity,
      status: "open",
    });
  };

  const openIncidents = incidents.filter((i: any) =>
    ["open", "investigating"].includes(i.status)
  );
  const highPriority = openIncidents.filter((i: any) =>
    ["high", "critical"].includes(i.severity)
  );
  const now = new Date();
  const resolvedThisMonth = incidents.filter((i: any) => {
    if (!["resolved", "closed"].includes(i.status)) return false;
    const d = new Date(i.resolved_at ?? i.updated_at);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const severityVariant = (s: string) => {
    if (s === "critical" || s === "high") return "destructive" as const;
    if (s === "medium") return "secondary" as const;
    return "default" as const;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Incidents</h1>
          <p className="text-muted-foreground">
            Track and manage facility incidents
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Log Incident
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Log Incident</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Type *</Label>
                <Input
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value })
                  }
                  placeholder="e.g. Maintenance, Policy Violation, Emergency"
                />
              </div>
              <div>
                <Label>Description *</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Describe the incident"
                />
              </div>
              <div>
                <Label>Severity</Label>
                <Select
                  value={formData.severity}
                  onValueChange={(v) =>
                    setFormData({ ...formData, severity: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>House</Label>
                <Select
                  value={formData.house_id}
                  onValueChange={(v) =>
                    setFormData({ ...formData, house_id: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select house" />
                  </SelectTrigger>
                  <SelectContent>
                    {(houses as any[]).map((h) => (
                      <SelectItem key={h.id} value={h.id}>
                        {h.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Resident</Label>
                <Select
                  value={formData.resident_id}
                  onValueChange={(v) =>
                    setFormData({ ...formData, resident_id: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select resident" />
                  </SelectTrigger>
                  <SelectContent>
                    {(residents as any[]).map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleSubmit}
                className="w-full"
                disabled={createIncident.isPending}
              >
                Log Incident
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Open Incidents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{openIncidents.length}</div>
            <p className="text-xs text-muted-foreground">
              {highPriority.length} high priority
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Resolved This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resolvedThisMonth.length}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Incidents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{incidents.length}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Incidents</CardTitle>
        </CardHeader>
        <CardContent>
          {incidents.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No incidents recorded
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Resident</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Reported</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(incidents as any[]).map((incident) => (
                  <TableRow key={incident.id}>
                    <TableCell className="font-medium">
                      {incident.type}
                    </TableCell>
                    <TableCell>{incident.residents?.name ?? "—"}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {incident.description}
                    </TableCell>
                    <TableCell>
                      <Badge variant={severityVariant(incident.severity)}>
                        {incident.severity}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(incident.created_at), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={incident.status}
                        onValueChange={(v) =>
                          updateStatus.mutate({ id: incident.id, status: v })
                        }
                      >
                        <SelectTrigger className="w-36">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="investigating">
                            Investigating
                          </SelectItem>
                          <SelectItem value="resolved">Resolved</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget({ id: incident.id, type: incident.type })}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this incident?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the "{deleteTarget?.type}" incident record.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteTarget && deleteIncident.mutate(deleteTarget.id)}
            >
              {deleteIncident.isPending ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
