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
import { Switch } from "@/components/ui/switch";
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { Plus, DollarSign, Target, TrendingUp, Users, Megaphone, Loader2, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";

const COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ec4899", "#14b8a6", "#f97316", "#8b5cf6", "#06b6d4"];
const fmt = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 0 })}`;

const CHANNEL_TYPE_LABELS: Record<string, string> = {
  google_ads:       "Google Ads",
  facebook:         "Facebook / Instagram",
  referral_partner: "Referral Partner",
  website:          "Website",
  directory:        "Directory",
  word_of_mouth:    "Word of Mouth",
  court:            "Court / Probation",
  treatment_center: "Treatment Center",
  other:            "Other",
};

export default function MarketingAnalytics() {
  const queryClient = useQueryClient();
  const [channelOpen, setChannelOpen]   = useState(false);
  const [editTarget,  setEditTarget]    = useState<any>(null);
  const [form, setForm] = useState({
    name: "", channel_type: "other", monthly_cost: "", is_active: true,
  });

  const { data: channels = [], isLoading } = useQuery({
    queryKey: ["marketing_channels"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("marketing_channels")
        .select("*")
        .order("created_at");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: attributions = [] } = useQuery({
    queryKey: ["lead_attributions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lead_attributions")
        .select("*, marketing_channels(name), intake_leads(status, created_at)");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: leads = [] } = useQuery({
    queryKey: ["intake_leads_all"],
    queryFn: async () => {
      const { data, error } = await supabase.from("intake_leads").select("id, status, source, created_at");
      if (error) throw error;
      return data ?? [];
    },
  });

  const resetForm = () => {
    setForm({ name: "", channel_type: "other", monthly_cost: "", is_active: true });
    setEditTarget(null);
  };

  const openEdit = (ch: any) => {
    setEditTarget(ch);
    setForm({ name: ch.name, channel_type: ch.channel_type, monthly_cost: ch.monthly_cost?.toString() ?? "0", is_active: ch.is_active });
    setChannelOpen(true);
  };

  const saveChannel = useMutation({
    mutationFn: async () => {
      const payload = {
        name:         form.name,
        channel_type: form.channel_type,
        monthly_cost: parseFloat(form.monthly_cost) || 0,
        is_active:    form.is_active,
      };
      if (editTarget) {
        const { error } = await supabase.from("marketing_channels").update(payload).eq("id", editTarget.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("marketing_channels").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketing_channels"] });
      setChannelOpen(false);
      resetForm();
      toast.success(editTarget ? "Channel updated" : "Channel created");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteChannel = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("marketing_channels").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketing_channels"] });
      toast.success("Channel removed");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("marketing_channels").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["marketing_channels"] }),
    onError: (err: any) => toast.error(err.message),
  });

  // Compute per-channel ROI metrics
  const channelMetrics = channels.map((ch: any) => {
    const chAttrs   = attributions.filter((a: any) => a.channel_id === ch.id);
    const totalCost = chAttrs.reduce((s: number, a: any) => s + Number(a.cost), 0) + Number(ch.monthly_cost);
    const leadCount = chAttrs.length;
    // Count leads that moved in (from source matching or attribution)
    const conversions = chAttrs.filter((a: any) => (a.intake_leads as any)?.status === "moved_in").length;
    // Also count leads with matching source name
    const sourceLeads = leads.filter((l: any) => l.source === ch.channel_type || l.source === ch.name).length;
    const allLeads    = Math.max(leadCount, sourceLeads);
    const cpl         = allLeads > 0 ? totalCost / allLeads : 0;
    const cpm         = conversions > 0 ? totalCost / conversions : 0;
    const convRate    = allLeads  > 0 ? (conversions / allLeads) * 100 : 0;
    return {
      id: ch.id,
      name:        ch.name,
      type:        ch.channel_type,
      monthlyCost: Number(ch.monthly_cost),
      isActive:    ch.is_active,
      leads:       allLeads,
      conversions,
      convRate,
      cpl,
      cpm,
      totalCost,
    };
  });

  const totalMonthlySpend  = channels.filter((c: any) => c.is_active).reduce((s: number, c: any) => s + Number(c.monthly_cost), 0);
  const totalLeads         = leads.length;
  const totalConversions   = leads.filter((l: any) => l.status === "moved_in").length;
  const overallCPL         = totalLeads > 0 ? totalMonthlySpend / totalLeads : 0;
  const overallConvRate    = totalLeads > 0 ? (totalConversions / totalLeads) * 100 : 0;

  // Chart data
  const roiChartData = channelMetrics
    .filter((c) => c.leads > 0 || c.monthlyCost > 0)
    .map((c) => ({ name: c.name.slice(0, 16), leads: c.leads, conversions: c.conversions, cost: c.monthlyCost }));

  const pieData = channels
    .filter((c: any) => Number(c.monthly_cost) > 0)
    .map((c: any) => ({ name: c.name, value: Number(c.monthly_cost) }));

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Marketing Analytics</h1>
          <p className="text-muted-foreground">Channel ROI, lead attribution, and cost-per-move-in</p>
        </div>
        <Dialog open={channelOpen} onOpenChange={(open) => { if (!open) resetForm(); setChannelOpen(open); }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Add Channel</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editTarget ? "Edit Channel" : "Add Marketing Channel"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-1">
                <Label>Channel Name *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Google Ads — Phoenix" />
              </div>
              <div className="space-y-1">
                <Label>Channel Type</Label>
                <Select value={form.channel_type} onValueChange={(v) => setForm({ ...form, channel_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(CHANNEL_TYPE_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Monthly Cost ($)</Label>
                <Input type="number" value={form.monthly_cost} onChange={(e) => setForm({ ...form, monthly_cost: e.target.value })} placeholder="0" />
              </div>
              <div className="flex items-center justify-between">
                <Label>Active</Label>
                <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => { resetForm(); setChannelOpen(false); }}>Cancel</Button>
                <Button disabled={!form.name || saveChannel.isPending} onClick={() => saveChannel.mutate()}>
                  {saveChannel.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  {editTarget ? "Save" : "Create"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Portfolio KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-5">
          <p className="text-xs text-muted-foreground uppercase">Monthly Spend</p>
          <p className="text-2xl font-bold text-primary">{fmt(totalMonthlySpend)}</p>
        </CardContent></Card>
        <Card><CardContent className="p-5">
          <p className="text-xs text-muted-foreground uppercase">Total Leads</p>
          <p className="text-2xl font-bold">{totalLeads}</p>
        </CardContent></Card>
        <Card><CardContent className="p-5">
          <p className="text-xs text-muted-foreground uppercase">Cost / Lead</p>
          <p className="text-2xl font-bold">{fmt(overallCPL)}</p>
        </CardContent></Card>
        <Card><CardContent className="p-5">
          <p className="text-xs text-muted-foreground uppercase">Conversion Rate</p>
          <p className="text-2xl font-bold">{overallConvRate.toFixed(1)}%</p>
        </CardContent></Card>
      </div>

      {/* Channel ROI table */}
      <Card>
        <CardHeader>
          <CardTitle>Channel ROI Dashboard</CardTitle>
          <CardDescription>Leads, conversions, and cost-per-move-in per channel</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="py-2 pr-4">Channel</th>
                    <th className="py-2 px-3 text-right">Monthly Cost</th>
                    <th className="py-2 px-3 text-right">Leads</th>
                    <th className="py-2 px-3 text-right">Move-Ins</th>
                    <th className="py-2 px-3 text-right">Conv. Rate</th>
                    <th className="py-2 px-3 text-right">Cost / Lead</th>
                    <th className="py-2 px-3 text-right">Cost / Move-In</th>
                    <th className="py-2 px-3">Status</th>
                    <th className="py-2 px-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {channelMetrics.map((ch) => (
                    <tr key={ch.id} className="border-b hover:bg-muted/50">
                      <td className="py-2 pr-4">
                        <p className="font-medium">{ch.name}</p>
                        <p className="text-xs text-muted-foreground">{CHANNEL_TYPE_LABELS[ch.type] ?? ch.type}</p>
                      </td>
                      <td className="py-2 px-3 text-right">{fmt(ch.monthlyCost)}</td>
                      <td className="py-2 px-3 text-right">{ch.leads}</td>
                      <td className="py-2 px-3 text-right">{ch.conversions}</td>
                      <td className="py-2 px-3 text-right">{ch.convRate.toFixed(1)}%</td>
                      <td className="py-2 px-3 text-right">{ch.leads > 0 ? fmt(ch.cpl) : "—"}</td>
                      <td className="py-2 px-3 text-right">{ch.conversions > 0 ? fmt(ch.cpm) : "—"}</td>
                      <td className="py-2 px-3">
                        <Switch
                          checked={ch.isActive}
                          onCheckedChange={(v) => toggleActive.mutate({ id: ch.id, is_active: v })}
                        />
                      </td>
                      <td className="py-2 px-3">
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" onClick={() => openEdit(channels.find((c: any) => c.id === ch.id))}>
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => deleteChannel.mutate(ch.id)}>
                            <Trash2 className="h-3.5 w-3.5 text-red-500" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Leads &amp; Conversions by Channel</CardTitle></CardHeader>
          <CardContent>
            {roiChartData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No attribution data yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={roiChartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis type="category" dataKey="name" width={110} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="leads"       fill="#6366f1" name="Leads"     radius={[0, 4, 4, 0]} />
                  <Bar dataKey="conversions" fill="#22c55e" name="Move-Ins"  radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Monthly Spend by Channel</CardTitle></CardHeader>
          <CardContent>
            {pieData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No paid channels configured.</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90}
                    label={({ name, percent }) => `${name.slice(0, 12)} ${(percent * 100).toFixed(0)}%`}>
                    {pieData.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: any) => fmt(Number(v))} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
