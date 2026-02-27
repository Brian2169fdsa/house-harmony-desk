import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";
import { Building2, Home, Users, DollarSign, Wrench, TrendingUp, BarChart3 } from "lucide-react";
import { format, subMonths, startOfMonth } from "date-fns";

const fmt    = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 0 })}`;
const fmtPct = (n: number) => `${n.toFixed(1)}%`;

function OccupancyGauge({ rate }: { rate: number }) {
  const color = rate >= 90 ? "text-green-600" : rate >= 70 ? "text-yellow-600" : "text-red-600";
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">Occupancy</span>
        <span className={`font-semibold ${color}`}>{fmtPct(rate)}</span>
      </div>
      <Progress
        value={rate}
        className={`h-2 ${rate >= 90 ? "[&>div]:bg-green-500" : rate >= 70 ? "[&>div]:bg-yellow-500" : "[&>div]:bg-red-500"}`}
      />
    </div>
  );
}

export default function PortfolioView() {
  const navigate = useNavigate();
  const [compareMode, setCompareMode] = useState(false);
  const [selected, setSelected]       = useState<string[]>([]);

  const { data: houses = [] } = useQuery({
    queryKey: ["houses"],
    queryFn: async () => {
      const { data, error } = await supabase.from("houses").select("*");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: beds = [] } = useQuery({
    queryKey: ["beds_portfolio"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("beds")
        .select("id, status, room_id, rooms(house_id)");
      if (error) throw error;
      return (data ?? []).map((b: any) => ({ ...b, house_id: b.rooms?.house_id }));
    },
  });

  const { data: snapshots = [] } = useQuery({
    queryKey: ["financial_snapshots_portfolio"],
    queryFn: async () => {
      const since = format(subMonths(startOfMonth(new Date()), 0), "yyyy-MM-dd");
      const { data, error } = await supabase
        .from("financial_snapshots")
        .select("house_id, revenue, expenses, noi, occupancy_rate, month")
        .gte("month", format(subMonths(startOfMonth(new Date()), 1), "yyyy-MM-dd"))
        .order("month", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: maintenanceOpen = [] } = useQuery({
    queryKey: ["maintenance_open_portfolio"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("maintenance_requests")
        .select("id, house_id, priority, status")
        .in("status", ["open", "in_progress"]);
      if (error) throw error;
      return data ?? [];
    },
  });

  // Per-house metrics
  const houseMetrics = houses.map((h: any) => {
    const hBeds    = beds.filter((b: any) => b.house_id === h.id);
    const total    = hBeds.length;
    const occupied = hBeds.filter((b: any) => b.status === "occupied").length;
    const occ      = total > 0 ? (occupied / total) * 100 : 0;
    const snap     = snapshots.find((s: any) => s.house_id === h.id);
    const revenue  = snap ? Number(snap.revenue) : 0;
    const expenses = snap ? Number(snap.expenses) : 0;
    const noi      = snap ? Number(snap.noi ?? (revenue - expenses)) : 0;
    const revPerBed = total > 0 ? revenue / total : 0;
    const expenseRatio = revenue > 0 ? (expenses / revenue) * 100 : 0;
    const tickets  = maintenanceOpen.filter((t: any) => t.house_id === h.id).length;
    return { ...h, total, occupied, occ, revenue, expenses, noi, revPerBed, expenseRatio, tickets };
  });

  // Portfolio totals
  const totalBeds     = beds.length;
  const occupiedBeds  = beds.filter((b: any) => b.status === "occupied").length;
  const portfolioOcc  = totalBeds > 0 ? (occupiedBeds / totalBeds) * 100 : 0;
  const totalRevenue  = houseMetrics.reduce((s, h) => s + h.revenue, 0);
  const totalExpenses = houseMetrics.reduce((s, h) => s + h.expenses, 0);
  const totalNOI      = houseMetrics.reduce((s, h) => s + h.noi, 0);
  const totalTickets  = maintenanceOpen.length;
  const avgRevPerBed  = totalBeds > 0 ? totalRevenue / totalBeds : 0;
  const portfolioExpRatio = totalRevenue > 0 ? (totalExpenses / totalRevenue) * 100 : 0;

  const toggleSelect = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < 3 ? [...prev, id] : prev
    );
  };

  const selectedMetrics = houseMetrics.filter((h) => selected.includes(h.id));

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Portfolio Overview</h1>
          <p className="text-muted-foreground">All properties at a glance — click a card to drill down</p>
        </div>
        <Button variant="outline" onClick={() => { setCompareMode(!compareMode); setSelected([]); }}>
          {compareMode ? "Exit Compare" : "Compare Houses"}
        </Button>
      </div>

      {/* Portfolio KPI bar */}
      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-3">
        {[
          { label: "Properties",   value: houses.length.toString(),          icon: Building2 },
          { label: "Total Beds",   value: totalBeds.toString(),              icon: Home },
          { label: "Occupancy",    value: fmtPct(portfolioOcc),             icon: BarChart3,
            color: portfolioOcc >= 90 ? "text-green-600" : portfolioOcc >= 70 ? "text-yellow-600" : "text-red-600" },
          { label: "Mo. Revenue",  value: fmt(totalRevenue),                icon: DollarSign },
          { label: "Monthly NOI",  value: fmt(totalNOI),                    icon: TrendingUp,
            color: totalNOI >= 0 ? "text-green-600" : "text-red-600" },
          { label: "Rev / Bed",    value: fmt(avgRevPerBed),                icon: DollarSign },
          { label: "Expense Ratio", value: fmtPct(portfolioExpRatio),       icon: BarChart3,
            color: portfolioExpRatio <= 60 ? "text-green-600" : portfolioExpRatio <= 80 ? "text-yellow-600" : "text-red-600" },
          { label: "Open Tickets", value: totalTickets.toString(),          icon: Wrench,
            color: totalTickets > 5 ? "text-red-600" : "text-foreground" },
        ].map(({ label, value, icon: Icon, color = "text-foreground" }) => (
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

      {/* Compare mode instructions */}
      {compareMode && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-3 text-sm text-blue-700">
            Select up to 3 properties below to compare side-by-side.
            {selected.length > 0 && ` (${selected.length} selected)`}
          </CardContent>
        </Card>
      )}

      {/* Property grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {houseMetrics.map((h) => {
          const borderColor = h.occ >= 90 ? "border-green-400" : h.occ >= 70 ? "border-yellow-400" : "border-red-400";
          const isSelected  = selected.includes(h.id);
          return (
            <Card
              key={h.id}
              className={`border-2 transition-all ${borderColor} ${compareMode ? "cursor-pointer" : "cursor-pointer hover:shadow-md"} ${isSelected ? "ring-2 ring-primary" : ""}`}
              onClick={() => compareMode ? toggleSelect(h.id) : navigate(`/houses/${h.id}`)}
            >
              {/* Photo placeholder */}
              <div className="h-32 bg-gradient-to-br from-slate-100 to-slate-200 rounded-t-lg flex items-center justify-center relative">
                <Building2 className="h-12 w-12 text-slate-300" />
                <div className="absolute top-2 right-2">
                  <Badge variant={h.occ >= 90 ? "default" : h.occ >= 70 ? "secondary" : "destructive"}>
                    {h.occ >= 90 ? "High" : h.occ >= 70 ? "Mod" : "Low"}
                  </Badge>
                </div>
                {h.tickets > 0 && (
                  <div className="absolute top-2 left-2">
                    <Badge variant="outline" className="bg-white">
                      <Wrench className="h-2.5 w-2.5 mr-1" />{h.tickets}
                    </Badge>
                  </div>
                )}
              </div>

              <CardContent className="p-4 space-y-3">
                <div>
                  <h3 className="font-semibold">{h.name}</h3>
                  <p className="text-xs text-muted-foreground">{h.address ?? "Address not set"}</p>
                </div>

                <OccupancyGauge rate={h.occ} />

                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Beds</p>
                    <p className="font-semibold">{h.occupied}/{h.total}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Mo. Revenue</p>
                    <p className="font-semibold">{fmt(h.revenue)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Rev / Bed</p>
                    <p className="font-semibold">{fmt(h.revPerBed)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Monthly NOI</p>
                    <p className={`font-semibold ${h.noi >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {fmt(h.noi)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Exp. Ratio</p>
                    <p className={`font-semibold ${h.expenseRatio <= 60 ? "text-green-600" : h.expenseRatio <= 80 ? "text-yellow-600" : "text-red-600"}`}>
                      {fmtPct(h.expenseRatio)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Open Tickets</p>
                    <p className={`font-semibold ${h.tickets > 0 ? "text-orange-600" : "text-green-600"}`}>
                      {h.tickets}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {houses.length === 0 && (
          <Card className="col-span-3">
            <CardContent className="text-center py-12">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="font-medium">No houses found</p>
              <p className="text-sm text-muted-foreground">Add properties in the Houses section first.</p>
              <Button className="mt-3" onClick={() => navigate("/houses")}>Go to Houses</Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Compare table */}
      {compareMode && selectedMetrics.length >= 2 && (
        <Card>
          <CardHeader><CardTitle>House Comparison</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 pr-6 font-medium">Metric</th>
                    {selectedMetrics.map((h) => (
                      <th key={h.id} className="text-center py-2 px-4 font-medium">{h.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: "Total Beds",    get: (h: any) => h.total.toString() },
                    { label: "Occupied",      get: (h: any) => h.occupied.toString() },
                    { label: "Occupancy",     get: (h: any) => fmtPct(h.occ) },
                    { label: "Mo. Revenue",   get: (h: any) => fmt(h.revenue) },
                    { label: "Rev / Bed",     get: (h: any) => fmt(h.revPerBed) },
                    { label: "Monthly NOI",   get: (h: any) => fmt(h.noi) },
                    { label: "Expense Ratio", get: (h: any) => fmtPct(h.expenseRatio) },
                    { label: "Open Tickets",  get: (h: any) => h.tickets.toString() },
                  ].map(({ label, get }) => (
                    <tr key={label} className="border-b">
                      <td className="py-2 pr-6 text-muted-foreground">{label}</td>
                      {selectedMetrics.map((h) => (
                        <td key={h.id} className="text-center py-2 px-4 font-medium">{get(h)}</td>
                      ))}
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
