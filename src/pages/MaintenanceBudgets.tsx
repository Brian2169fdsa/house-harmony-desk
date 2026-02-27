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
import { Progress } from "@/components/ui/progress";
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { Plus, DollarSign, TrendingUp, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";

const COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ec4899", "#14b8a6", "#f97316"];
const fmt = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 0 })}`;

const currentYear    = new Date().getFullYear();
const currentQuarter = Math.ceil((new Date().getMonth() + 1) / 3);

export default function MaintenanceBudgets() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filterYear, setFilterYear] = useState(currentYear.toString());
  const [filterQ, setFilterQ] = useState(currentQuarter.toString());
  const [form, setForm] = useState({
    house_id:  "",
    quarter:   currentQuarter.toString(),
    year:      currentYear.toString(),
    allocated: "",
  });

  const { data: houses = [] } = useQuery({
    queryKey: ["houses"],
    queryFn: async () => {
      const { data, error } = await supabase.from("houses").select("id, name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: budgets = [], isLoading } = useQuery({
    queryKey: ["maintenance_budgets", filterYear, filterQ],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("maintenance_budgets")
        .select("*, houses(name)")
        .eq("year", parseInt(filterYear, 10))
        .eq("quarter", parseInt(filterQ, 10))
        .order("created_at");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: costs = [] } = useQuery({
    queryKey: ["maintenance_costs_all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("maintenance_costs")
        .select("cost_type, amount");
      if (error) throw error;
      return data ?? [];
    },
  });

  const totalAllocated = budgets.reduce((s: number, b: any) => s + Number(b.allocated), 0);
  const totalSpent     = budgets.reduce((s: number, b: any) => s + Number(b.spent), 0);
  const overBudget     = budgets.filter((b: any) => Number(b.spent) > Number(b.allocated)).length;

  // Cost by type (pie)
  const byType = costs.reduce((acc: Record<string, number>, c: any) => {
    acc[c.cost_type] = (acc[c.cost_type] ?? 0) + Number(c.amount);
    return acc;
  }, {});
  const pieData = Object.entries(byType).map(([name, value]) => ({ name, value }));

  // Budget vs actual (bar)
  const barData = budgets.map((b: any) => ({
    house:     (b.houses as any)?.name ?? "Unknown",
    allocated: Number(b.allocated),
    spent:     Number(b.spent),
  }));

  const saveBudget = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("maintenance_budgets").upsert({
        house_id:  form.house_id,
        quarter:   parseInt(form.quarter, 10),
        year:      parseInt(form.year, 10),
        allocated: parseFloat(form.allocated),
        spent:     0,
      }, { onConflict: "house_id,quarter,year" });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenance_budgets"] });
      setDialogOpen(false);
      setForm({ house_id: "", quarter: currentQuarter.toString(), year: currentYear.toString(), allocated: "" });
      toast.success("Budget allocation saved");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const beds = useQuery({
    queryKey: ["beds_count"],
    queryFn: async () => {
      const { count } = await supabase.from("beds").select("id", { count: "exact", head: true });
      return count ?? 0;
    },
  });
  const costPerBed = (beds.data ?? 0) > 0 ? totalSpent / (beds.data ?? 1) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Maintenance Budgets</h1>
          <p className="text-muted-foreground">Budget allocation and spending by house per quarter</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Set Budget</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Set Budget Allocation</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-1">
                <Label>House *</Label>
                <Select value={form.house_id} onValueChange={(v) => setForm({ ...form, house_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select house" /></SelectTrigger>
                  <SelectContent>
                    {houses.map((h: any) => <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Quarter</Label>
                  <Select value={form.quarter} onValueChange={(v) => setForm({ ...form, quarter: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4].map((q) => <SelectItem key={q} value={q.toString()}>Q{q}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Year</Label>
                  <Select value={form.year} onValueChange={(v) => setForm({ ...form, year: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[currentYear - 1, currentYear, currentYear + 1].map((y) => (
                        <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1">
                <Label>Budget Amount ($) *</Label>
                <Input type="number" value={form.allocated} onChange={(e) => setForm({ ...form, allocated: e.target.value })} />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button disabled={!form.house_id || !form.allocated || saveBudget.isPending} onClick={() => saveBudget.mutate()}>
                  {saveBudget.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Save
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="flex items-center gap-2">
          <Label>Quarter:</Label>
          <Select value={filterQ} onValueChange={setFilterQ}>
            <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4].map((q) => <SelectItem key={q} value={q.toString()}>Q{q}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Label>Year:</Label>
          <Select value={filterYear} onValueChange={setFilterYear}>
            <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
            <SelectContent>
              {[currentYear - 1, currentYear, currentYear + 1].map((y) => (
                <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground uppercase">Total Allocated</p>
            <p className="text-2xl font-bold text-primary">{fmt(totalAllocated)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground uppercase">Total Spent</p>
            <p className={`text-2xl font-bold ${totalSpent > totalAllocated ? "text-red-600" : "text-green-600"}`}>
              {fmt(totalSpent)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground uppercase">Cost / Bed</p>
            <p className="text-2xl font-bold">{fmt(costPerBed)}</p>
          </CardContent>
        </Card>
        <Card className={overBudget > 0 ? "border-red-200" : ""}>
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground uppercase">Over Budget</p>
            <p className={`text-2xl font-bold ${overBudget > 0 ? "text-red-600" : "text-green-600"}`}>
              {overBudget} house{overBudget !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Budget cards */}
      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : budgets.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <DollarSign className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-medium">No budgets set for Q{filterQ} {filterYear}</p>
            <p className="text-sm text-muted-foreground">Click "Set Budget" to allocate maintenance funds per house.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {budgets.map((b: any) => {
            const pct     = b.allocated > 0 ? Math.min((Number(b.spent) / Number(b.allocated)) * 100, 100) : 0;
            const over    = Number(b.spent) > Number(b.allocated);
            return (
              <Card key={b.id} className={over ? "border-red-200" : ""}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{(b.houses as any)?.name ?? "Unknown"}</CardTitle>
                    <Badge variant={over ? "destructive" : pct > 80 ? "secondary" : "outline"}>
                      {over ? "Over Budget" : pct > 80 ? "Near Limit" : "On Track"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Progress value={pct} className={over ? "[&>div]:bg-red-500" : ""} />
                  <div className="flex justify-between text-sm">
                    <span>Spent: <strong>{fmt(Number(b.spent))}</strong></span>
                    <span>Allocated: <strong>{fmt(Number(b.allocated))}</strong></span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {over
                      ? `Over by ${fmt(Number(b.spent) - Number(b.allocated))}`
                      : `${fmt(Number(b.allocated) - Number(b.spent))} remaining`}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Budget vs Actual by House</CardTitle></CardHeader>
          <CardContent>
            {barData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No data for selected period.</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="house" />
                  <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: any) => fmt(Number(v))} />
                  <Legend />
                  <Bar dataKey="allocated" fill="#6366f1" name="Allocated" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="spent"     fill="#ec4899" name="Spent"     radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Spending by Cost Type</CardTitle></CardHeader>
          <CardContent>
            {pieData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No cost records yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
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
