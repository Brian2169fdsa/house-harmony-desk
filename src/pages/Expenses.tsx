import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
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
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { DollarSign, Plus, Trash2, TrendingDown, RefreshCw, Receipt } from "lucide-react";
import { toast } from "sonner";
import { format, parseISO, startOfMonth, endOfMonth, subMonths } from "date-fns";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Expense {
  id: string;
  category: string;
  vendor: string | null;
  description: string;
  amount: number;
  expense_date: string;
  payment_method: string | null;
  reference_number: string | null;
  is_recurring: boolean;
  recurring_frequency: string | null;
  notes: string | null;
  created_at: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES: { value: string; label: string; color: string }[] = [
  { value: "mortgage_rent", label: "Mortgage / Rent", color: "#6366f1" },
  { value: "utilities", label: "Utilities", color: "#f59e0b" },
  { value: "insurance", label: "Insurance", color: "#10b981" },
  { value: "supplies", label: "Supplies", color: "#3b82f6" },
  { value: "staff_payroll", label: "Staff Payroll", color: "#8b5cf6" },
  { value: "maintenance_repair", label: "Maintenance & Repair", color: "#ef4444" },
  { value: "drug_testing", label: "Drug Testing", color: "#06b6d4" },
  { value: "marketing", label: "Marketing", color: "#f97316" },
  { value: "legal_compliance", label: "Legal & Compliance", color: "#84cc16" },
  { value: "licensing_fees", label: "Licensing Fees", color: "#ec4899" },
  { value: "training", label: "Training", color: "#14b8a6" },
  { value: "food_household", label: "Food & Household", color: "#a78bfa" },
  { value: "transportation", label: "Transportation", color: "#fb7185" },
  { value: "other", label: "Other", color: "#94a3b8" },
];

const PAYMENT_METHODS = [
  { value: "check", label: "Check" },
  { value: "ach", label: "ACH / Bank Transfer" },
  { value: "credit_card", label: "Credit Card" },
  { value: "cash", label: "Cash" },
  { value: "other", label: "Other" },
];

const fmt = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

const defaultForm = {
  category: "",
  vendor: "",
  description: "",
  amount: "",
  expense_date: new Date().toISOString().split("T")[0],
  payment_method: "",
  reference_number: "",
  is_recurring: "false",
  recurring_frequency: "",
  notes: "",
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Expenses() {
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [filterCategory, setFilterCategory] = useState("all");
  const [viewMode, setViewMode] = useState<"list" | "charts">("list");

  // Date window: current month + prior 5 months
  const now = new Date();
  const windowStart = format(startOfMonth(subMonths(now, 5)), "yyyy-MM-dd");
  const windowEnd = format(endOfMonth(now), "yyyy-MM-dd");

  const { data: expenses = [], isLoading } = useQuery({
    queryKey: ["expenses", windowStart, windowEnd],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("expense_records")
        .select("*")
        .eq("user_id", user?.id)
        .gte("expense_date", windowStart)
        .lte("expense_date", windowEnd)
        .order("expense_date", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Expense[];
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      if (!form.category) throw new Error("Select a category");
      if (!form.description.trim()) throw new Error("Enter a description");
      if (!form.amount || Number(form.amount) <= 0) throw new Error("Enter a valid amount");
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from("expense_records").insert({
        user_id: user?.id,
        category: form.category,
        vendor: form.vendor || null,
        description: form.description.trim(),
        amount: Number(form.amount),
        expense_date: form.expense_date,
        payment_method: form.payment_method || null,
        reference_number: form.reference_number || null,
        is_recurring: form.is_recurring === "true",
        recurring_frequency: form.recurring_frequency || null,
        notes: form.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      setShowAdd(false);
      setForm(defaultForm);
      toast.success("Expense recorded");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("expense_records").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["expenses"] }),
    onError: (e: any) => toast.error(e.message),
  });

  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  const filtered = filterCategory === "all" ? expenses : expenses.filter((e) => e.category === filterCategory);

  // Aggregates
  const totalThisMonth = expenses
    .filter((e) => e.expense_date >= format(startOfMonth(now), "yyyy-MM-dd"))
    .reduce((s, e) => s + e.amount, 0);

  const totalLast6 = expenses.reduce((s, e) => s + e.amount, 0);

  // Monthly breakdown for bar chart
  const monthlyTotals: Record<string, number> = {};
  for (let i = 5; i >= 0; i--) {
    const m = subMonths(now, i);
    const key = format(m, "MMM yyyy");
    monthlyTotals[key] = 0;
  }
  expenses.forEach((e) => {
    const key = format(parseISO(e.expense_date), "MMM yyyy");
    if (key in monthlyTotals) monthlyTotals[key] += e.amount;
  });
  const barData = Object.entries(monthlyTotals).map(([month, total]) => ({ month, total }));

  // Category breakdown for pie
  const categoryTotals: Record<string, number> = {};
  expenses.forEach((e) => { categoryTotals[e.category] = (categoryTotals[e.category] ?? 0) + e.amount; });
  const pieData = Object.entries(categoryTotals)
    .map(([cat, total]) => ({
      name: CATEGORIES.find((c) => c.value === cat)?.label ?? cat,
      value: total,
      color: CATEGORIES.find((c) => c.value === cat)?.color ?? "#94a3b8",
    }))
    .sort((a, b) => b.value - a.value);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Expenses</h1>
          <p className="text-muted-foreground">Track operating costs for P&L, ROI analysis, and QuickBooks sync</p>
        </div>
        <div className="flex gap-2">
          <div className="flex rounded-lg border overflow-hidden">
            <button
              onClick={() => setViewMode("list")}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${viewMode === "list" ? "bg-primary text-primary-foreground" : "hover:bg-muted/50"}`}
            >
              List
            </button>
            <button
              onClick={() => setViewMode("charts")}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${viewMode === "charts" ? "bg-primary text-primary-foreground" : "hover:bg-muted/50"}`}
            >
              Charts
            </button>
          </div>
          <Button onClick={() => setShowAdd(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Expense
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <DollarSign className="h-8 w-8 text-red-500 shrink-0" />
            <div>
              <p className="text-xl font-bold">{fmt(totalThisMonth)}</p>
              <p className="text-xs text-muted-foreground">This Month</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <TrendingDown className="h-8 w-8 text-orange-500 shrink-0" />
            <div>
              <p className="text-xl font-bold">{fmt(totalLast6)}</p>
              <p className="text-xs text-muted-foreground">Last 6 Months</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <RefreshCw className="h-8 w-8 text-blue-500 shrink-0" />
            <div>
              <p className="text-xl font-bold">{expenses.filter((e) => e.is_recurring).length}</p>
              <p className="text-xs text-muted-foreground">Recurring Items</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {viewMode === "charts" ? (
        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Monthly Expenses (6 months)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, "Expenses"]} />
                  <Bar dataKey="total" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Expense by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, ""]} />
                  <Legend iconSize={10} iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      ) : (
        <>
          {/* Filter */}
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-56 h-8 text-xs">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All Categories</SelectItem>
              {CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value} className="text-xs">{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* List */}
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Loading...</div>
          ) : filtered.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Receipt className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium">No expenses recorded</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Track operating costs to power your P&L, ROI projections, and QuickBooks sync.
                </p>
                <Button onClick={() => setShowAdd(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Expense
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {filtered.map((exp) => {
                const cat = CATEGORIES.find((c) => c.value === exp.category);
                return (
                  <Card key={exp.id} className="hover:bg-muted/30 transition-colors">
                    <CardContent className="py-3 px-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div
                            className="h-2.5 w-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: cat?.color ?? "#94a3b8" }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-sm">{exp.description}</span>
                              <Badge variant="outline" className="text-xs">{cat?.label ?? exp.category}</Badge>
                              {exp.is_recurring && (
                                <Badge variant="secondary" className="text-xs">
                                  <RefreshCw className="h-2.5 w-2.5 mr-1" />
                                  {exp.recurring_frequency ?? "Recurring"}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {format(parseISO(exp.expense_date), "MMM d, yyyy")}
                              {exp.vendor && ` · ${exp.vendor}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="font-bold text-sm text-red-700">{fmt(exp.amount)}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-red-600"
                            onClick={() => { if (confirm("Delete this expense?")) deleteMutation.mutate(exp.id); }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              {/* Running total */}
              <div className="flex justify-between items-center px-4 py-2 rounded-lg bg-muted/40 text-sm font-semibold">
                <span>Total ({filtered.length} items)</span>
                <span className="text-red-700">{fmt(filtered.reduce((s, e) => s + e.amount, 0))}</span>
              </div>
            </div>
          )}
        </>
      )}

      {/* Add Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Expense</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2 col-span-2">
                <Label>Category *</Label>
                <Select value={form.category} onValueChange={set("category")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Description *</Label>
                <Input value={form.description} onChange={(e) => set("description")(e.target.value)} placeholder="e.g. Monthly electric bill — 123 Main St" />
              </div>
              <div className="space-y-2">
                <Label>Amount *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                  <Input type="number" min="0" step="0.01" value={form.amount} onChange={(e) => set("amount")(e.target.value)} className="pl-6" placeholder="0.00" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Date *</Label>
                <Input type="date" value={form.expense_date} onChange={(e) => set("expense_date")(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Vendor</Label>
                <Input value={form.vendor} onChange={(e) => set("vendor")(e.target.value)} placeholder="APS, Amazon, etc." />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Payment Method</Label>
                <Select value={form.payment_method} onValueChange={set("payment_method")}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map((m) => (
                      <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs">Recurring?</Label>
                <Select value={form.is_recurring} onValueChange={set("is_recurring")}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="false">One-time</SelectItem>
                    <SelectItem value="true">Recurring</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {form.is_recurring === "true" && (
                <div className="space-y-2">
                  <Label className="text-xs">Frequency</Label>
                  <Select value={form.recurring_frequency} onValueChange={set("recurring_frequency")}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="annual">Annual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-2 col-span-2">
                <Label className="text-xs">Reference / Check #</Label>
                <Input value={form.reference_number} onChange={(e) => set("reference_number")(e.target.value)} placeholder="Optional reference number" />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Notes</Label>
              <Textarea value={form.notes} onChange={(e) => set("notes")(e.target.value)} rows={2} placeholder="Optional notes..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={() => addMutation.mutate()} disabled={addMutation.isPending}>
              {addMutation.isPending ? "Saving..." : "Save Expense"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
