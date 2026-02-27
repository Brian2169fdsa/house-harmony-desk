import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";
import { BarChart2, Download, Printer } from "lucide-react";
import { toast } from "sonner";
import {
  format, parseISO, startOfMonth, endOfMonth,
  eachMonthOfInterval, isWithinInterval,
} from "date-fns";

const REPORT_TYPES = [
  { value: "pl_by_house",   label: "P&L by House",   icon: "🏠", desc: "Revenue, expenses, and NOI per property" },
  { value: "pl_by_month",   label: "P&L by Month",   icon: "📅", desc: "Month-over-month financial trend" },
  { value: "balance_sheet", label: "Balance Sheet",  icon: "⚖️", desc: "Assets, liabilities, and equity snapshot" },
  { value: "cash_flow",     label: "Cash Flow",      icon: "💰", desc: "Cash in vs. cash out over the period" },
  { value: "ar_aging",      label: "AR Aging",       icon: "📋", desc: "Outstanding invoices by age bucket" },
  { value: "schedule_e",    label: "Schedule E",     icon: "📄", desc: "Rental income and expense tax summary" },
];

const fmt = (n: number) =>
  `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function exportCSV(rows: Record<string, unknown>[], filename: string) {
  if (!rows.length) { toast.error("No data to export"); return; }
  const keys = Object.keys(rows[0]);
  const csv = [
    keys.join(","),
    ...rows.map((r) => keys.map((k) => `"${r[k] ?? ""}"`).join(",")),
  ].join("\n");
  const a = Object.assign(document.createElement("a"), {
    href: URL.createObjectURL(new Blob([csv], { type: "text/csv" })),
    download: filename,
  });
  a.click();
  URL.revokeObjectURL(a.href);
}

export default function QuickBooksReports() {
  const [reportType, setReportType] = useState("pl_by_house");
  const [houseFilter, setHouseFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState(
    format(new Date(Date.now() - 90 * 86_400_000), "yyyy-MM-dd")
  );
  const [dateTo, setDateTo]   = useState(format(new Date(), "yyyy-MM-dd"));
  const [generated, setGenerated] = useState(false);

  const { data: houses = [] } = useQuery({
    queryKey: ["houses"],
    queryFn: async () => {
      const { data } = await supabase.from("houses").select("id, name");
      return data ?? [];
    },
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ["qbr_invoices"],
    queryFn: async () => {
      const { data } = await supabase
        .from("invoices")
        .select("id, house_id, amount_cents, status, due_date, paid_date");
      return data ?? [];
    },
  });

  const { data: expenses = [] } = useQuery({
    queryKey: ["qbr_expenses"],
    queryFn: async () => {
      const { data } = await supabase
        .from("expense_records")
        .select("id, house_id, category, amount, date");
      return data ?? [];
    },
  });

  const fromDate = parseISO(dateFrom);
  const toDate   = parseISO(dateTo);

  const filteredInvoices = (invoices as any[]).filter((inv) => {
    const d = parseISO(inv.due_date || inv.paid_date || "2000-01-01");
    const hOk = houseFilter === "all" || inv.house_id === houseFilter;
    return hOk && isWithinInterval(d, { start: fromDate, end: toDate });
  });

  const filteredExpenses = (expenses as any[]).filter((exp) => {
    const d = parseISO(exp.date || "2000-01-01");
    const hOk = houseFilter === "all" || exp.house_id === houseFilter;
    return hOk && isWithinInterval(d, { start: fromDate, end: toDate });
  });

  // ── Report builders ──────────────────────────────────────────

  const buildPLByHouse = () =>
    (houses as any[])
      .filter((h) => houseFilter === "all" || h.id === houseFilter)
      .map((h) => {
        const revenue = filteredInvoices
          .filter((i) => i.house_id === h.id && i.status === "paid")
          .reduce((s: number, i) => s + i.amount_cents / 100, 0);
        const expense = filteredExpenses
          .filter((e) => e.house_id === h.id)
          .reduce((s: number, e) => s + Number(e.amount), 0);
        return {
          House: h.name,
          Revenue: fmt(revenue),
          Expenses: fmt(expense),
          NOI: fmt(revenue - expense),
          "Margin %": revenue ? `${((revenue - expense) / revenue * 100).toFixed(1)}%` : "—",
        };
      });

  const buildPLByMonth = () => {
    const months = eachMonthOfInterval({ start: fromDate, end: toDate });
    return months.map((m) => {
      const mS = startOfMonth(m), mE = endOfMonth(m);
      const revenue = filteredInvoices
        .filter((i) => {
          const d = parseISO(i.paid_date || i.due_date || "2000-01-01");
          return i.status === "paid" && d >= mS && d <= mE;
        })
        .reduce((s: number, i) => s + i.amount_cents / 100, 0);
      const expense = filteredExpenses
        .filter((e) => {
          const d = parseISO(e.date || "2000-01-01");
          return d >= mS && d <= mE;
        })
        .reduce((s: number, e) => s + Number(e.amount), 0);
      return {
        Month: format(m, "MMM yyyy"),
        Revenue: revenue,
        Expenses: expense,
        NOI: revenue - expense,
      };
    });
  };

  const buildARAging = () => {
    const now = new Date();
    return filteredInvoices
      .filter((i) => i.status !== "paid" && i.status !== "void")
      .map((i) => {
        const due  = parseISO(i.due_date || "2000-01-01");
        const days = Math.floor((now.getTime() - due.getTime()) / 86_400_000);
        const bucket =
          days <= 0   ? "Current"      :
          days <= 30  ? "1–30 days"    :
          days <= 60  ? "31–60 days"   :
          days <= 90  ? "61–90 days"   : "90+ days";
        const house = (houses as any[]).find((h) => h.id === i.house_id);
        return {
          House: house?.name || "Unknown",
          "Due Date": format(due, "MMM d, yyyy"),
          Amount: fmt(i.amount_cents / 100),
          Status: i.status,
          "Days Overdue": String(Math.max(0, days)),
          Bucket: bucket,
        };
      });
  };

  // Table-display rows (always Record<string,string>)
  const tableRows: Record<string, string>[] =
    !generated ? [] :
    reportType === "ar_aging"  ? buildARAging() :
    reportType === "pl_by_month" || reportType === "schedule_e" || reportType === "balance_sheet" || reportType === "cash_flow"
      ? buildPLByMonth().map((r) => ({ Month: r.Month, Revenue: fmt(r.Revenue), Expenses: fmt(r.Expenses), NOI: fmt(r.NOI) }))
      : buildPLByHouse();

  const chartData = generated && reportType === "pl_by_month" ? buildPLByMonth() : [];

  const selectedReport = REPORT_TYPES.find((r) => r.value === reportType);

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold">QuickBooks Reports</h1>
        <p className="text-muted-foreground">
          Generate financial reports from local data. Live QB API pull requires Edge Functions in production.
        </p>
      </div>

      {/* Builder */}
      <Card>
        <CardHeader><CardTitle>Report Builder</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <Label>Report Type</Label>
              <Select value={reportType} onValueChange={(v) => { setReportType(v); setGenerated(false); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {REPORT_TYPES.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.icon} {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Property</Label>
              <Select value={houseFilter} onValueChange={(v) => { setHouseFilter(v); setGenerated(false); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Properties</SelectItem>
                  {(houses as any[]).map((h) => (
                    <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>From</Label>
              <Input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setGenerated(false); }} />
            </div>
            <div className="space-y-1">
              <Label>To</Label>
              <Input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setGenerated(false); }} />
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button onClick={() => setGenerated(true)}>
              <BarChart2 className="h-4 w-4 mr-2" /> Generate Report
            </Button>
            {generated && (
              <>
                <Button variant="outline" onClick={() => window.print()}>
                  <Printer className="h-4 w-4 mr-2" /> Print / PDF
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    exportCSV(
                      tableRows,
                      `${reportType}_${dateFrom}_${dateTo}.csv`
                    )
                  }
                >
                  <Download className="h-4 w-4 mr-2" /> Export CSV
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Report Output */}
      {generated && (
        <Card className="print:shadow-none">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>
                  {selectedReport?.icon} {selectedReport?.label}
                </CardTitle>
                <CardDescription>
                  {dateFrom} to {dateTo}
                  {houseFilter !== "all"
                    ? ` · ${(houses as any[]).find((h) => h.id === houseFilter)?.name}`
                    : " · All Properties"}
                </CardDescription>
              </div>
              <Badge variant="outline">SoberOps Financial Report</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Chart for monthly view */}
            {chartData.length > 0 && (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="Month" tick={{ fontSize: 11 }} />
                    <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v: number) => fmt(v)} />
                    <Legend />
                    <Bar dataKey="Revenue"  fill="#22c55e" />
                    <Bar dataKey="Expenses" fill="#ef4444" />
                    <Bar dataKey="NOI"      fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Table */}
            {tableRows.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">
                No data for the selected filters and date range.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      {Object.keys(tableRows[0]).map((k) => (
                        <th key={k} className="text-left py-2 px-3 font-medium text-muted-foreground">
                          {k}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {tableRows.map((row, i) => (
                      <tr key={i} className={`border-b last:border-0 ${i % 2 === 0 ? "bg-muted/20" : ""}`}>
                        {Object.values(row).map((v, j) => (
                          <td key={j} className="py-2 px-3">{String(v ?? "—")}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
