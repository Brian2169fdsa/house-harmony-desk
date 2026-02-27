import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { DollarSign, TrendingUp, Home, Download, BarChart2, Percent, AlertCircle } from "lucide-react";
import { format, subMonths, startOfMonth } from "date-fns";
import { toast } from "sonner";

const fmt = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
const fmtPct = (n: number) => `${n.toFixed(1)}%`;

function MetricCard({ title, value, sub, icon: Icon, color = "text-primary" }: {
  title: string; value: string; sub?: string; icon: React.ElementType; color?: string;
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

export default function InvestorPortal() {
  const months = getLast12Months();
  const [selectedHouseId, setSelectedHouseId] = useState<string>("all");

  // Houses
  const { data: houses = [] } = useQuery({
    queryKey: ["investor_houses"],
    queryFn: async () => {
      const { data, error } = await supabase.from("houses").select("id, name, address");
      if (error) throw error;
      return data ?? [];
    },
  });

  // Beds (for occupancy — status on beds table is source of truth)
  const { data: beds = [] } = useQuery({
    queryKey: ["investor_beds"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("beds")
        .select("id, status, rooms(id, house_id)");
      if (error) throw error;
      return data ?? [];
    },
  });

  // Invoices (financial data — amount_cents, status, house_id)
  const { data: invoices = [] } = useQuery({
    queryKey: ["investor_invoices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select("id, amount_cents, status, due_date, paid_date, house_id, resident_id");
      if (error) throw error;
      return data ?? [];
    },
  });

  // Expense records
  const { data: expenses = [] } = useQuery({
    queryKey: ["investor_expenses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expense_records")
        .select("id, house_id, category, amount, date");
      if (error) throw error;
      return data ?? [];
    },
  });

  // Financial snapshots
  const { data: snapshots = [] } = useQuery({
    queryKey: ["investor_snapshots"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("financial_snapshots")
        .select("*")
        .order("month", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  // ── Filter helpers ────────────────────────────────────────────────────────
  const filteredBeds = selectedHouseId === "all"
    ? beds
    : beds.filter((b: any) => (b.rooms as any)?.house_id === selectedHouseId);

  const filteredInvoices = selectedHouseId === "all"
    ? invoices
    : invoices.filter((i: any) => i.house_id === selectedHouseId);

  const filteredExpenses = selectedHouseId === "all"
    ? expenses
    : expenses.filter((e: any) => e.house_id === selectedHouseId);

  // ── KPI calculations ──────────────────────────────────────────────────────
  const totalBeds = filteredBeds.length;
  const occupiedBeds = filteredBeds.filter((b: any) => b.status === "occupied").length;
  const occupancyRate = totalBeds > 0 ? (occupiedBeds / totalBeds) * 100 : 0;

  const paidInvoices = filteredInvoices.filter((i: any) => i.status === "paid");
  const totalRevenue = paidInvoices.reduce((s: number, i: any) => s + (i.amount_cents ?? 0) / 100, 0);
  const totalExpenses = filteredExpenses.reduce((s: number, e: any) => s + Number(e.amount ?? 0), 0);
  const noi = totalRevenue - totalExpenses;
  const noiMargin = totalRevenue > 0 ? (noi / totalRevenue) * 100 : 0;

  // Cap rate: annual NOI / property value ($200k per house as placeholder)
  const filteredHouses = selectedHouseId === "all" ? houses : houses.filter((h: any) => h.id === selectedHouseId);
  const estimatedPropertyValue = filteredHouses.length * 200000;
  const capRate = estimatedPropertyValue > 0 ? (noi / estimatedPropertyValue) * 100 : 0;
  const estimatedEquity = estimatedPropertyValue * 0.2;
  const cashOnCash = estimatedEquity > 0 ? (noi / estimatedEquity) * 100 : 0;

  // ── P&L trend data (12 months) ────────────────────────────────────────────
  const plTrendData = months.map(({ label, date }) => {
    const snap = snapshots.find((s: any) => {
      if (selectedHouseId !== "all" && s.house_id !== selectedHouseId) return false;
      const d = new Date(s.month);
      return d.getFullYear() === date.getFullYear() && d.getMonth() === date.getMonth();
    });
    if (snap) {
      return {
        month: label,
        revenue: Number(snap.revenue),
        expenses: Number(snap.expenses),
        noi: Number(snap.noi),
        occupancy: Number(snap.occupancy_rate ?? 0),
      };
    }
    const monthPaid = filteredInvoices.filter((i: any) => {
      const d = i.paid_date ? new Date(i.paid_date) : null;
      return i.status === "paid" && d && d.getFullYear() === date.getFullYear() && d.getMonth() === date.getMonth();
    });
    const monthExp = filteredExpenses.filter((e: any) => {
      const d = e.date ? new Date(e.date) : null;
      return d && d.getFullYear() === date.getFullYear() && d.getMonth() === date.getMonth();
    });
    const rev = monthPaid.reduce((s: number, i: any) => s + (i.amount_cents ?? 0) / 100, 0);
    const exp = monthExp.reduce((s: number, e: any) => s + Number(e.amount ?? 0), 0);
    return { month: label, revenue: rev, expenses: exp, noi: rev - exp, occupancy: Math.round(occupancyRate) };
  });

  // ── House-level P&L ───────────────────────────────────────────────────────
  const housePnL = houses.map((h: any) => {
    const hBeds = beds.filter((b: any) => (b.rooms as any)?.house_id === h.id);
    const hInvoices = invoices.filter((i: any) => i.house_id === h.id && i.status === "paid");
    const hExp = expenses.filter((e: any) => e.house_id === h.id);
    const hRev = hInvoices.reduce((s: number, i: any) => s + (i.amount_cents ?? 0) / 100, 0);
    const hExpTotal = hExp.reduce((s: number, e: any) => s + Number(e.amount ?? 0), 0);
    const hNoi = hRev - hExpTotal;
    const hOccupied = hBeds.filter((b: any) => b.status === "occupied").length;
    const hOcc = hBeds.length > 0 ? Math.round((hOccupied / hBeds.length) * 100) : 0;
    const hCapRate = 200000 > 0 ? (hNoi / 200000) * 100 : 0;
    return { ...h, revenue: hRev, expenses: hExpTotal, noi: hNoi, occupancy: hOcc, capRate: hCapRate, occupiedBeds: hOccupied, totalBeds: hBeds.length };
  });

  const handleDownloadReport = () => {
    toast.info("PDF generation requires a library like jsPDF. In production this triggers a server-side PDF render.");
    window.print();
  };

  const allCollectionRate = invoices.length > 0
    ? Math.round((invoices.filter((i: any) => i.status === "paid").length / invoices.length) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Investor Portal</h1>
          <p className="text-muted-foreground">Property P&L, NOI tracking, cap rates & investment returns</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={selectedHouseId} onValueChange={setSelectedHouseId}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="All Properties" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Properties</SelectItem>
              {houses.map((h: any) => (
                <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleDownloadReport}>
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Total Revenue" value={fmt(totalRevenue)} sub="All collected" icon={DollarSign} color="text-green-600" />
        <MetricCard title="Net Operating Income" value={fmt(noi)} sub={`${fmtPct(noiMargin)} NOI margin`} icon={TrendingUp} color={noi >= 0 ? "text-green-600" : "text-red-600"} />
        <MetricCard title="Cap Rate" value={fmtPct(capRate)} sub="NOI / est. property value" icon={Percent} />
        <MetricCard title="Cash-on-Cash Return" value={fmtPct(cashOnCash)} sub="NOI / est. equity (20% down)" icon={BarChart2} />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Occupancy Rate" value={fmtPct(occupancyRate)} sub={`${occupiedBeds} / ${totalBeds} beds`} icon={Home} />
        <MetricCard title="Total Expenses" value={fmt(totalExpenses)} sub="Operating costs" icon={DollarSign} color="text-red-600" />
        <MetricCard title="Properties" value={String(filteredHouses.length)} sub={`${totalBeds} total beds`} icon={Home} />
        <MetricCard title="Revenue per Bed" value={occupiedBeds > 0 ? fmt(Math.round(totalRevenue / occupiedBeds)) : "—"} sub="Per occupied bed" icon={DollarSign} />
      </div>

      <Tabs defaultValue="pl">
        <TabsList>
          <TabsTrigger value="pl">P&L Summary</TabsTrigger>
          <TabsTrigger value="noi">NOI Trend</TabsTrigger>
          <TabsTrigger value="properties">By Property</TabsTrigger>
          <TabsTrigger value="benchmarks">Benchmarks</TabsTrigger>
        </TabsList>

        {/* P&L Summary */}
        <TabsContent value="pl" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Revenue & Expense Trend (12 months)</CardTitle>
              <CardDescription>Monthly P&L for {selectedHouseId === "all" ? "all properties" : houses.find((h: any) => h.id === selectedHouseId)?.name}</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={plTrendData}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, ""]} />
                  <Legend />
                  <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#22c55e" fill="url(#colorRev)" strokeWidth={2} />
                  <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#ef4444" fill="url(#colorExp)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>P&L Summary Table</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 font-medium text-muted-foreground">Month</th>
                      <th className="text-right py-2 font-medium text-muted-foreground">Revenue</th>
                      <th className="text-right py-2 font-medium text-muted-foreground">Expenses</th>
                      <th className="text-right py-2 font-medium text-muted-foreground">NOI</th>
                      <th className="text-right py-2 font-medium text-muted-foreground">Occupancy</th>
                    </tr>
                  </thead>
                  <tbody>
                    {plTrendData.map((row) => (
                      <tr key={row.month} className="border-b last:border-0 hover:bg-muted/50">
                        <td className="py-2">{row.month}</td>
                        <td className="py-2 text-right text-green-600">{fmt(row.revenue)}</td>
                        <td className="py-2 text-right text-red-600">{fmt(row.expenses)}</td>
                        <td className={`py-2 text-right font-medium ${row.noi >= 0 ? "text-green-600" : "text-red-600"}`}>{fmt(row.noi)}</td>
                        <td className="py-2 text-right">{row.occupancy}%</td>
                      </tr>
                    ))}
                    <tr className="bg-muted/50 font-semibold">
                      <td className="py-2">Total</td>
                      <td className="py-2 text-right text-green-600">{fmt(plTrendData.reduce((s, r) => s + r.revenue, 0))}</td>
                      <td className="py-2 text-right text-red-600">{fmt(plTrendData.reduce((s, r) => s + r.expenses, 0))}</td>
                      <td className={`py-2 text-right ${noi >= 0 ? "text-green-600" : "text-red-600"}`}>{fmt(noi)}</td>
                      <td className="py-2 text-right">{fmtPct(occupancyRate)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* NOI Trend */}
        <TabsContent value="noi" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>NOI & Occupancy Trend</CardTitle>
              <CardDescription>Net Operating Income month-over-month with occupancy overlay</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={plTrendData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
                  <Tooltip />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="noi" name="NOI ($)" stroke="#6366f1" strokeWidth={2} dot={{ r: 4 }} />
                  <Line yAxisId="right" type="monotone" dataKey="occupancy" name="Occupancy (%)" stroke="#22c55e" strokeWidth={2} dot={false} strokeDasharray="5 5" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* By Property */}
        <TabsContent value="properties" className="space-y-4">
          {housePnL.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                <p>No properties found.</p>
              </CardContent>
            </Card>
          ) : (
            housePnL.map((h: any) => (
              <Card key={h.id}>
                <CardContent className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{h.name}</h3>
                        <Badge variant={h.occupancy >= 80 ? "default" : h.occupancy >= 60 ? "secondary" : "destructive"}>
                          {h.occupancy}% occupied
                        </Badge>
                      </div>
                      {h.address && <p className="text-xs text-muted-foreground">{h.address}</p>}
                      <p className="text-xs text-muted-foreground mt-0.5">{h.occupiedBeds} / {h.totalBeds} beds occupied</p>
                    </div>
                    <div className="grid grid-cols-4 gap-4 text-center">
                      <div><p className="text-xs text-muted-foreground">Revenue</p><p className="font-semibold text-green-600">{fmt(h.revenue)}</p></div>
                      <div><p className="text-xs text-muted-foreground">Expenses</p><p className="font-semibold text-red-600">{fmt(h.expenses)}</p></div>
                      <div><p className="text-xs text-muted-foreground">NOI</p><p className={`font-semibold ${h.noi >= 0 ? "text-green-600" : "text-red-600"}`}>{fmt(h.noi)}</p></div>
                      <div><p className="text-xs text-muted-foreground">Cap Rate</p><p className="font-semibold text-primary">{fmtPct(h.capRate)}</p></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}

          <Card>
            <CardHeader><CardTitle>Portfolio Revenue Comparison</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={housePnL}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, ""]} />
                  <Legend />
                  <Bar dataKey="revenue" name="Revenue" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" name="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="noi" name="NOI" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Benchmarks */}
        <TabsContent value="benchmarks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Portfolio vs Industry Benchmarks</CardTitle>
              <CardDescription>How your portfolio compares to typical sober living operations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { label: "Occupancy Rate", yours: occupancyRate, benchmark: 85, unit: "%" },
                  { label: "NOI Margin", yours: noiMargin, benchmark: 40, unit: "%" },
                  { label: "Cap Rate", yours: capRate, benchmark: 8, unit: "%" },
                  { label: "Collection Rate", yours: allCollectionRate, benchmark: 95, unit: "%" },
                ].map(({ label, yours, benchmark, unit }) => (
                  <div key={label} className="space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{label}</span>
                      <div className="flex gap-4 text-xs text-muted-foreground">
                        <span className={yours >= benchmark ? "text-green-600" : "text-amber-600"}>
                          You: {yours.toFixed(1)}{unit}
                        </span>
                        <span>Target: {benchmark}{unit}</span>
                      </div>
                    </div>
                    <div className="relative h-3 bg-muted rounded-full overflow-hidden">
                      <div className="absolute h-full bg-primary/20 rounded-full" style={{ width: `${Math.min(benchmark, 100)}%` }} />
                      <div
                        className={`absolute h-full rounded-full transition-all ${yours >= benchmark ? "bg-green-500" : "bg-amber-500"}`}
                        style={{ width: `${Math.min(yours, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle>Investment Return Summary</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {[
                  { label: "Gross Revenue", value: fmt(totalRevenue) },
                  { label: "Operating Expenses", value: `(${fmt(totalExpenses)})` },
                  { label: "Net Operating Income", value: fmt(noi), bold: true },
                  { label: "Est. Property Value", value: fmt(estimatedPropertyValue) },
                  { label: "Cap Rate", value: fmtPct(capRate) },
                  { label: "Est. Equity (20% down)", value: fmt(estimatedEquity) },
                  { label: "Cash-on-Cash Return", value: fmtPct(cashOnCash), bold: true },
                ].map(({ label, value, bold }) => (
                  <div key={label} className={`flex justify-between text-sm ${bold ? "font-semibold border-t pt-2" : ""}`}>
                    <span className={bold ? "" : "text-muted-foreground"}>{label}</span>
                    <span className={value.startsWith("(") ? "text-red-600" : ""}>{value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Key Notes</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>• Cap rate uses an estimated property value of $200,000 per house. Replace with actual appraisal values for accuracy.</p>
                <p>• Revenue reflects invoices marked "paid" in SoberOps.</p>
                <p>• Expense records must be entered in the Analytics → Expenses section.</p>
                <p>• Connect QuickBooks in Settings for real-time P&L pulled from your accounting system.</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
