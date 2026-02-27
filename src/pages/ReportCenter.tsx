import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useReportGenerator, type ReportType, type ReportData } from "@/hooks/useReportGenerator";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileBarChart,
  Download,
  Printer,
  Calendar,
  Building2,
  FileText,
  Shield,
  Heart,
  ClipboardList,
  Loader2,
  ChevronRight,
  Clock,
  BarChart3,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  LineChart,
  Line,
} from "recharts";

// ─── Report template definitions ─────────────────────────────────────────────

const REPORT_TEMPLATES: {
  type: ReportType;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  needsDateRange: boolean;
  needsHouseFilter: boolean;
}[] = [
  {
    type: "house_performance",
    title: "Monthly House Performance Report",
    description:
      "Complete overview of a property's financial performance, occupancy, maintenance, incidents, and resident compliance metrics.",
    icon: Building2,
    color: "text-blue-600 bg-blue-50",
    needsDateRange: true,
    needsHouseFilter: true,
  },
  {
    type: "investor",
    title: "Investor Quarterly Report",
    description:
      "Portfolio-level financial summary with per-property P&L, occupancy trends, NOI analysis, cap rate, and cash-on-cash returns.",
    icon: BarChart3,
    color: "text-emerald-600 bg-emerald-50",
    needsDateRange: true,
    needsHouseFilter: false,
  },
  {
    type: "compliance",
    title: "ADHS Compliance Package",
    description:
      "Regulatory-ready compliance bundle with facility info, staff roster, drug test records, incident logs, and safety inventory.",
    icon: Shield,
    color: "text-amber-600 bg-amber-50",
    needsDateRange: false,
    needsHouseFilter: true,
  },
  {
    type: "grant",
    title: "Grant Application Outcomes Report",
    description:
      "Program outcomes data including sobriety milestones, employment statistics, housing transitions, and aggregated compliance metrics.",
    icon: Heart,
    color: "text-pink-600 bg-pink-50",
    needsDateRange: true,
    needsHouseFilter: false,
  },
  {
    type: "weekly_ops",
    title: "Weekly Operations Summary",
    description:
      "Snapshot of the past 7 days: intakes, discharges, payments, maintenance tickets, incidents, and compliance alerts.",
    icon: ClipboardList,
    color: "text-purple-600 bg-purple-50",
    needsDateRange: false,
    needsHouseFilter: false,
  },
];

// ─── CSV export helper ───────────────────────────────────────────────────────

function flattenForCSV(obj: Record<string, unknown>, prefix = ""): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(obj)) {
    const flatKey = prefix ? `${prefix}.${key}` : key;
    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      Object.assign(result, flattenForCSV(value as Record<string, unknown>, flatKey));
    } else if (Array.isArray(value)) {
      result[flatKey] = JSON.stringify(value);
    } else {
      result[flatKey] = String(value ?? "");
    }
  }
  return result;
}

function exportCSV(data: ReportData) {
  let rows: Record<string, string>[] = [];
  const reportType = data.type;

  if (reportType === "investor" && "perPropertyPL" in data.data) {
    rows = data.data.perPropertyPL.map((p) => flattenForCSV(p as unknown as Record<string, unknown>));
  } else {
    rows = [flattenForCSV(data.data as unknown as Record<string, unknown>)];
  }

  if (rows.length === 0) return;

  const headers = Object.keys(rows[0]);
  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      headers.map((h) => `"${(row[h] ?? "").replace(/"/g, '""')}"`).join(",")
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${reportType}_report_${format(new Date(), "yyyy-MM-dd")}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

// ─── Report Renderers ────────────────────────────────────────────────────────

function RenderHousePerformance({ report }: { report: ReportData & { type: "house_performance" } }) {
  const d = report.data;
  return (
    <div className="space-y-6 print:space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">{d.houseName}</h2>
          <p className="text-sm text-muted-foreground">
            {d.dateRange.from} to {d.dateRange.to}
          </p>
        </div>
        <Badge variant="outline" className="text-lg px-3 py-1">
          {d.occupancyRate}% Occupancy
        </Badge>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Revenue</p>
            <p className="text-2xl font-bold text-green-600">
              ${d.revenue.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Expenses</p>
            <p className="text-2xl font-bold text-red-600">
              ${d.expenses.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">NOI</p>
            <p className={`text-2xl font-bold ${d.noi >= 0 ? "text-green-600" : "text-red-600"}`}>
              ${d.noi.toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Maintenance Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <tbody>
              <tr className="border-b">
                <td className="py-1.5 text-muted-foreground">Total Requests</td>
                <td className="py-1.5 text-right font-medium">{d.maintenanceSummary.total}</td>
              </tr>
              <tr className="border-b">
                <td className="py-1.5 text-muted-foreground">Open</td>
                <td className="py-1.5 text-right font-medium">{d.maintenanceSummary.open}</td>
              </tr>
              <tr className="border-b">
                <td className="py-1.5 text-muted-foreground">Completed</td>
                <td className="py-1.5 text-right font-medium">{d.maintenanceSummary.completed}</td>
              </tr>
              <tr>
                <td className="py-1.5 text-muted-foreground">Avg Resolution (days)</td>
                <td className="py-1.5 text-right font-medium">{d.maintenanceSummary.avgResolutionDays}</td>
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Incidents ({d.incidentSummary.total})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 text-sm">
              {Object.entries(d.incidentSummary.bySeverity).map(([sev, count]) => (
                <div key={sev} className="flex justify-between">
                  <span className="capitalize text-muted-foreground">{sev}</span>
                  <span className="font-medium">{count}</span>
                </div>
              ))}
              {d.incidentSummary.total === 0 && (
                <p className="text-muted-foreground">No incidents</p>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Resident Census</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <tbody>
                <tr className="border-b">
                  <td className="py-1 text-muted-foreground">Current</td>
                  <td className="py-1 text-right font-medium">{d.residentCensus.current}</td>
                </tr>
                <tr className="border-b">
                  <td className="py-1 text-muted-foreground">Moved In</td>
                  <td className="py-1 text-right font-medium text-green-600">+{d.residentCensus.movedIn}</td>
                </tr>
                <tr>
                  <td className="py-1 text-muted-foreground">Moved Out</td>
                  <td className="py-1 text-right font-medium text-red-600">-{d.residentCensus.movedOut}</td>
                </tr>
              </tbody>
            </table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Compliance</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <tbody>
                <tr className="border-b">
                  <td className="py-1 text-muted-foreground">Drug Tests</td>
                  <td className="py-1 text-right font-medium">{d.drugTestComplianceRate}%</td>
                </tr>
                <tr>
                  <td className="py-1 text-muted-foreground">Meetings</td>
                  <td className="py-1 text-right font-medium">{d.meetingComplianceRate}%</td>
                </tr>
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function RenderInvestorReport({ report }: { report: ReportData & { type: "investor" } }) {
  const d = report.data;
  const o = d.portfolioOverview;

  return (
    <div className="space-y-6 print:space-y-4">
      <h2 className="text-xl font-bold">Investor Portfolio Report</h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Properties</p>
            <p className="text-2xl font-bold">{o.totalProperties}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Occupancy</p>
            <p className="text-2xl font-bold">{o.overallOccupancy}%</p>
            <p className="text-xs text-muted-foreground">{o.occupiedBeds}/{o.totalBeds} beds</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Cap Rate</p>
            <p className="text-2xl font-bold">{d.capRate}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Cash-on-Cash</p>
            <p className="text-2xl font-bold">{d.cashOnCashReturn}%</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Total Revenue</p>
            <p className="text-xl font-bold text-green-600">${o.totalRevenue.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Total Expenses</p>
            <p className="text-xl font-bold text-red-600">${o.totalExpenses.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Net Operating Income</p>
            <p className={`text-xl font-bold ${o.totalNOI >= 0 ? "text-green-600" : "text-red-600"}`}>
              ${o.totalNOI.toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Per-Property P&L</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-2 font-medium">Property</th>
                  <th className="py-2 font-medium text-right">Revenue</th>
                  <th className="py-2 font-medium text-right">Expenses</th>
                  <th className="py-2 font-medium text-right">NOI</th>
                  <th className="py-2 font-medium text-right">Occupancy</th>
                </tr>
              </thead>
              <tbody>
                {d.perPropertyPL.map((p) => (
                  <tr key={p.houseId} className="border-b last:border-0">
                    <td className="py-2">{p.houseName}</td>
                    <td className="py-2 text-right text-green-600">${p.revenue.toLocaleString()}</td>
                    <td className="py-2 text-right text-red-600">${p.expenses.toLocaleString()}</td>
                    <td className={`py-2 text-right font-medium ${p.noi >= 0 ? "text-green-600" : "text-red-600"}`}>
                      ${p.noi.toLocaleString()}
                    </td>
                    <td className="py-2 text-right">{p.occupancyRate}%</td>
                  </tr>
                ))}
                {d.perPropertyPL.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-muted-foreground">
                      No property data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {d.noiTrend.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">NOI Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={d.noiTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, "NOI"]} />
                  <Line
                    type="monotone"
                    dataKey="noi"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Maintenance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Total Spend</p>
              <p className="font-medium">${d.maintenanceSummary.totalSpend.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Tickets</p>
              <p className="font-medium">{d.maintenanceSummary.ticketCount}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Avg Cost/Ticket</p>
              <p className="font-medium">${d.maintenanceSummary.avgCostPerTicket.toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function RenderCompliancePackage({ report }: { report: ReportData & { type: "compliance" } }) {
  const d = report.data;

  return (
    <div className="space-y-6 print:space-y-4">
      <h2 className="text-xl font-bold">ADHS Compliance Package</h2>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Facility Information</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <tbody>
              <tr className="border-b">
                <td className="py-1.5 text-muted-foreground w-40">Name</td>
                <td className="py-1.5 font-medium">{d.facilityInfo.name}</td>
              </tr>
              <tr className="border-b">
                <td className="py-1.5 text-muted-foreground">Address</td>
                <td className="py-1.5 font-medium">{d.facilityInfo.address}</td>
              </tr>
              <tr className="border-b">
                <td className="py-1.5 text-muted-foreground">Total Beds</td>
                <td className="py-1.5 font-medium">{d.facilityInfo.totalBeds ?? "N/A"}</td>
              </tr>
              <tr>
                <td className="py-1.5 text-muted-foreground">Active Residents</td>
                <td className="py-1.5 font-medium">{d.facilityInfo.activeResidents}</td>
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Staff Roster ({d.staffRoster.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-2 font-medium">Name</th>
                  <th className="py-2 font-medium">Role</th>
                  <th className="py-2 font-medium">Status</th>
                  <th className="py-2 font-medium">Hire Date</th>
                </tr>
              </thead>
              <tbody>
                {d.staffRoster.map((s, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="py-1.5">{s.name}</td>
                    <td className="py-1.5 capitalize">{s.role}</td>
                    <td className="py-1.5">
                      <Badge variant={s.status === "active" ? "default" : "secondary"}>
                        {s.status}
                      </Badge>
                    </td>
                    <td className="py-1.5">{s.hireDate ?? "N/A"}</td>
                  </tr>
                ))}
                {d.staffRoster.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-muted-foreground">
                      No staff records
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">House Rules Compliance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {d.houseRulesStatus.map((r, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span>{r.rule}</span>
                <Badge
                  variant={
                    r.status === "compliant"
                      ? "default"
                      : r.status === "pending"
                        ? "secondary"
                        : "destructive"
                  }
                >
                  {r.status.replace("_", " ")}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Drug Test Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <tbody>
                <tr className="border-b">
                  <td className="py-1 text-muted-foreground">Total Tests</td>
                  <td className="py-1 text-right font-medium">{d.drugTestSummary.totalTests}</td>
                </tr>
                <tr className="border-b">
                  <td className="py-1 text-muted-foreground">Passed</td>
                  <td className="py-1 text-right font-medium text-green-600">{d.drugTestSummary.passed}</td>
                </tr>
                <tr className="border-b">
                  <td className="py-1 text-muted-foreground">Failed</td>
                  <td className="py-1 text-right font-medium text-red-600">{d.drugTestSummary.failed}</td>
                </tr>
                <tr>
                  <td className="py-1 text-muted-foreground">Compliance Rate</td>
                  <td className="py-1 text-right font-bold">{d.drugTestSummary.complianceRate}%</td>
                </tr>
              </tbody>
            </table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Incident Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <tbody>
                <tr className="border-b">
                  <td className="py-1 text-muted-foreground">Total</td>
                  <td className="py-1 text-right font-medium">{d.incidentSummary.total}</td>
                </tr>
                <tr className="border-b">
                  <td className="py-1 text-muted-foreground">Resolved</td>
                  <td className="py-1 text-right font-medium text-green-600">{d.incidentSummary.resolved}</td>
                </tr>
                <tr>
                  <td className="py-1 text-muted-foreground">Open</td>
                  <td className="py-1 text-right font-medium text-amber-600">{d.incidentSummary.open}</td>
                </tr>
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>

      {d.safetyInventory.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Safety Inventory</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="py-2 font-medium">House</th>
                    <th className="py-2 font-medium">Supply</th>
                    <th className="py-2 font-medium text-right">Qty</th>
                    <th className="py-2 font-medium">Expires</th>
                  </tr>
                </thead>
                <tbody>
                  {d.safetyInventory.map((s, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="py-1.5">{s.houseName}</td>
                      <td className="py-1.5">{s.supplyType}</td>
                      <td className="py-1.5 text-right">{s.quantity}</td>
                      <td className="py-1.5">{s.expirationDate ?? "N/A"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {d.grievanceLog.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Grievance Log ({d.grievanceLog.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="py-2 font-medium">Date</th>
                    <th className="py-2 font-medium">Type</th>
                    <th className="py-2 font-medium">Description</th>
                    <th className="py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {d.grievanceLog.map((g) => (
                    <tr key={g.id} className="border-b last:border-0">
                      <td className="py-1.5 whitespace-nowrap">
                        {format(new Date(g.createdAt), "MM/dd/yyyy")}
                      </td>
                      <td className="py-1.5 capitalize">{g.type}</td>
                      <td className="py-1.5 max-w-xs truncate">{g.description}</td>
                      <td className="py-1.5">
                        <Badge variant={g.status === "resolved" ? "default" : "secondary"}>
                          {g.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function RenderGrantReport({ report }: { report: ReportData & { type: "grant" } }) {
  const d = report.data;
  const m = d.outcomes.sobrietyMilestones;

  const milestoneChart = [
    { name: "30 Days", value: m.thirtyDays },
    { name: "60 Days", value: m.sixtyDays },
    { name: "90 Days", value: m.ninetyDays },
    { name: "6 Months", value: m.sixMonths },
    { name: "1 Year", value: m.oneYear },
  ];

  return (
    <div className="space-y-6 print:space-y-4">
      <h2 className="text-xl font-bold">Grant Application Outcomes Report</h2>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Program Description</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{d.programDescription}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Demographics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Total Served</p>
              <p className="text-xl font-bold">{d.demographics.totalServed}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Current Residents</p>
              <p className="text-xl font-bold">{d.demographics.currentResidents}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Avg Length of Stay</p>
              <p className="text-xl font-bold">{d.outcomes.avgLengthOfStay} days</p>
            </div>
            <div>
              <p className="text-muted-foreground">Completion Rate</p>
              <p className="text-xl font-bold">{d.outcomes.completionRate}%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Sobriety Milestones Achieved</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={milestoneChart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-3xl font-bold text-green-600">{d.outcomes.employmentObtained}</p>
            <p className="text-sm text-muted-foreground">Employment Obtained</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-3xl font-bold text-blue-600">{d.outcomes.housingTransitions}</p>
            <p className="text-sm text-muted-foreground">Housing Transitions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-3xl font-bold text-purple-600">{d.aggregatedStats.passRate}%</p>
            <p className="text-sm text-muted-foreground">Drug Test Pass Rate</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Aggregated Program Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <tbody>
              <tr className="border-b">
                <td className="py-1.5 text-muted-foreground">Total Drug Tests Administered</td>
                <td className="py-1.5 text-right font-medium">{d.aggregatedStats.totalDrugTests}</td>
              </tr>
              <tr className="border-b">
                <td className="py-1.5 text-muted-foreground">Total Meetings Attended (verified)</td>
                <td className="py-1.5 text-right font-medium">{d.aggregatedStats.totalMeetingsAttended}</td>
              </tr>
              <tr className="border-b">
                <td className="py-1.5 text-muted-foreground">Avg Meetings per Resident</td>
                <td className="py-1.5 text-right font-medium">{d.aggregatedStats.avgMeetingsPerResident}</td>
              </tr>
              <tr>
                <td className="py-1.5 text-muted-foreground">Incident Rate (per 100 resident-days)</td>
                <td className="py-1.5 text-right font-medium">{d.aggregatedStats.incidentRate}</td>
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

function RenderWeeklyOps({ report }: { report: ReportData & { type: "weekly_ops" } }) {
  const d = report.data;

  return (
    <div className="space-y-6 print:space-y-4">
      <h2 className="text-xl font-bold">Weekly Operations Summary</h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-green-600">+{d.newIntakes}</p>
            <p className="text-sm text-muted-foreground">New Intakes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-red-600">-{d.discharges}</p>
            <p className="text-sm text-muted-foreground">Discharges</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-green-600">
              ${d.paymentsCollected.toLocaleString()}
            </p>
            <p className="text-sm text-muted-foreground">Collected</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-amber-600">
              ${d.paymentsOutstanding.toLocaleString()}
            </p>
            <p className="text-sm text-muted-foreground">Outstanding</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Occupancy Changes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Start: </span>
              <span className="font-medium">{d.occupancyChanges.startOccupancy}%</span>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <div>
              <span className="text-muted-foreground">End: </span>
              <span className="font-medium">{d.occupancyChanges.endOccupancy}%</span>
            </div>
            <Badge
              variant={d.occupancyChanges.netChange >= 0 ? "default" : "destructive"}
            >
              {d.occupancyChanges.netChange >= 0 ? "+" : ""}
              {d.occupancyChanges.netChange} net
            </Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              Incidents ({d.incidents.total})
              {d.incidents.critical > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {d.incidents.critical} critical
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {d.incidents.details.length > 0 ? (
              <div className="space-y-1 text-sm max-h-40 overflow-y-auto">
                {d.incidents.details.map((inc, i) => (
                  <div key={i} className="flex justify-between items-center py-1 border-b last:border-0">
                    <span className="capitalize">{inc.type}</span>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          inc.severity === "high" || inc.severity === "critical"
                            ? "destructive"
                            : "secondary"
                        }
                        className="text-xs"
                      >
                        {inc.severity}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(inc.date), "MM/dd")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No incidents this week</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Upcoming Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <tbody>
                <tr className="border-b">
                  <td className="py-1.5 text-muted-foreground">Open Maintenance</td>
                  <td className="py-1.5 text-right font-medium">{d.openMaintenanceTickets}</td>
                </tr>
                <tr className="border-b">
                  <td className="py-1.5 text-muted-foreground">Overdue Invoices</td>
                  <td className="py-1.5 text-right font-medium text-red-600">{d.upcomingTasks.overdueInvoices}</td>
                </tr>
                <tr className="border-b">
                  <td className="py-1.5 text-muted-foreground">Drug Tests Due (7d)</td>
                  <td className="py-1.5 text-right font-medium">{d.upcomingTasks.drugTestsDue}</td>
                </tr>
                <tr>
                  <td className="py-1.5 text-muted-foreground">High-Priority Maint.</td>
                  <td className="py-1.5 text-right font-medium text-amber-600">{d.upcomingTasks.maintenanceOverdue}</td>
                </tr>
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>

      {d.complianceAlerts.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Compliance Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1.5">
              {d.complianceAlerts.map((alert, i) => (
                <li key={i} className="flex items-center gap-2 text-sm">
                  <span className="h-2 w-2 rounded-full bg-amber-500 shrink-0" />
                  {alert}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ReportPreview({ data }: { data: ReportData }) {
  switch (data.type) {
    case "house_performance":
      return <RenderHousePerformance report={data as ReportData & { type: "house_performance" }} />;
    case "investor":
      return <RenderInvestorReport report={data as ReportData & { type: "investor" }} />;
    case "compliance":
      return <RenderCompliancePackage report={data as ReportData & { type: "compliance" }} />;
    case "grant":
      return <RenderGrantReport report={data as ReportData & { type: "grant" }} />;
    case "weekly_ops":
      return <RenderWeeklyOps report={data as ReportData & { type: "weekly_ops" }} />;
    default:
      return <p className="text-muted-foreground">Unknown report type</p>;
  }
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function ReportCenter() {
  const { generateReport, isGenerating, reportData, clearReport } =
    useReportGenerator();

  const [selectedType, setSelectedType] = useState<ReportType>("house_performance");
  const [dateFrom, setDateFrom] = useState(
    new Date(Date.now() - 30 * 86_400_000).toISOString().split("T")[0]
  );
  const [dateTo, setDateTo] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [selectedHouse, setSelectedHouse] = useState<string>("all");
  const [outputFormat, setOutputFormat] = useState<string>("view");

  const { data: houses = [] } = useQuery({
    queryKey: ["houses_for_report"],
    queryFn: async () => {
      const { data } = await supabase
        .from("houses")
        .select("id, name")
        .order("name");
      return (data ?? []) as { id: string; name: string }[];
    },
  });

  const { data: reportHistory = [] } = useQuery({
    queryKey: ["report_history"],
    queryFn: async () => {
      const { data } = await supabase
        .from("agent_actions_log")
        .select("*")
        .eq("agent_type", "report_generator")
        .order("created_at", { ascending: false })
        .limit(20);
      return (data ?? []) as any[];
    },
  });

  const selectedTemplate = REPORT_TEMPLATES.find((t) => t.type === selectedType);

  const handleGenerate = () => {
    const houseId = selectedHouse !== "all" ? selectedHouse : null;
    generateReport(selectedType, {
      houseId,
      dateFrom,
      dateTo,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <FileBarChart className="h-8 w-8" />
          Report Center
        </h1>
        <p className="text-muted-foreground">
          Generate, preview, and export operational and financial reports
        </p>
      </div>

      <Tabs defaultValue="templates" className="space-y-4">
        <TabsList>
          <TabsTrigger value="templates">Report Templates</TabsTrigger>
          <TabsTrigger value="builder">Report Builder</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        {/* ── Templates Tab ── */}
        <TabsContent value="templates" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {REPORT_TEMPLATES.map((tmpl) => {
              const Icon = tmpl.icon;
              return (
                <Card key={tmpl.type} className="flex flex-col">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-lg ${tmpl.color}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <CardTitle className="text-base leading-tight">
                        {tmpl.title}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col">
                    <CardDescription className="flex-1 mb-4">
                      {tmpl.description}
                    </CardDescription>
                    <div className="flex items-center gap-2 flex-wrap">
                      {tmpl.needsDateRange && (
                        <Badge variant="outline" className="text-xs">
                          <Calendar className="h-3 w-3 mr-1" />
                          Date Range
                        </Badge>
                      )}
                      {tmpl.needsHouseFilter && (
                        <Badge variant="outline" className="text-xs">
                          <Building2 className="h-3 w-3 mr-1" />
                          House Filter
                        </Badge>
                      )}
                    </div>
                    <Button
                      className="mt-4 w-full"
                      onClick={() => {
                        setSelectedType(tmpl.type);
                        clearReport();
                        const houseId = tmpl.needsHouseFilter && selectedHouse !== "all"
                          ? selectedHouse
                          : null;
                        generateReport(tmpl.type, {
                          houseId,
                          dateFrom,
                          dateTo,
                        });
                      }}
                      disabled={isGenerating}
                    >
                      {isGenerating ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <FileText className="mr-2 h-4 w-4" />
                      )}
                      Generate
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* ── Builder Tab ── */}
        <TabsContent value="builder" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Configure Report</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <Label>Report Type</Label>
                  <Select
                    value={selectedType}
                    onValueChange={(v) => setSelectedType(v as ReportType)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {REPORT_TEMPLATES.map((t) => (
                        <SelectItem key={t.type} value={t.type}>
                          {t.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedTemplate?.needsDateRange && (
                  <div className="space-y-2">
                    <Label>Date From</Label>
                    <Input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                    />
                  </div>
                )}

                {selectedTemplate?.needsDateRange && (
                  <div className="space-y-2">
                    <Label>Date To</Label>
                    <Input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                    />
                  </div>
                )}

                {selectedTemplate?.needsHouseFilter && (
                  <div className="space-y-2">
                    <Label>House</Label>
                    <Select
                      value={selectedHouse}
                      onValueChange={setSelectedHouse}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Properties</SelectItem>
                        {houses.map((h) => (
                          <SelectItem key={h.id} value={h.id}>
                            {h.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Output Format</Label>
                  <Select value={outputFormat} onValueChange={setOutputFormat}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="view">View in Browser</SelectItem>
                      <SelectItem value="pdf">PDF (Print)</SelectItem>
                      <SelectItem value="csv">CSV Export</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button onClick={handleGenerate} disabled={isGenerating}>
                  {isGenerating ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <FileBarChart className="mr-2 h-4 w-4" />
                  )}
                  Generate Report
                </Button>

                {reportData && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => window.print()}
                    >
                      <Printer className="mr-2 h-4 w-4" />
                      Print / PDF
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => exportCSV(reportData)}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Export CSV
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── History Tab ── */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Report History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {reportHistory.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No reports generated yet. Use the templates or builder to create your first report.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="py-2 font-medium">Report Type</th>
                        <th className="py-2 font-medium">Status</th>
                        <th className="py-2 font-medium">Duration</th>
                        <th className="py-2 font-medium">Generated</th>
                        <th className="py-2 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportHistory.map((log: any) => {
                        const inputData = (log.input_json ?? {}) as Record<string, unknown>;
                        return (
                          <tr key={log.id} className="border-b last:border-0">
                            <td className="py-2">
                              <span className="capitalize font-medium">
                                {(log.action_type as string).replace(/_/g, " ")}
                              </span>
                              {inputData.houseId && (
                                <span className="text-muted-foreground ml-1 text-xs">
                                  (filtered)
                                </span>
                              )}
                            </td>
                            <td className="py-2">
                              <Badge
                                variant={
                                  log.status === "completed"
                                    ? "default"
                                    : log.status === "failed"
                                      ? "destructive"
                                      : "secondary"
                                }
                              >
                                {log.status}
                              </Badge>
                            </td>
                            <td className="py-2 text-muted-foreground">
                              {log.duration_ms ? `${log.duration_ms}ms` : "N/A"}
                            </td>
                            <td className="py-2 text-muted-foreground">
                              {formatDistanceToNow(new Date(log.created_at), {
                                addSuffix: true,
                              })}
                            </td>
                            <td className="py-2 text-right">
                              {log.output_json && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    const actionTypeToReportType: Record<string, ReportType> = {
                                      house_performance_report: "house_performance",
                                      investor_report: "investor",
                                      compliance_package: "compliance",
                                      grant_report: "grant",
                                      weekly_ops: "weekly_ops",
                                    };
                                    const rt = actionTypeToReportType[log.action_type];
                                    if (!rt) return;
                                    const params = inputData as Record<string, any>;
                                    setSelectedType(rt);
                                    generateReport(rt, {
                                      houseId: params?.houseId ?? null,
                                      dateFrom: params?.dateFrom,
                                      dateTo: params?.dateTo,
                                    });
                                  }}
                                >
                                  <FileText className="h-3.5 w-3.5 mr-1" />
                                  Regenerate
                                </Button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── Report Output ── */}
      {(reportData || isGenerating) && (
        <Card className="print:shadow-none print:border-0" id="report-output">
          <CardHeader className="print:hidden">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Report Output
              </CardTitle>
              {reportData && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => window.print()}>
                    <Printer className="h-3.5 w-3.5 mr-1" />
                    Print
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => exportCSV(reportData)}
                  >
                    <Download className="h-3.5 w-3.5 mr-1" />
                    CSV
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isGenerating ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <p className="text-muted-foreground">Generating report...</p>
              </div>
            ) : reportData ? (
              <ReportPreview data={reportData} />
            ) : null}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
