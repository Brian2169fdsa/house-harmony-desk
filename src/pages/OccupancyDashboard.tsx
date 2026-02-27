import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  BedDouble, TrendingUp, DollarSign, Users, Calendar, AlertTriangle,
} from "lucide-react";
import { format, addDays } from "date-fns";
import { toast } from "sonner";
import {
  analyzeVacancy,
  matchLeadsToBeds,
  forecastOccupancy,
  type VacancyAnalysis,
  type BedMatch,
  type ForecastPoint,
  type HouseVacancy,
} from "@/services/agents/occupancyOptimizerAgent";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  `$${n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

function bedColor(status: string, daysVacant?: number): string {
  if (status === "occupied") return "bg-green-500";
  if (status === "held") return "bg-yellow-400";
  // vacant / available
  if (daysVacant && daysVacant > 14) return "bg-red-600";
  return "bg-red-400";
}

function bedTooltip(status: string, label: string, daysVacant?: number): string {
  if (status === "occupied") return `${label} - Occupied`;
  if (status === "held") return `${label} - Held`;
  return `${label} - Vacant ${daysVacant ?? 0}d`;
}

// ─── Bed Map Panel ────────────────────────────────────────────────────────────

function BedMapPanel({ vacancy }: { vacancy: VacancyAnalysis }) {
  // Build the bed map from vacancy data plus occupied beds per house
  // We also need the full bed list with rooms for the occupied ones
  const { data: allBeds = [] } = useQuery({
    queryKey: ["occupancy-all-beds"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("beds")
        .select("id, label, status, room_id, rooms(id, name, house_id)");
      if (error) throw error;
      return (data ?? []) as Array<{
        id: string;
        label: string;
        status: string;
        room_id: string;
        rooms: { id: string; name: string; house_id: string } | null;
      }>;
    },
  });

  const { data: houses = [] } = useQuery({
    queryKey: ["occupancy-houses"],
    queryFn: async () => {
      const { data, error } = await supabase.from("houses").select("id, name");
      if (error) throw error;
      return data ?? [];
    },
  });

  // Group beds by house -> room
  type RoomGroup = { roomName: string; beds: { id: string; label: string; status: string; daysVacant?: number }[] };
  type HouseGroup = { houseId: string; houseName: string; rooms: RoomGroup[] };

  const houseMap = new Map<string, HouseGroup>();

  for (const house of houses) {
    houseMap.set(house.id, { houseId: house.id, houseName: house.name, rooms: [] });
  }

  // Build a lookup for days vacant from vacancy analysis
  const vacantLookup = new Map<string, number>();
  for (const h of vacancy.byHouse) {
    for (const vb of h.vacantBeds) {
      vacantLookup.set(vb.bedId, vb.daysVacant);
    }
  }

  // Group beds into rooms per house
  const roomMap = new Map<string, RoomGroup>();
  for (const bed of allBeds) {
    const houseId = bed.rooms?.house_id;
    if (!houseId) continue;
    const house = houseMap.get(houseId);
    if (!house) continue;

    const roomKey = `${houseId}__${bed.room_id}`;
    let room = roomMap.get(roomKey);
    if (!room) {
      room = { roomName: bed.rooms?.name ?? "Room", beds: [] };
      roomMap.set(roomKey, room);
      house.rooms.push(room);
    }
    room.beds.push({
      id: bed.id,
      label: bed.label,
      status: bed.status,
      daysVacant: vacantLookup.get(bed.id),
    });
  }

  const houseGroups = Array.from(houseMap.values()).filter((h) => h.rooms.length > 0);

  if (houseGroups.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        No houses or beds configured yet.
      </p>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {houseGroups.map((house) => {
        const houseVacancy = vacancy.byHouse.find((h) => h.houseId === house.houseId);
        const occupancyPct = houseVacancy ? Math.round(houseVacancy.occupancyRate) : 0;
        return (
          <Card key={house.houseId}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">{house.houseName}</CardTitle>
                <Badge
                  variant={occupancyPct >= 90 ? "default" : occupancyPct >= 70 ? "secondary" : "destructive"}
                >
                  {occupancyPct}% occ
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {house.rooms.map((room, ri) => (
                  <div key={ri}>
                    <p className="text-xs text-muted-foreground mb-1">{room.roomName}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {room.beds.map((bed) => (
                        <div
                          key={bed.id}
                          title={bedTooltip(bed.status, bed.label, bed.daysVacant)}
                          className={`w-7 h-7 rounded flex items-center justify-center text-[10px] font-medium text-white cursor-default ${bedColor(bed.status, bed.daysVacant)}`}
                        >
                          {bed.status === "available" && bed.daysVacant != null
                            ? bed.daysVacant
                            : bed.label.slice(0, 2)}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Legend */}
      <Card className="col-span-full">
        <CardContent className="py-3">
          <div className="flex items-center gap-6 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded bg-green-500" />
              <span>Occupied</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded bg-yellow-400" />
              <span>Held</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded bg-red-400" />
              <span>Vacant (under 14d)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded bg-red-600" />
              <span>Vacant (14d+)</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Vacancy Cost Panel ───────────────────────────────────────────────────────

function VacancyCostPanel({ vacancy }: { vacancy: VacancyAnalysis }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-red-200">
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Daily Loss</p>
            <p className="text-2xl font-bold text-red-600 mt-1">
              {fmt(vacancy.dailyRevenueLoss)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-red-200">
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Weekly Loss</p>
            <p className="text-2xl font-bold text-red-600 mt-1">
              {fmt(vacancy.weeklyRevenueLoss)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-red-200">
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Monthly Loss</p>
            <p className="text-2xl font-bold text-red-600 mt-1">
              {fmt(vacancy.monthlyRevenueLoss)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Revenue Loss by House</CardTitle>
        </CardHeader>
        <CardContent>
          {vacancy.byHouse.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No data</p>
          ) : (
            <div className="divide-y">
              {vacancy.byHouse.map((h) => (
                <div key={h.houseId} className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-medium">{h.houseName}</p>
                    <p className="text-xs text-muted-foreground">
                      {h.vacantBeds.length} vacant of {h.totalBeds} beds
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-red-600">
                      {fmt(h.dailyRevenueLoss)}/day
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Avg rate: {fmt(h.avgDailyRate)}/bed/day
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Lead-to-Bed Matching Panel ───────────────────────────────────────────────

function MatchingPanel({ matches }: { matches: BedMatch[] }) {
  const handleAssign = (match: BedMatch) => {
    toast.success(
      `Assignment queued: ${match.suggestedLeadName} -> ${match.houseName} / ${match.roomName} / ${match.bedLabel}`
    );
  };

  if (matches.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-sm text-muted-foreground text-center">
            No pipeline leads ready for bed assignment right now.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {matches.map((m) => (
        <Card key={`${m.bedId}-${m.suggestedLeadId}`}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold">{m.suggestedLeadName}</span>
                  <Badge variant="secondary" className="text-xs">
                    Score: {m.matchScore}%
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {m.houseName} &rarr; {m.roomName} &rarr; Bed {m.bedLabel}
                </p>
                <p className="text-xs text-muted-foreground mt-1 italic">{m.matchReason}</p>
              </div>
              <Button size="sm" onClick={() => handleAssign(m)}>
                Assign
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── Lease Expiration Table ───────────────────────────────────────────────────

function LeaseExpirationPanel() {
  const { data: expiringResidents = [] } = useQuery({
    queryKey: ["occupancy-lease-expirations"],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const ninetyDaysOut = format(addDays(new Date(), 90), "yyyy-MM-dd");
      const { data, error } = await supabase
        .from("residents")
        .select("id, name, room, lease_end, move_out_date, status")
        .eq("status", "active")
        .not("lease_end", "is", null)
        .gte("lease_end", today)
        .lte("lease_end", ninetyDaysOut)
        .order("lease_end", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Array<{
        id: string;
        name: string;
        room: string | null;
        lease_end: string | null;
        move_out_date: string | null;
        status: string | null;
      }>;
    },
  });

  if (expiringResidents.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-sm text-muted-foreground text-center">
            No lease expirations in the next 90 days.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Upcoming Lease Expirations (Next 90 Days)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 font-medium text-muted-foreground">Resident</th>
                <th className="text-left py-2 font-medium text-muted-foreground">Room</th>
                <th className="text-left py-2 font-medium text-muted-foreground">Lease End</th>
                <th className="text-left py-2 font-medium text-muted-foreground">Move-out</th>
                <th className="text-left py-2 font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {expiringResidents.map((r) => {
                const daysUntil = r.lease_end
                  ? Math.ceil(
                      (new Date(r.lease_end).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                    )
                  : null;
                return (
                  <tr key={r.id} className="border-b last:border-0">
                    <td className="py-2 font-medium">{r.name}</td>
                    <td className="py-2 text-muted-foreground">{r.room ?? "N/A"}</td>
                    <td className="py-2">
                      {r.lease_end ? format(new Date(r.lease_end), "MMM d, yyyy") : "N/A"}
                      {daysUntil != null && daysUntil <= 14 && (
                        <Badge variant="destructive" className="ml-2 text-[10px]">
                          {daysUntil}d
                        </Badge>
                      )}
                    </td>
                    <td className="py-2 text-muted-foreground">
                      {r.move_out_date
                        ? format(new Date(r.move_out_date), "MMM d, yyyy")
                        : "Not set"}
                    </td>
                    <td className="py-2">
                      {r.move_out_date ? (
                        <Badge variant="destructive">Move-out set</Badge>
                      ) : (
                        <Badge variant="secondary">No renewal</Badge>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Forecast Chart ───────────────────────────────────────────────────────────

function ForecastPanel({ forecast }: { forecast: ForecastPoint[] }) {
  if (forecast.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-sm text-muted-foreground text-center">
            No forecast data available.
          </p>
        </CardContent>
      </Card>
    );
  }

  const chartData = forecast.map((f) => ({
    date: format(new Date(f.date), "MMM d"),
    occupancy: f.occupancyPct,
    beds: f.projected,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          90-Day Occupancy Forecast
        </CardTitle>
        <CardDescription>
          Projected occupancy based on upcoming move-outs and pipeline fill rate
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
            <Tooltip
              formatter={(value: number, name: string) =>
                name === "occupancy" ? `${value}%` : `${value} beds`
              }
            />
            <Line
              type="monotone"
              dataKey="occupancy"
              stroke="#6366f1"
              strokeWidth={2}
              name="occupancy"
              dot={{ r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// ─── Pricing Recommendations ──────────────────────────────────────────────────

function PricingPanel({ vacancy }: { vacancy: VacancyAnalysis }) {
  // Generate pricing suggestions based on occupancy per house
  const recommendations = vacancy.byHouse.map((h) => {
    const currentMonthlyRate = h.avgDailyRate * 30;
    let suggestedRate: number;
    let impact: string;

    if (h.occupancyRate >= 95) {
      // Very high occupancy -- can raise rates
      suggestedRate = currentMonthlyRate * 1.08;
      impact = "High demand. 8% increase could yield higher revenue without impacting fill.";
    } else if (h.occupancyRate >= 85) {
      // Healthy occupancy -- slight increase possible
      suggestedRate = currentMonthlyRate * 1.03;
      impact = "Healthy occupancy. Modest 3% increase recommended.";
    } else if (h.occupancyRate >= 70) {
      // Below target -- hold steady
      suggestedRate = currentMonthlyRate;
      impact = "Below target. Hold current rate to maintain fill.";
    } else {
      // Low occupancy -- consider reduction
      suggestedRate = currentMonthlyRate * 0.95;
      impact = "Low occupancy. Consider 5% reduction to accelerate fills.";
    }

    return {
      houseId: h.houseId,
      houseName: h.houseName,
      occupancyRate: h.occupancyRate,
      currentRate: currentMonthlyRate,
      suggestedRate,
      impact,
    };
  });

  if (recommendations.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-sm text-muted-foreground text-center">
            No houses to generate pricing recommendations.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <DollarSign className="h-4 w-4" />
          Pricing Recommendations
        </CardTitle>
        <CardDescription>
          Rate suggestions based on current occupancy levels
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 font-medium text-muted-foreground">House</th>
                <th className="text-left py-2 font-medium text-muted-foreground">Occupancy</th>
                <th className="text-right py-2 font-medium text-muted-foreground">Current Rate</th>
                <th className="text-right py-2 font-medium text-muted-foreground">Suggested Rate</th>
                <th className="text-left py-2 font-medium text-muted-foreground">Projected Impact</th>
              </tr>
            </thead>
            <tbody>
              {recommendations.map((r) => {
                const diff = r.suggestedRate - r.currentRate;
                return (
                  <tr key={r.houseId} className="border-b last:border-0">
                    <td className="py-2 font-medium">{r.houseName}</td>
                    <td className="py-2">
                      <Badge
                        variant={
                          r.occupancyRate >= 90
                            ? "default"
                            : r.occupancyRate >= 70
                              ? "secondary"
                              : "destructive"
                        }
                      >
                        {Math.round(r.occupancyRate)}%
                      </Badge>
                    </td>
                    <td className="py-2 text-right">{fmt(r.currentRate)}/mo</td>
                    <td className="py-2 text-right">
                      <span
                        className={
                          diff > 0
                            ? "text-green-600 font-semibold"
                            : diff < 0
                              ? "text-red-600 font-semibold"
                              : ""
                        }
                      >
                        {fmt(r.suggestedRate)}/mo
                      </span>
                    </td>
                    <td className="py-2 text-xs text-muted-foreground max-w-[250px]">
                      {r.impact}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function OccupancyDashboard() {
  const {
    data: vacancy,
    isLoading: vacancyLoading,
    error: vacancyError,
  } = useQuery<VacancyAnalysis>({
    queryKey: ["occupancy-vacancy-analysis"],
    queryFn: analyzeVacancy,
    staleTime: 60_000,
  });

  const {
    data: matches = [],
    isLoading: matchesLoading,
  } = useQuery<BedMatch[]>({
    queryKey: ["occupancy-lead-matches"],
    queryFn: matchLeadsToBeds,
    staleTime: 60_000,
  });

  const {
    data: forecast = [],
    isLoading: forecastLoading,
  } = useQuery<ForecastPoint[]>({
    queryKey: ["occupancy-forecast"],
    queryFn: () => forecastOccupancy(90),
    staleTime: 60_000,
  });

  if (vacancyLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Loading occupancy data...</p>
      </div>
    );
  }

  if (vacancyError || !vacancy) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-2" />
          <p className="text-sm text-destructive">
            Failed to load occupancy data. Please try again.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Occupancy Optimizer</h1>
          <p className="text-muted-foreground">
            AI-powered bed management, vacancy analysis, and demand forecasting
          </p>
        </div>
        <Badge variant="secondary">
          <BedDouble className="h-3.5 w-3.5 mr-1" />
          System 3
        </Badge>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Beds</p>
            <p className="text-2xl font-bold mt-1">{vacancy.totalBeds}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Occupied</p>
            <p className="text-2xl font-bold text-green-600 mt-1">{vacancy.occupiedBeds}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Vacant</p>
            <p className="text-2xl font-bold text-red-600 mt-1">{vacancy.vacantBeds}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Occupancy Rate</p>
            <p
              className={`text-2xl font-bold mt-1 ${
                vacancy.occupancyRate >= 90
                  ? "text-green-600"
                  : vacancy.occupancyRate >= 70
                    ? "text-yellow-600"
                    : "text-red-600"
              }`}
            >
              {vacancy.occupancyRate.toFixed(1)}%
            </p>
          </CardContent>
        </Card>
        <Card className="border-red-200">
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Daily Rev Loss</p>
            <p className="text-2xl font-bold text-red-600 mt-1">
              {fmt(vacancy.dailyRevenueLoss)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabbed content */}
      <Tabs defaultValue="bedmap">
        <TabsList className="grid grid-cols-6 w-full">
          <TabsTrigger value="bedmap">Bed Map</TabsTrigger>
          <TabsTrigger value="vacancy">Vacancy Cost</TabsTrigger>
          <TabsTrigger value="matching">Lead Matching</TabsTrigger>
          <TabsTrigger value="leases">Lease Expirations</TabsTrigger>
          <TabsTrigger value="forecast">Forecast</TabsTrigger>
          <TabsTrigger value="pricing">Pricing</TabsTrigger>
        </TabsList>

        <TabsContent value="bedmap" className="mt-6">
          <BedMapPanel vacancy={vacancy} />
        </TabsContent>

        <TabsContent value="vacancy" className="mt-6">
          <VacancyCostPanel vacancy={vacancy} />
        </TabsContent>

        <TabsContent value="matching" className="mt-6">
          {matchesLoading ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Running AI lead matching...
            </p>
          ) : (
            <MatchingPanel matches={matches} />
          )}
        </TabsContent>

        <TabsContent value="leases" className="mt-6">
          <LeaseExpirationPanel />
        </TabsContent>

        <TabsContent value="forecast" className="mt-6">
          {forecastLoading ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Computing forecast...
            </p>
          ) : (
            <ForecastPanel forecast={forecast} />
          )}
        </TabsContent>

        <TabsContent value="pricing" className="mt-6">
          <PricingPanel vacancy={vacancy} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
