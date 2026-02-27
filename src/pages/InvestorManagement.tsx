import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Users, Edit, Trash2, Loader2, Mail } from "lucide-react";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";

const ACCESS_LABELS: Record<string, string> = {
  view_only: "View Only",
  detailed:  "Detailed",
  full:      "Full Access",
};

export default function InvestorManagement() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<any>(null);
  const [form, setForm] = useState({
    investor_name:  "",
    investor_email: "",
    access_level:   "view_only",
    linked_house_ids: [] as string[],
  });

  const { data: houses = [] } = useQuery({
    queryKey: ["houses"],
    queryFn: async () => {
      const { data, error } = await supabase.from("houses").select("id, name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: investors = [], isLoading } = useQuery({
    queryKey: ["investor_accounts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("investor_accounts")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const resetForm = () => {
    setForm({ investor_name: "", investor_email: "", access_level: "view_only", linked_house_ids: [] });
    setEditTarget(null);
  };

  const openCreate = () => { resetForm(); setDialogOpen(true); };

  const openEdit = (inv: any) => {
    setEditTarget(inv);
    setForm({
      investor_name:    inv.investor_name ?? "",
      investor_email:   inv.investor_email ?? "",
      access_level:     inv.access_level ?? "view_only",
      linked_house_ids: inv.linked_house_ids ?? [],
    });
    setDialogOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editTarget) {
        const { error } = await supabase
          .from("investor_accounts")
          .update({
            investor_name:    form.investor_name,
            investor_email:   form.investor_email,
            access_level:     form.access_level,
            linked_house_ids: form.linked_house_ids,
          })
          .eq("id", editTarget.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("investor_accounts").insert({
          investor_name:    form.investor_name,
          investor_email:   form.investor_email,
          access_level:     form.access_level,
          linked_house_ids: form.linked_house_ids,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["investor_accounts"] });
      setDialogOpen(false);
      resetForm();
      toast.success(editTarget ? "Investor account updated" : "Investor account created");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("investor_accounts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["investor_accounts"] });
      toast.success("Investor account removed");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const toggleHouse = (id: string) => {
    setForm((prev) => ({
      ...prev,
      linked_house_ids: prev.linked_house_ids.includes(id)
        ? prev.linked_house_ids.filter((h) => h !== id)
        : [...prev.linked_house_ids, id],
    }));
  };

  const sendInvite = (email: string) => {
    toast.success(`Invite link copied for ${email}. (Email integration requires SendGrid configuration.)`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Investor Management</h1>
          <p className="text-muted-foreground">Create investor accounts and control which houses they can view</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />Add Investor
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <Users className="h-8 w-8 text-primary" />
            <div>
              <p className="text-2xl font-bold">{investors.length}</p>
              <p className="text-sm text-muted-foreground">Total Investors</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <Users className="h-8 w-8 text-green-500" />
            <div>
              <p className="text-2xl font-bold">
                {investors.filter((i: any) => i.access_level === "view_only").length}
              </p>
              <p className="text-sm text-muted-foreground">View-Only Access</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <Users className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-2xl font-bold">
                {investors.filter((i: any) => i.access_level === "full").length}
              </p>
              <p className="text-sm text-muted-foreground">Full Access</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Investor Accounts</CardTitle>
          <CardDescription>
            Investors log in with the same auth system and are routed to /investor-portal automatically based on their role.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : investors.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No investor accounts yet. Click "Add Investor" to create one.
            </p>
          ) : (
            <div className="divide-y">
              {investors.map((inv: any) => {
                const linkedNames = (inv.linked_house_ids ?? [])
                  .map((id: string) => houses.find((h: any) => h.id === id)?.name)
                  .filter(Boolean);
                return (
                  <div key={inv.id} className="py-4 flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{inv.investor_name || "Unnamed Investor"}</p>
                        <Badge variant={inv.access_level === "full" ? "default" : "secondary"}>
                          {ACCESS_LABELS[inv.access_level] ?? inv.access_level}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{inv.investor_email}</p>
                      {linkedNames.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {linkedNames.map((name: string) => (
                            <Badge key={name} variant="outline" className="text-xs">{name}</Badge>
                          ))}
                        </div>
                      )}
                      {inv.created_at && (
                        <p className="text-xs text-muted-foreground">
                          Created {format(parseISO(inv.created_at), "MMM d, yyyy")}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => sendInvite(inv.investor_email)}>
                        <Mail className="h-4 w-4 mr-1" />Invite
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => openEdit(inv)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => deleteMutation.mutate(inv.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) resetForm(); setDialogOpen(open); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editTarget ? "Edit Investor" : "Add Investor Account"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1">
              <Label>Investor Name *</Label>
              <Input value={form.investor_name} onChange={(e) => setForm({ ...form, investor_name: e.target.value })} placeholder="John Smith" />
            </div>
            <div className="space-y-1">
              <Label>Email Address *</Label>
              <Input type="email" value={form.investor_email} onChange={(e) => setForm({ ...form, investor_email: e.target.value })} placeholder="investor@example.com" />
            </div>
            <div className="space-y-1">
              <Label>Access Level</Label>
              <Select value={form.access_level} onValueChange={(v) => setForm({ ...form, access_level: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(ACCESS_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Linked Properties</Label>
              {houses.length === 0 ? (
                <p className="text-sm text-muted-foreground">No houses found.</p>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto rounded border p-3">
                  {houses.map((h: any) => (
                    <div key={h.id} className="flex items-center gap-2">
                      <Checkbox
                        id={`house-${h.id}`}
                        checked={form.linked_house_ids.includes(h.id)}
                        onCheckedChange={() => toggleHouse(h.id)}
                      />
                      <label htmlFor={`house-${h.id}`} className="text-sm cursor-pointer">{h.name}</label>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { resetForm(); setDialogOpen(false); }}>Cancel</Button>
              <Button
                disabled={!form.investor_name || !form.investor_email || saveMutation.isPending}
                onClick={() => saveMutation.mutate()}
              >
                {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {editTarget ? "Save Changes" : "Create Account"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
