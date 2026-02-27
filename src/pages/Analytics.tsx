import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  AreaChart, Area, FunnelChart, Funnel, LabelList,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import {
  TrendingUp, TrendingDown, Users, DollarSign, Home, BarChart3,
  Target, Plus, Loader2, Upload, Award, Briefcase, Heart,
} from "lucide-react";
import { format, subMonths, startOfMonth, differenceInDays, parseISO } from "date-fns";
import { toast } from "sonner";

const COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ec4899", "#14b8a6", "#f97316", "#8b5cf6", "#06b6d4"];
const fmt = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
const fmtPct = (n: number) => `${n.toFixed(1)}%`;

function KPICard({ title, value, sub, trend, icon: Icon, color = "text-primary" }: {
  title: string; value: string; sub?: string; trend?: number; icon: React.ElementType; color?: string;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">{title}</p>
            <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
          </div>
          <div className="rounded-lg bg-primary/10 p-2">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
        {trend !== undefined && (
          <div className="flex items-center gap-1 mt-3">
            {trend >= 0
              ? <TrendingUp className="h-3.5 w-3.5 text-green-500" />
              : <TrendingDown className="h-3.5 w-3.5 text-red-500" />}
            <span className={`text-xs font-medium ${trend >= 0 ? "text-green-600" : "text-red-600"}`}>
              {trend >= 0 ? "+" : ""}{trend.toFixed(1)}% vs last month
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Shared data hooks ─────────────────────────────────────────────────────────
function useHouses() {
  return useQuery({
    queryKey: ["houses"],
    queryFn: async () => {
      const { data, error } = await supabase.from("houses").select("id, name");
      if (error) throw error;
      return data ?? [];
    },
  });
}

function useSnapshots() {
  const since = format(subMonths(startOfMonth(new Date()), 11), "yyyy-MM-dd");
  return useQuery({
    queryKey: ["financial_snapshots_12m"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("financial_snapshots")
        .select("*")
        .gte("month", since)
        .order("month", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

function useExpenses() {
  return useQuery({
    queryKey: ["expense_records_all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expense_records")
        .select("*")
        .order("date", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

function useResidents() {
  return useQuery({
    queryKey: ["residents_all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("residents")
        .select("id, name, status, move_in_date, move_out_date, house_id");
      if (error) throw error;
      return data ?? [];
    },
  });
}

function useBeds() {
  return useQuery({
    queryKey: ["beds_all"],
    queryFn: async () => {
      const { data, error } = await supabase.from("beds").select("id, status");
      if (error) throw error;
      return data ?? [];
    },
  });
}

function useOutcomes() {
  return useQuery({
    queryKey: ["resident_outcomes_all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("resident_outcomes")
        .select("*, residents(name)")
        .order("milestone_date", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

function useLeads() {
  return useQuery({
    queryKey: ["intake_leads_all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("intake_leads")
        .select("id, status, source, created_at, updated_at");
      if (error) throw error;
      return data ?? [];
    },
  });
}

// ─── Tab 1: Occupancy ─────────────────────────────────────────
function OccupancyTab() {
  const { data: snapshots = [] } = useSnapshots();
  const { data: beds = [] } = useBeds();
  const { data: residents = [] } = useResidents();
  const [dailyRate, setDailyRate] = useState("33");
  const [vacantBeds, setVacantBeds] = useState("2");
  const [vacantDays, setVacantDays] = useState("14");

  const totalBeds = beds.length;
  const occupiedBeds = beds.filter((b) => (b as any).status === "occupied").length;
  const currentOccupancy = totalBeds > 0 ? (occupiedBeds / totalBeds) * 100 : 0;

  // Build 12-month chart data — use snapshots if available, else compute from residents
  const months = Array.from({ length: 12 }, (_, i) => {
    const d = subMonths(startOfMonth(new Date()), 11 - i);
    return format(d, "yyyy-MM-dd");
  });

  const chartData = months.map((m) => {
    const snap = snapshots.find((s: any) => s.month?.startsWith(m.substring(0, 7)));
    return {
      month: format(parseISO(m), "MMM yy"),
      occupancy: snap ? Number(snap.occupancy_rate) : null,
      revenue: snap ? Number(snap.revenue) : null,
    };
  });

  const vacancyCost = parseFloat(dailyRate) * parseFloat(vacantBeds) * parseFloat(vacantDays);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard title="Total Beds" value={totalBeds.toString()} icon={Home} />
        <KPICard title="Occupied Beds" value={occupiedBeds.toString()} icon={Users} />
        <KPICard
          title="Occupancy Rate"
          value={fmtPct(currentOccupancy)}
          icon={Target}
          color={currentOccupancy >= 90 ? "text-green-600" : currentOccupancy >= 70 ? "text-yellow-600" : "text-red-600"}
        />
        <KPICard title="Vacant Beds" value={(totalBeds - occupiedBeds).toString()} icon={BarChart3} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Occupancy Rate — Last 12 Months</CardTitle>
          <CardDescription>Monthly occupancy percentage per financial snapshot</CardDescription>
        </CardHeader>
        <CardContent>
          {snapshots.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No snapshot data yet. Run monthly snapshots to populate this chart.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                <Tooltip formatter={(v: any) => `${Number(v).toFixed(1)}%`} />
                <Line type="monotone" dataKey="occupancy" stroke="#6366f1" strokeWidth={2} name="Occupancy %" connectNulls />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Vacancy Cost Calculator</CardTitle>
          <CardDescription>Estimate revenue lost to vacant beds</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="space-y-1">
              <Label>Daily Rate per Bed ($)</Label>
              <Input type="number" value={dailyRate} onChange={(e) => setDailyRate(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Vacant Beds</Label>
              <Input type="number" value={vacantBeds} onChange={(e) => setVacantBeds(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Days Vacant</Label>
              <Input type="number" value={vacantDays} onChange={(e) => setVacantDays(e.target.value)} />
            </div>
          </div>
          <div className="rounded-lg bg-red-50 border border-red-200 p-4">
            <p className="text-sm text-red-700">Estimated vacancy cost:</p>
            <p className="text-2xl font-bold text-red-800">{fmt(isNaN(vacancyCost) ? 0 : vacancyCost)}</p>
            <p className="text-xs text-red-600 mt-0.5">
              {vacantBeds} beds × ${dailyRate}/day × {vacantDays} days
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Tab 2: Revenue ──────────────────────────────────────────
function RevenueTab() {
  const { data: snapshots = [] } = useSnapshots();
  const { data: houses = [] } = useHouses();
  const { data: beds = [] } = useBeds();

  const totalRevenue = snapshots.reduce((s: number, r: any) => s + Number(r.revenue), 0);
  const lastMonth = snapshots[snapshots.length - 1];
  const prevMonth = snapshots[snapshots.length - 2];
  const momGrowth = lastMonth && prevMonth && Number(prevMonth.revenue) > 0
    ? ((Number(lastMonth.revenue) - Number(prevMonth.revenue)) / Number(prevMonth.revenue)) * 100
    : 0;

  const totalBeds = beds.length;
  const revenuePerBed = totalBeds > 0 && lastMonth ? Number(lastMonth.revenue) / totalBeds : 0;

  const months = Array.from({ length: 12 }, (_, i) => {
    const d = subMonths(startOfMonth(new Date()), 11 - i);
    return format(d, "yyyy-MM-dd");
  });

  const revenueChartData = months.map((m) => {
    const snap = snapshots.find((s: any) => s.month?.startsWith(m.substring(0, 7)));
    return {
      month: format(parseISO(m), "MMM yy"),
      revenue: snap ? Number(snap.revenue) : 0,
    };
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard title="Total Revenue (12m)" value={fmt(totalRevenue)} icon={DollarSign} />
        <KPICard title="Last Month Revenue" value={fmt(lastMonth ? Number(lastMonth.revenue) : 0)} icon={TrendingUp} trend={momGrowth} />
        <KPICard title="Revenue / Bed" value={fmt(revenuePerBed)} sub="current month" icon={Home} />
        <KPICard title="MoM Growth" value={fmtPct(momGrowth)} icon={BarChart3} color={momGrowth >= 0 ? "text-green-600" : "text-red-600"} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Monthly Revenue — Last 12 Months</CardTitle>
        </CardHeader>
        <CardContent>
          {snapshots.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No snapshot data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: any) => fmt(Number(v))} />
                <Bar dataKey="revenue" fill="#6366f1" name="Revenue" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Tab 3: Expenses ─────────────────────────────────────────
function ExpensesTab() {
  const queryClient = useQueryClient();
  const { data: expenses = [] } = useExpenses();
  const { data: houses = [] } = useHouses();
  const { data: residents = [] } = useResidents();
  const fileRef = useRef<HTMLInputElement>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    house_id: "",
    category: "utilities",
    amount: "",
    date: format(new Date(), "yyyy-MM-dd"),
    description: "",
    vendor_name: "",
  });
  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  const activeResidents = residents.filter((r: any) => r.status === "active").length;

  const byCategory = expenses.reduce((acc: Record<string, number>, e: any) => {
    const cat = e.category ?? "other";
    acc[cat] = (acc[cat] ?? 0) + Number(e.amount);
    return acc;
  }, {});

  const pieData = Object.entries(byCategory).map(([name, value]) => ({ name, value }));
  const totalExpenses = expenses.reduce((s: number, e: any) => s + Number(e.amount), 0);
  const costPerResident = activeResidents > 0 ? totalExpenses / activeResidents : 0;

  // Expense trend by month
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = subMonths(startOfMonth(new Date()), 5 - i);
    return { key: format(d, "yyyy-MM"), label: format(d, "MMM yy") };
  });
  const trendData = months.map(({ key, label }) => ({
    month: label,
    expenses: expenses
      .filter((e: any) => e.date?.startsWith(key))
      .reduce((s: number, e: any) => s + Number(e.amount), 0),
  }));

  const addExpense = useMutation({
    mutationFn: async () => {
      let receipt_url: string | null = null;
      if (receiptFile) {
        const path = `receipts/${Date.now()}_${receiptFile.name}`;
        const { error: upErr } = await supabase.storage.from("expense-receipts").upload(path, receiptFile);
        if (!upErr) {
          const { data: urlData } = supabase.storage.from("expense-receipts").getPublicUrl(path);
          receipt_url = urlData.publicUrl;
        }
      }
      const { error } = await supabase.from("expense_records").insert({
        house_id: form.house_id || null,
        category: form.category,
        amount: parseFloat(form.amount),
        date: form.date,
        description: form.description || null,
        receipt_url,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expense_records_all"] });
      setDialogOpen(false);
      setForm({ house_id: "", category: "utilities", amount: "", date: format(new Date(), "yyyy-MM-dd"), description: "", vendor_name: "" });
      setReceiptFile(null);
      toast.success("Expense recorded");
    },
    onError: (err: any) => toast.error(err.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="grid grid-cols-3 gap-4 flex-1 mr-4">
          <KPICard title="Total Expenses" value={fmt(totalExpenses)} icon={DollarSign} />
          <KPICard title="Cost / Resident" value={fmt(costPerResident)} sub="total expenses ÷ active residents" icon={Users} />
          <KPICard title="Expense Records" value={expenses.length.toString()} icon={BarChart3} />
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Add Expense</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Record Expense</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-1">
                <Label>House</Label>
                <Select value={form.house_id} onValueChange={(v) => setForm({ ...form, house_id: v })}>
                  <SelectTrigger><SelectValue placeholder="All houses / General" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All / General</SelectItem>
                    {houses.map((h: any) => <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Category *</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["mortgage_lease","utilities","insurance","maintenance","supplies","staff","marketing","licensing","other"].map((c) => (
                      <SelectItem key={c} value={c}>{c.replace("_", " / ").replace(/\b\w/g, (l) => l.toUpperCase())}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Amount ($) *</Label>
                  <Input type="number" min="0" step="0.01" value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label>Date *</Label>
                  <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Description</Label>
                <Textarea rows={2} value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>Receipt (optional)</Label>
                <input type="file" ref={fileRef} className="hidden" onChange={(e) => setReceiptFile(e.target.files?.[0] ?? null)} />
                <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                  <Upload className="h-4 w-4 mr-2" />
                  {receiptFile ? receiptFile.name : "Upload Receipt"}
                </Button>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button disabled={!form.amount || !form.date || addExpense.isPending} onClick={() => addExpense.mutate()}>
                  {addExpense.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Save Expense
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Expenses by Category</CardTitle></CardHeader>
          <CardContent>
            {pieData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No expenses recorded yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: any) => fmt(Number(v))} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>6-Month Expense Trend</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: any) => fmt(Number(v))} />
                <Area type="monotone" dataKey="expenses" stroke="#ec4899" fill="#fce7f3" name="Expenses" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {expenses.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Recent Expenses</CardTitle></CardHeader>
          <CardContent>
            <div className="divide-y">
              {expenses.slice(0, 10).map((e: any) => (
                <div key={e.id} className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-medium">{e.description || e.category}</p>
                    <p className="text-xs text-muted-foreground">{e.date} · {e.category}</p>
                  </div>
                  <span className="font-semibold">{fmt(Number(e.amount))}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Tab 4: Retention ────────────────────────────────────────
function RetentionTab() {
  const { data: residents = [] } = useResidents();

  const discharged = residents.filter((r: any) => r.move_out_date);
  const avgLOS = discharged.length > 0
    ? discharged.reduce((sum: number, r: any) => {
        const days = differenceInDays(
          parseISO(r.move_out_date),
          parseISO(r.move_in_date ?? r.move_out_date)
        );
        return sum + Math.max(0, days);
      }, 0) / discharged.length
    : 0;

  // 30/60/90 day retention
  const stayed30  = discharged.filter((r: any) => differenceInDays(parseISO(r.move_out_date), parseISO(r.move_in_date ?? r.move_out_date)) >= 30).length;
  const stayed60  = discharged.filter((r: any) => differenceInDays(parseISO(r.move_out_date), parseISO(r.move_in_date ?? r.move_out_date)) >= 60).length;
  const stayed90  = discharged.filter((r: any) => differenceInDays(parseISO(r.move_out_date), parseISO(r.move_in_date ?? r.move_out_date)) >= 90).length;

  const ret30  = discharged.length > 0 ? (stayed30  / discharged.length) * 100 : 0;
  const ret60  = discharged.length > 0 ? (stayed60  / discharged.length) * 100 : 0;
  const ret90  = discharged.length > 0 ? (stayed90  / discharged.length) * 100 : 0;

  const retentionData = [
    { milestone: "30 Days", rate: ret30,  count: stayed30  },
    { milestone: "60 Days", rate: ret60,  count: stayed60  },
    { milestone: "90 Days", rate: ret90,  count: stayed90  },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard title="Avg Length of Stay" value={`${Math.round(avgLOS)} days`} icon={Users} />
        <KPICard title="30-Day Retention" value={fmtPct(ret30)} icon={Target} color={ret30 >= 80 ? "text-green-600" : "text-yellow-600"} />
        <KPICard title="60-Day Retention" value={fmtPct(ret60)} icon={Target} color={ret60 >= 70 ? "text-green-600" : "text-yellow-600"} />
        <KPICard title="90-Day Retention" value={fmtPct(ret90)} icon={Target} color={ret90 >= 60 ? "text-green-600" : "text-yellow-600"} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Retention Rates by Milestone</CardTitle>
          <CardDescription>
            Based on {discharged.length} discharged residents with move-out dates recorded
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={retentionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="milestone" />
              <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
              <Tooltip formatter={(v: any) => `${Number(v).toFixed(1)}%`} />
              <Bar dataKey="rate" fill="#22c55e" name="Retention Rate" radius={[4, 4, 0, 0]} label={{ position: "top", formatter: (v: any) => `${Number(v).toFixed(0)}%` }} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Resident Status Breakdown</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {["active", "inactive", "waitlisted"].map((status) => {
              const count = residents.filter((r: any) => r.status === status).length;
              return (
                <div key={status} className="text-center p-4 rounded-lg border">
                  <p className="text-2xl font-bold">{count}</p>
                  <p className="text-sm text-muted-foreground capitalize">{status}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Tab 5: Pipeline ─────────────────────────────────────────
function PipelineTab() {
  const { data: leads = [] } = useLeads();

  const total      = leads.length;
  const newLeads   = leads.filter((l: any) => l.status === "new").length;
  const screening  = leads.filter((l: any) => l.status === "screening").length;
  const touring    = leads.filter((l: any) => l.status === "touring" || l.status === "visit_scheduled").length;
  const approved   = leads.filter((l: any) => l.status === "approved").length;
  const movedIn    = leads.filter((l: any) => l.status === "moved_in").length;
  const convRate   = total > 0 ? (movedIn / total) * 100 : 0;

  const funnelData = [
    { name: "Total Leads",    value: total,     fill: "#6366f1" },
    { name: "Screening",      value: screening, fill: "#8b5cf6" },
    { name: "Tour Scheduled", value: touring,   fill: "#a78bfa" },
    { name: "Approved",       value: approved,  fill: "#22c55e" },
    { name: "Moved In",       value: movedIn,   fill: "#16a34a" },
  ];

  // Referral source breakdown
  const sourceMap = leads.reduce((acc: Record<string, number>, l: any) => {
    const src = l.source ?? "Unknown";
    acc[src] = (acc[src] ?? 0) + 1;
    return acc;
  }, {});
  const sourceData = Object.entries(sourceMap).map(([name, count]) => ({ name, leads: count }));

  const avgDays = leads
    .filter((l: any) => l.status === "moved_in" && l.created_at && l.updated_at)
    .reduce((sum: number, l: any, _: any, arr: any[]) => {
      return sum + differenceInDays(parseISO(l.updated_at), parseISO(l.created_at)) / arr.length;
    }, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard title="Total Leads" value={total.toString()} icon={Users} />
        <KPICard title="Moved In" value={movedIn.toString()} icon={Home} />
        <KPICard title="Conversion Rate" value={fmtPct(convRate)} icon={Target} />
        <KPICard title="Avg Days in Pipeline" value={`${Math.round(avgDays)} days`} icon={BarChart3} />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Lead Funnel</CardTitle></CardHeader>
          <CardContent>
            {leads.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No intake leads yet.</p>
            ) : (
              <div className="space-y-2">
                {funnelData.map((stage, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-32 text-right text-sm text-muted-foreground">{stage.name}</div>
                    <div className="flex-1 h-8 bg-muted rounded overflow-hidden">
                      <div
                        className="h-full rounded flex items-center justify-end pr-2"
                        style={{ width: total > 0 ? `${(stage.value / total) * 100}%` : "0%", backgroundColor: stage.fill }}
                      >
                        <span className="text-white text-xs font-medium">{stage.value}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Leads by Source</CardTitle></CardHeader>
          <CardContent>
            {sourceData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No lead source data.</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={sourceData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" width={130} />
                  <Tooltip />
                  <Bar dataKey="leads" fill="#6366f1" name="Leads" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── Tab 6: Outcomes ─────────────────────────────────────────
const MILESTONE_LABELS: Record<string, string> = {
  sobriety_30:           "30-Day Sobriety",
  sobriety_60:           "60-Day Sobriety",
  sobriety_90:           "90-Day Sobriety",
  sobriety_180:          "180-Day Sobriety",
  sobriety_365:          "1-Year Sobriety",
  employment_obtained:   "Employment Obtained",
  employment_maintained: "Employment Maintained",
  independent_housing:   "Independent Housing",
  program_completion:    "Program Completion",
  relapse:               "Relapse",
  readmission:           "Readmission",
};

function OutcomesTab() {
  const queryClient = useQueryClient();
  const { data: outcomes = [] } = useOutcomes();
  const { data: residents = [] } = useResidents();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ resident_id: "", milestone_type: "sobriety_30", milestone_date: format(new Date(), "yyyy-MM-dd"), notes: "" });

  const addOutcome = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("resident_outcomes").insert({
        resident_id: form.resident_id,
        milestone_type: form.milestone_type,
        milestone_date: form.milestone_date,
        notes: form.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resident_outcomes_all"] });
      setDialogOpen(false);
      setForm({ resident_id: "", milestone_type: "sobriety_30", milestone_date: format(new Date(), "yyyy-MM-dd"), notes: "" });
      toast.success("Milestone recorded");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const milestoneCount = Object.entries(MILESTONE_LABELS).map(([key, label]) => ({
    name: label.replace(/[- ].*/g, ""),
    full: label,
    count: outcomes.filter((o: any) => o.milestone_type === key).length,
  }));

  const sobrietyMilestones = outcomes.filter((o: any) => o.milestone_type?.startsWith("sobriety_")).length;
  const employmentCount    = outcomes.filter((o: any) => o.milestone_type?.startsWith("employment_")).length;
  const completionCount    = outcomes.filter((o: any) => o.milestone_type === "program_completion").length;
  const relapseCount       = outcomes.filter((o: any) => o.milestone_type === "relapse").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1 mr-4">
          <KPICard title="Total Milestones" value={outcomes.length.toString()} icon={Award} />
          <KPICard title="Sobriety Milestones" value={sobrietyMilestones.toString()} icon={Heart} color="text-green-600" />
          <KPICard title="Employment Gains" value={employmentCount.toString()} icon={Briefcase} color="text-blue-600" />
          <KPICard title="Program Completions" value={completionCount.toString()} icon={Target} color="text-purple-600" />
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Record Milestone</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Record Resident Milestone</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-1">
                <Label>Resident *</Label>
                <Select value={form.resident_id} onValueChange={(v) => setForm({ ...form, resident_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select resident" /></SelectTrigger>
                  <SelectContent>
                    {residents.map((r: any) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Milestone *</Label>
                <Select value={form.milestone_type} onValueChange={(v) => setForm({ ...form, milestone_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(MILESTONE_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Date *</Label>
                <Input type="date" value={form.milestone_date} onChange={(e) => setForm({ ...form, milestone_date: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>Notes</Label>
                <Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button disabled={!form.resident_id || !form.milestone_date || addOutcome.isPending} onClick={() => addOutcome.mutate()}>
                  {addOutcome.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Save
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Milestones by Type</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={milestoneCount} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" allowDecimals={false} />
                <YAxis type="category" dataKey="name" width={100} />
                <Tooltip />
                <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Recent Milestones</CardTitle></CardHeader>
          <CardContent>
            {outcomes.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No milestones recorded yet.</p>
            ) : (
              <div className="divide-y max-h-72 overflow-y-auto">
                {outcomes.slice(0, 15).map((o: any) => (
                  <div key={o.id} className="py-2 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{(o.residents as any)?.name ?? "Unknown"}</p>
                      <p className="text-xs text-muted-foreground">{MILESTONE_LABELS[o.milestone_type] ?? o.milestone_type}</p>
                    </div>
                    <Badge variant={o.milestone_type === "relapse" ? "destructive" : "secondary"}>
                      {o.milestone_date}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {relapseCount > 0 && (
        <Card className="border-red-200">
          <CardContent className="p-4">
            <p className="text-sm text-red-700">
              <strong>{relapseCount} relapse{relapseCount !== 1 ? "s" : ""}</strong> recorded.
              Track these carefully for program improvement and grant reporting.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Main page ───────────────────────────────────────────────
export default function Analytics() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Occupancy, revenue, expenses, retention, pipeline &amp; outcomes</p>
        </div>
        <Badge variant="secondary">
          <BarChart3 className="h-3.5 w-3.5 mr-1" />
          Live Data
        </Badge>
      </div>

      <Tabs defaultValue="occupancy">
        <TabsList className="grid grid-cols-6 w-full">
          <TabsTrigger value="occupancy">Occupancy</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="retention">Retention</TabsTrigger>
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          <TabsTrigger value="outcomes">Outcomes</TabsTrigger>
        </TabsList>
        <TabsContent value="occupancy" className="mt-6"><OccupancyTab /></TabsContent>
        <TabsContent value="revenue"   className="mt-6"><RevenueTab /></TabsContent>
        <TabsContent value="expenses"  className="mt-6"><ExpensesTab /></TabsContent>
        <TabsContent value="retention" className="mt-6"><RetentionTab /></TabsContent>
        <TabsContent value="pipeline"  className="mt-6"><PipelineTab /></TabsContent>
        <TabsContent value="outcomes"  className="mt-6"><OutcomesTab /></TabsContent>
      </Tabs>
    </div>
  );
}
