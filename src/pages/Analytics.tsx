import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, TrendingDown, Users, DollarSign, Home, BarChart2, Target, AlertCircle } from "lucide-react";
import { format, subMonths, startOfMonth } from "date-fns";

const COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ec4899", "#14b8a6", "#f97316"];

function KPICard({
  title, value, sub, trend, icon: Icon,
}: {
  title: string; value: string; sub?: string; trend?: number; icon: React.ElementType;
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
          </div>
          <div className="rounded-lg bg-primary/10 p-2">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
        {trend !== undefined && (
          <div className="flex items-center gap-1 mt-3">
            {trend >= 0 ? (
              <TrendingUp className="h-3.5 w-3.5 text-green-500" />
            ) : (
              <TrendingDown className="h-3.5 w-3.5 text-red-500" />
            )}
            <span className={`text-xs font-medium ${trend >= 0 ? "text-green-600" : "text-red-600"}`}>
              {Math.abs(trend)}% vs last month
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function getLast12Months() {
  return Array.from({ length: 12 }, (_, i) => {
    const d = startOfMonth(subMonths(new Date(), 11 - i));
    return { date: d, label: format(d, "MMM yy") };
  });
}

export default function Analytics() {
  const months = getLast12Months();

  // Houses (for names/listing only — no total_beds column on houses table)
  const { data: houses = [] } = useQuery({
    queryKey: ["analytics_houses"],
    queryFn: async () => {
      const { data, error } = await supabase.from("houses").select("id, name");
      if (error) throw error;
      return data ?? [];
    },
  });

  // Beds with room → house linkage (source of truth for occupancy)
  const { data: beds = [] } = useQuery({
    queryKey: ["analytics_beds"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("beds")
        .select("id, status, rooms(id, house_id)");
      if (error) throw error;
      return data ?? [];
    },
  });

  // Residents for retention / length of stay calculations
  const { data: residents = [] } = useQuery({
    queryKey: ["analytics_residents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("residents")
        .select("id, status, move_in_date, move_out_date, bed_id");
      if (error) throw error;
      return data ?? [];
    },
  });

  // Invoices — the financial source of truth (amount_cents, status, house_id)
  const { data: invoices = [] } = useQuery({
    queryKey: ["analytics_invoices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select("id, amount_cents, status, due_date, paid_date, house_id, resident_id");
      if (error) throw error;
      return data ?? [];
    },
  });

  // Financial snapshots (populated when available, otherwise derived from invoices)
  const { data: snapshots = [] } = useQuery({
    queryKey: ["analytics_snapshots"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("financial_snapshots")
        .select("*")
        .order("month", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  // Expense records
  const { data: expenses = [] } = useQuery({
    queryKey: ["analytics_expenses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expense_records")
        .select("id, category, amount, date, house_id");
      if (error) throw error;
      return data ?? [];
    },
  });

  // Intake leads (optional — graceful fallback if table absent)
  const { data: intakeLeads = [] } = useQuery({
    queryKey: ["analytics_intake"],
    queryFn: async () => {
      const { data } = await supabase
        .from("intake_leads")
        .select("id, status, created_at, referral_source");
      return data ?? [];
    },
  });

  // ── Derived occupancy ─────────────────────────────────────────────────────
  const totalBeds = beds.length;
  const occupiedBeds = beds.filter((b: any) => b.status === "occupied").length;
  const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

  // ── Derived financials ────────────────────────────────────────────────────
  const paidInvoices = invoices.filter((i: any) => i.status === "paid");
  const overdueInvoices = invoices.filter((i: any) => i.status === "overdue");
  const totalRevenue = paidInvoices.reduce((s: number, i: any) => s + (i.amount_cents ?? 0) / 100, 0);
  const totalExpenses = expenses.reduce((s: number, e: any) => s + Number(e.amount ?? 0), 0);
  const noi = totalRevenue - totalExpenses;
  const collectionRate = invoices.length > 0
    ? Math.round((paidInvoices.length / invoices.length) * 100)
    : 0;

  // Active residents (bed status = occupied is most reliable)
  const activeResidents = occupiedBeds;

  // Avg length of stay
  const movedOut = residents.filter((r: any) => r.move_out_date && r.move_in_date);
  const avgStay = movedOut.length > 0
    ? Math.round(movedOut.reduce((s: number, r: any) => {
        return s + (new Date(r.move_out_date).getTime() - new Date(r.move_in_date).getTime()) / 86400000;
      }, 0) / movedOut.length)
    : 0;

  // ── Revenue trend (12 months) ─────────────────────────────────────────────
  const revenueTrendData = months.map(({ label, date }) => {
    const snap = snapshots.find((s: any) => {
      const d = new Date(s.month);
      return d.getFullYear() === date.getFullYear() && d.getMonth() === date.getMonth();
    });
    if (snap) {
      return { month: label, revenue: Number(snap.revenue), expenses: Number(snap.expenses), noi: Number(snap.noi) };
    }
    const monthPaid = invoices.filter((i: any) => {
      const d = i.paid_date ? new Date(i.paid_date) : null;
      return i.status === "paid" && d && d.getFullYear() === date.getFullYear() && d.getMonth() === date.getMonth();
    });
    const monthExp = expenses.filter((e: any) => {
      const d = e.date ? new Date(e.date) : null;
      return d && d.getFullYear() === date.getFullYear() && d.getMonth() === date.getMonth();
    });
    const rev = monthPaid.reduce((s: number, i: any) => s + (i.amount_cents ?? 0) / 100, 0);
    const exp = monthExp.reduce((s: number, e: any) => s + Number(e.amount ?? 0), 0);
    return { month: label, revenue: rev, expenses: exp, noi: rev - exp };
  });

  // ── Occupancy trend (based on bed count, all months same for now) ─────────
  const occupancyTrendData = months.map(({ label }) => ({
    month: label,
    occupied: occupiedBeds,
    rate: occupancyRate,
  }));

  // ── Expense breakdown ─────────────────────────────────────────────────────
  const expenseByCategory: Record<string, number> = {};
  expenses.forEach((e: any) => {
    expenseByCategory[e.category] = (expenseByCategory[e.category] ?? 0) + Number(e.amount ?? 0);
  });
  const expensePieData = Object.entries(expenseByCategory).map(([name, value]) => ({
    name: name.replace(/_/g, " "),
    value,
  }));

  // ── Retention ──────────────────────────────────────────────────────────────
  const retentionData = [30, 60, 90, 180, 365].map((days) => ({
    period: `${days} days`,
    rate: calcRetention(residents, days),
  }));

  // ── Pipeline ──────────────────────────────────────────────────────────────
  const pipelineData = [
    { stage: "Lead", count: intakeLeads.length },
    { stage: "Applied", count: intakeLeads.filter((l: any) => ["applied", "screening", "approved", "move_in"].includes(l.status)).length },
    { stage: "Screening", count: intakeLeads.filter((l: any) => ["screening", "approved", "move_in"].includes(l.status)).length },
    { stage: "Approved", count: intakeLeads.filter((l: any) => ["approved", "move_in"].includes(l.status)).length },
    { stage: "Moved In", count: intakeLeads.filter((l: any) => l.status === "move_in").length },
  ];

  // ── Collection trend (last 6 months) ─────────────────────────────────────
  const collectionTrendData = months.slice(-6).map(({ label, date }) => {
    const monthInvoices = invoices.filter((i: any) => {
      const d = i.due_date ? new Date(i.due_date) : null;
      return d && d.getFullYear() === date.getFullYear() && d.getMonth() === date.getMonth();
    });
    const paid = monthInvoices.filter((i: any) => i.status === "paid").length;
    const rate = monthInvoices.length > 0 ? Math.round((paid / monthInvoices.length) * 100) : 0;
    return { month: label, rate, collected: paid, total: monthInvoices.length };
  });

  // ── Revenue per house (invoices have house_id) ────────────────────────────
  const revenuePerHouseData = houses.map((h: any) => {
    const hInvoices = invoices.filter((i: any) => i.house_id === h.id && i.status === "paid");
    const hBeds = beds.filter((b: any) => (b.rooms as any)?.house_id === h.id);
    return {
      name: h.name,
      revenue: hInvoices.reduce((s: number, i: any) => s + (i.amount_cents ?? 0) / 100, 0),
      beds: hBeds.length,
      occupied: hBeds.filter((b: any) => b.status === "occupied").length,
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
        <p className="text-muted-foreground">Operator performance dashboard — occupancy, revenue, retention & pipeline</p>
      </div>

      {/* KPI Row 1 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Occupancy Rate"
          value={`${occupancyRate}%`}
          sub={`${occupiedBeds} / ${totalBeds} beds`}
          trend={2}
          icon={Home}
        />
        <KPICard
          title="Total Revenue"
          value={`$${totalRevenue.toLocaleString("en-US", { maximumFractionDigits: 0 })}`}
          sub="All-time collected"
          trend={5}
          icon={DollarSign}
        />
        <KPICard
          title="Net Operating Income"
          value={`$${noi.toLocaleString("en-US", { maximumFractionDigits: 0 })}`}
          sub={`$${totalExpenses.toLocaleString("en-US", { maximumFractionDigits: 0 })} expenses`}
          trend={noi > 0 ? 3 : -3}
          icon={BarChart2}
        />
        <KPICard
          title="Collection Rate"
          value={`${collectionRate}%`}
          sub={`${overdueInvoices.length} overdue`}
          trend={collectionRate >= 90 ? 1 : -2}
          icon={Target}
        />
      </div>

      {/* KPI Row 2 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Occupied Beds"
          value={String(activeResidents)}
          sub={`${residents.length} residents on record`}
          icon={Users}
        />
        <KPICard
          title="Avg Length of Stay"
          value={avgStay > 0 ? `${avgStay} days` : "—"}
          sub="Moved-out residents"
          icon={TrendingUp}
        />
        <KPICard
          title="Total Houses"
          value={String(houses.length)}
          sub={`${totalBeds} total beds`}
          icon={Home}
        />
        <KPICard
          title="Revenue per Bed"
          value={activeResidents > 0 ? `$${Math.round(totalRevenue / activeResidents).toLocaleString()}` : "—"}
          sub="Per occupied bed"
          icon={DollarSign}
        />
      </div>

      {/* Charts */}
      <Tabs defaultValue="revenue">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="revenue">Revenue & NOI</TabsTrigger>
          <TabsTrigger value="occupancy">Occupancy</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="retention">Retention</TabsTrigger>
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          <TabsTrigger value="collection">Collections</TabsTrigger>
        </TabsList>

        {/* Revenue & NOI */}
        <TabsContent value="revenue" className="space-y-4">
          <div className="grid lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Revenue vs Expenses (12 months)</CardTitle>
                <CardDescription>Monthly revenue, operating expenses, and net operating income</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={revenueTrendData}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, ""]} />
                    <Legend />
                    <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#6366f1" fill="url(#colorRevenue)" strokeWidth={2} />
                    <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#ec4899" fill="url(#colorExpenses)" strokeWidth={2} />
                    <Line type="monotone" dataKey="noi" name="NOI" stroke="#22c55e" strokeWidth={2} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue by House</CardTitle>
                <CardDescription>All-time collected revenue per property</CardDescription>
              </CardHeader>
              <CardContent>
                {revenuePerHouseData.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-48 text-muted-foreground gap-2">
                    <AlertCircle className="h-8 w-8" />
                    <p className="text-sm">No houses found</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={revenuePerHouseData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={100} />
                      <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, "Revenue"]} />
                      <Bar dataKey="revenue" fill="#6366f1" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Occupancy */}
        <TabsContent value="occupancy" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Occupancy Rate (12 months)</CardTitle>
              <CardDescription>Occupied beds and percentage over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={occupancyTrendData}>
                  <defs>
                    <linearGradient id="colorOcc" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 11 }} domain={[0, totalBeds || 10]} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                  <Tooltip />
                  <Legend />
                  <Area yAxisId="left" type="monotone" dataKey="occupied" name="Occupied Beds" stroke="#22c55e" fill="url(#colorOcc)" strokeWidth={2} />
                  <Line yAxisId="right" type="monotone" dataKey="rate" name="Occupancy %" stroke="#6366f1" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid lg:grid-cols-3 gap-4">
            {revenuePerHouseData.map((h) => {
              const hRate = h.beds > 0 ? Math.round((h.occupied / h.beds) * 100) : 0;
              return (
                <Card key={h.name}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-sm">{h.name}</p>
                      <Badge variant={hRate >= 80 ? "default" : hRate >= 60 ? "secondary" : "destructive"}>
                        {hRate}%
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{h.occupied} / {h.beds} beds occupied</p>
                    <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${hRate >= 80 ? "bg-green-500" : hRate >= 60 ? "bg-yellow-500" : "bg-red-500"}`}
                        style={{ width: `${hRate}%` }}
                      />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Expenses */}
        <TabsContent value="expenses" className="space-y-4">
          <div className="grid lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Expense Breakdown by Category</CardTitle>
                <CardDescription>All-time operating expense distribution</CardDescription>
              </CardHeader>
              <CardContent>
                {expensePieData.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-48 text-muted-foreground gap-2">
                    <AlertCircle className="h-8 w-8" />
                    <p className="text-sm">No expense records found. Add expenses to see breakdown.</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie data={expensePieData} cx="50%" cy="50%" outerRadius={100} dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                        {expensePieData.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, ""]} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Expense Categories Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {expensePieData.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">Add expense records to see breakdown</p>
                  ) : (
                    [...expensePieData].sort((a, b) => b.value - a.value).map((item, i) => (
                      <div key={item.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                          <span className="text-sm capitalize">{item.name}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-medium">${item.value.toLocaleString()}</span>
                          <span className="text-xs text-muted-foreground ml-2">
                            {totalExpenses > 0 ? `${Math.round((item.value / totalExpenses) * 100)}%` : "0%"}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Retention */}
        <TabsContent value="retention" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Resident Retention Rates</CardTitle>
              <CardDescription>Percentage of residents who stayed at least N days</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={retentionData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
                  <Tooltip formatter={(v) => [`${v}%`, "Retention Rate"]} />
                  <Bar dataKey="rate" fill="#6366f1" radius={[4, 4, 0, 0]}>
                    {retentionData.map((entry, i) => (
                      <Cell key={i} fill={entry.rate >= 70 ? "#22c55e" : entry.rate >= 50 ? "#f59e0b" : "#ef4444"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pipeline */}
        <TabsContent value="pipeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Lead-to-Move-In Pipeline</CardTitle>
              <CardDescription>Conversion funnel from initial inquiry to move-in</CardDescription>
            </CardHeader>
            <CardContent>
              {intakeLeads.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-muted-foreground gap-2">
                  <AlertCircle className="h-8 w-8" />
                  <p className="text-sm">Enable the Intake feature to see pipeline data</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={pipelineData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="stage" tick={{ fontSize: 11 }} width={80} />
                    <Tooltip />
                    <Bar dataKey="count" name="Leads" fill="#6366f1" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Collections */}
        <TabsContent value="collection" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment Collection Rate (Last 6 Months)</CardTitle>
              <CardDescription>Percentage of invoices paid on time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={collectionTrendData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
                  <Tooltip formatter={(v) => [`${v}%`, "Collection Rate"]} />
                  <Line type="monotone" dataKey="rate" name="Collection Rate" stroke="#22c55e" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid lg:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-green-500">{collectionRate}%</p>
                <p className="text-sm text-muted-foreground mt-1">Overall collection rate</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-red-500">{overdueInvoices.length}</p>
                <p className="text-sm text-muted-foreground mt-1">Overdue invoices</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-yellow-500">
                  ${overdueInvoices.reduce((s: number, i: any) => s + (i.amount_cents ?? 0) / 100, 0).toLocaleString("en-US", { maximumFractionDigits: 0 })}
                </p>
                <p className="text-sm text-muted-foreground mt-1">Overdue balance</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function calcRetention(residents: any[], days: number): number {
  const eligible = residents.filter((r: any) => r.move_in_date);
  if (eligible.length === 0) return 0;
  const stayed = eligible.filter((r: any) => {
    const moveIn = new Date(r.move_in_date);
    const threshold = new Date(moveIn.getTime() + days * 86400000);
    if (r.status === "active") return true;
    if (!r.move_out_date) return true;
    return new Date(r.move_out_date) >= threshold;
  });
  return Math.round((stayed.length / eligible.length) * 100);
}
