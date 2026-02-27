import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { DollarSign, TrendingUp, Home, Download, Percent, Users, Wrench, Building2 } from "lucide-react";
import { format, subMonths, startOfMonth, parseISO } from "date-fns";

const fmt  = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 0 })}`;
const fmtPct = (n: number) => `${n.toFixed(1)}%`;

// ─── Portfolio KPI bar ───────────────────────────────────────
function PortfolioBar({ houses, beds, snapshots, openTickets }: {
  houses: any[]; beds: any[]; snapshots: any[]; openTickets: number;
}) {
  const totalBeds     = beds.length;
  const occupiedBeds  = beds.filter((b) => b.status === "occupied").length;
  const occupancy     = totalBeds > 0 ? (occupiedBeds / totalBeds) * 100 : 0;
  const latestSnap    = [...snapshots].sort((a, b) => b.month > a.month ? 1 : -1)[0];
  const revenue       = latestSnap ? Number(latestSnap.revenue) : 0;
  const noi           = latestSnap ? Number(latestSnap.noi ?? (latestSnap.revenue - latestSnap.expenses)) : 0;

  const metrics = [
    { label: "Properties",  value: houses.length.toString(),    icon: Building2 },
    { label: "Total Beds",  value: totalBeds.toString(),        icon: Home },
    { label: "Occupied",    value: occupiedBeds.toString(),     icon: Users },
    { label: "Occupancy",   value: fmtPct(occupancy),           icon: Percent, color: occupancy >= 90 ? "text-green-600" : occupancy >= 70 ? "text-yellow-600" : "text-red-600" },
    { label: "Mo. Revenue", value: fmt(revenue),                icon: DollarSign },
    { label: "Monthly NOI", value: fmt(noi),                    icon: TrendingUp, color: noi >= 0 ? "text-green-600" : "text-red-600" },
    { label: "Open Tickets",value: openTickets.toString(),      icon: Wrench },
  ];

  return (
    <div className="grid grid-cols-4 md:grid-cols-7 gap-3">
      {metrics.map(({ label, value, icon: Icon, color = "text-foreground" }) => (
        <Card key={label}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Icon className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{label}</span>
            </div>
            <p className={`text-xl font-bold ${color}`}>{value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── Property summary card ────────────────────────────────────
function PropertyCard({ house, beds, snapshots, selected, onSelect }: {
  house: any; beds: any[]; snapshots: any[]; selected: boolean; onSelect: () => void;
}) {
  const hBeds     = beds.filter((b) => b.room?.house_id === house.id || b.house_id === house.id);
  const total     = hBeds.length;
  const occupied  = hBeds.filter((b) => b.status === "occupied").length;
  const occ       = total > 0 ? (occupied / total) * 100 : 0;
  const hSnap     = snapshots.filter((s) => s.house_id === house.id).sort((a, b) => b.month > a.month ? 1 : -1)[0];
  const revenue   = hSnap ? Number(hSnap.revenue) : 0;
  const noi       = hSnap ? Number(hSnap.noi ?? (hSnap.revenue - hSnap.expenses)) : 0;
  const capRate   = revenue > 0 && noi > 0 ? (noi * 12 / (revenue * 12 / 0.08)) * 100 : 0; // simplified

  const borderColor = occ >= 90 ? "border-green-400" : occ >= 70 ? "border-yellow-400" : "border-red-400";

  return (
    <Card
      className={`border-2 cursor-pointer transition-all ${borderColor} ${selected ? "ring-2 ring-primary" : ""}`}
      onClick={onSelect}
    >
      <div className="h-28 bg-gradient-to-br from-slate-100 to-slate-200 rounded-t-lg flex items-center justify-center">
        <Building2 className="h-10 w-10 text-slate-400" />
      </div>
      <CardContent className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold">{house.name}</h3>
          <p className="text-xs text-muted-foreground">{house.address ?? "Address not set"}</p>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-muted-foreground text-xs">Occupancy</p>
            <p className={`font-semibold ${occ >= 90 ? "text-green-600" : occ >= 70 ? "text-yellow-600" : "text-red-600"}`}>
              {fmtPct(occ)} ({occupied}/{total})
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Monthly Revenue</p>
            <p className="font-semibold">{fmt(revenue)}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Monthly NOI</p>
            <p className={`font-semibold ${noi >= 0 ? "text-green-600" : "text-red-600"}`}>{fmt(noi)}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Cap Rate (est.)</p>
            <p className="font-semibold">{fmtPct(capRate)}</p>
          </div>
        </div>
        <Badge variant={occ >= 90 ? "default" : occ >= 70 ? "secondary" : "destructive"}>
          {occ >= 90 ? "Performing" : occ >= 70 ? "Moderate" : "Below Target"}
        </Badge>
      </CardContent>
    </Card>
  );
}

// ─── P&L summary table ───────────────────────────────────────
function PLTable({ snapshots, houses }: { snapshots: any[]; houses: any[] }) {
  const months = Array.from({ length: 3 }, (_, i) => {
    const d = subMonths(startOfMonth(new Date()), 2 - i);
    return { key: format(d, "yyyy-MM"), label: format(d, "MMM yyyy") };
  });

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="text-left py-2 pr-4 font-medium">Property</th>
            {months.map((m) => (
              <th key={m.key} className="text-right py-2 px-3 font-medium">{m.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {houses.map((h) => (
            <tr key={h.id} className="border-b hover:bg-muted/50">
              <td className="py-2 pr-4 font-medium">{h.name}</td>
              {months.map((m) => {
                const snap = snapshots.find((s) => s.house_id === h.id && s.month?.startsWith(m.key));
                const noi  = snap ? Number(snap.noi ?? (snap.revenue - snap.expenses)) : null;
                return (
                  <td key={m.key} className="text-right py-2 px-3">
                    {snap ? (
                      <div>
                        <p>{fmt(Number(snap.revenue))}</p>
                        <p className={`text-xs ${noi !== null && noi >= 0 ? "text-green-600" : "text-red-600"}`}>
                          NOI: {noi !== null ? fmt(noi) : "—"}
                        </p>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────
export default function InvestorPortal() {
  const [compareMode, setCompareMode] = useState(false);
  const [selectedHouses, setSelectedHouses] = useState<string[]>([]);
  const [filterHouse, setFilterHouse] = useState("all");

  const { data: houses = [] } = useQuery({
    queryKey: ["houses"],
    queryFn: async () => {
      const { data, error } = await supabase.from("houses").select("*");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: beds = [] } = useQuery({
    queryKey: ["beds_investor"],
    queryFn: async () => {
      const { data, error } = await supabase.from("beds").select("id, status, room_id, rooms(house_id)");
      if (error) throw error;
      return (data ?? []).map((b: any) => ({ ...b, house_id: b.rooms?.house_id }));
    },
  });

  const { data: snapshots = [] } = useQuery({
    queryKey: ["financial_snapshots_investor"],
    queryFn: async () => {
      const since = format(subMonths(startOfMonth(new Date()), 11), "yyyy-MM-dd");
      const { data, error } = await supabase
        .from("financial_snapshots")
        .select("*")
        .gte("month", since)
        .order("month");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: maintenanceOpen = [] } = useQuery({
    queryKey: ["maintenance_open"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("maintenance_requests")
        .select("id, house_id, status, created_at, title, priority")
        .in("status", ["open", "in_progress"]);
      if (error) throw error;
      return data ?? [];
    },
  });

  // Revenue trend
  const months12 = Array.from({ length: 12 }, (_, i) => {
    const d = subMonths(startOfMonth(new Date()), 11 - i);
    return { key: format(d, "yyyy-MM"), label: format(d, "MMM yy") };
  });

  const revenueTrend = months12.map(({ key, label }) => {
    const monthSnaps = snapshots.filter((s: any) => s.month?.startsWith(key));
    return {
      month: label,
      revenue:  monthSnaps.reduce((s: number, r: any) => s + Number(r.revenue), 0),
      expenses: monthSnaps.reduce((s: number, r: any) => s + Number(r.expenses), 0),
      noi:      monthSnaps.reduce((s: number, r: any) => s + Number(r.noi ?? (r.revenue - r.expenses)), 0),
    };
  });

  const handleToggleHouse = (id: string) => {
    setSelectedHouses((prev) =>
      prev.includes(id) ? prev.filter((h) => h !== id) : prev.length < 3 ? [...prev, id] : prev
    );
  };

  const handleDownload = () => {
    const rows = [
      ["Property", "Month", "Revenue", "Expenses", "NOI", "Occupancy %"],
      ...snapshots.map((s: any) => {
        const house = houses.find((h: any) => h.id === s.house_id);
        return [
          house?.name ?? s.house_id,
          s.month,
          s.revenue,
          s.expenses,
          s.noi ?? (Number(s.revenue) - Number(s.expenses)),
          s.occupancy_rate ?? "",
        ];
      }),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `portfolio-report-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Investor Portal</h1>
          <p className="text-muted-foreground">Portfolio performance at a glance — read-only view</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setCompareMode(!compareMode)}>
            {compareMode ? "Exit Compare" : "Compare Houses"}
          </Button>
          <Button onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />Download Report
          </Button>
        </div>
      </div>

      {/* Portfolio KPI bar */}
      <PortfolioBar houses={houses} beds={beds} snapshots={snapshots} openTickets={maintenanceOpen.length} />

      {/* Property cards */}
      <div>
        <h2 className="text-lg font-semibold mb-3">
          {compareMode ? "Select up to 3 properties to compare" : "Properties"}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {houses.map((h: any) => (
            <PropertyCard
              key={h.id}
              house={h}
              beds={beds.filter((b: any) => b.house_id === h.id)}
              snapshots={snapshots}
              selected={selectedHouses.includes(h.id)}
              onSelect={() => compareMode && handleToggleHouse(h.id)}
            />
          ))}
        </div>
      </div>

      {/* Side-by-side comparison table */}
      {compareMode && selectedHouses.length > 1 && (
        <Card>
          <CardHeader><CardTitle>House Comparison</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 pr-4">Metric</th>
                    {selectedHouses.map((id) => {
                      const h = houses.find((h: any) => h.id === id);
                      return <th key={id} className="text-center py-2 px-4">{h?.name ?? id}</th>;
                    })}
                  </tr>
                </thead>
                <tbody>
                  {["Beds", "Occupancy", "Last Mo. Revenue", "Last Mo. NOI", "Open Tickets"].map((metric) => (
                    <tr key={metric} className="border-b">
                      <td className="py-2 pr-4 text-muted-foreground">{metric}</td>
                      {selectedHouses.map((id) => {
                        const hBeds   = beds.filter((b: any) => b.house_id === id);
                        const snap    = snapshots.filter((s: any) => s.house_id === id).slice(-1)[0];
                        const occ     = hBeds.length > 0 ? (hBeds.filter((b: any) => b.status === "occupied").length / hBeds.length) * 100 : 0;
                        const tickets = maintenanceOpen.filter((t: any) => t.house_id === id).length;
                        let val = "—";
                        if (metric === "Beds") val = hBeds.length.toString();
                        if (metric === "Occupancy") val = fmtPct(occ);
                        if (metric === "Last Mo. Revenue") val = snap ? fmt(Number(snap.revenue)) : "—";
                        if (metric === "Last Mo. NOI") val = snap ? fmt(Number(snap.noi ?? (snap.revenue - snap.expenses))) : "—";
                        if (metric === "Open Tickets") val = tickets.toString();
                        return <td key={id} className="text-center py-2 px-4 font-medium">{val}</td>;
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* P&L Summary */}
      <Card>
        <CardHeader>
          <CardTitle>P&amp;L Summary — Last 3 Months</CardTitle>
          <CardDescription>Revenue and NOI by property and month</CardDescription>
        </CardHeader>
        <CardContent>
          {snapshots.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No financial snapshots yet. Run monthly snapshots to populate this table.</p>
          ) : (
            <PLTable snapshots={snapshots} houses={houses} />
          )}
        </CardContent>
      </Card>

      {/* Revenue & NOI trend chart */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Revenue Trend — 12 Months</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={revenueTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: any) => fmt(Number(v))} />
                <Area type="monotone" dataKey="revenue" stroke="#6366f1" fill="#e0e7ff" name="Revenue" />
                <Area type="monotone" dataKey="noi" stroke="#22c55e" fill="#dcfce7" name="NOI" />
                <Legend />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Occupancy Trend — 12 Months</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={months12.map(({ key, label }) => {
                const snap = snapshots.filter((s: any) => s.month?.startsWith(key));
                const totalB = snap.reduce((s: number, r: any) => s + (r.total_beds ?? 0), 0);
                const occB   = snap.reduce((s: number, r: any) => s + (r.occupied_beds ?? 0), 0);
                return {
                  month: label,
                  occupancy: totalB > 0 ? Math.round((occB / totalB) * 100) : null,
                };
              })}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                <Tooltip formatter={(v: any) => `${v}%`} />
                <Line type="monotone" dataKey="occupancy" stroke="#6366f1" strokeWidth={2} connectNulls name="Occupancy %" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Open maintenance */}
      <Card>
        <CardHeader>
          <CardTitle>Open Maintenance Tickets</CardTitle>
          <CardDescription>Property care history — {maintenanceOpen.length} tickets currently open</CardDescription>
        </CardHeader>
        <CardContent>
          {maintenanceOpen.length === 0 ? (
            <p className="text-sm text-muted-foreground">No open maintenance tickets.</p>
          ) : (
            <div className="divide-y max-h-64 overflow-y-auto">
              {maintenanceOpen.slice(0, 20).map((t: any) => (
                <div key={t.id} className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-medium">{t.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {houses.find((h: any) => h.id === t.house_id)?.name ?? "Unknown"} · {format(parseISO(t.created_at), "MMM d, yyyy")}
                    </p>
                  </div>
                  <Badge variant={t.priority === "emergency" ? "destructive" : t.priority === "high" ? "secondary" : "outline"}>
                    {t.priority}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
