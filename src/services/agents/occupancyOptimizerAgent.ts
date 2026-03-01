import { supabase } from "@/integrations/supabase/client";

// ─── Types ────────────────────────────────────────────────────────────────────

export type VacantBedInfo = {
  bedId: string;
  bedLabel: string;
  roomName: string;
  daysVacant: number;
};

export type HouseVacancy = {
  houseId: string;
  houseName: string;
  totalBeds: number;
  occupiedBeds: number;
  occupancyRate: number;
  vacantBeds: VacantBedInfo[];
  avgDailyRate: number;
  dailyRevenueLoss: number;
};

export type VacancyAnalysis = {
  totalBeds: number;
  occupiedBeds: number;
  vacantBeds: number;
  occupancyRate: number;
  dailyRevenueLoss: number;
  weeklyRevenueLoss: number;
  monthlyRevenueLoss: number;
  byHouse: HouseVacancy[];
};

export type BedMatch = {
  bedId: string;
  bedLabel: string;
  houseId: string;
  houseName: string;
  roomName: string;
  suggestedLeadId: string;
  suggestedLeadName: string;
  matchScore: number;
  matchReason: string;
};

export type ForecastPoint = {
  date: string;
  projected: number;
  occupancyPct: number;
};

// ─── Vacancy Analysis ─────────────────────────────────────────────────────────

export async function analyzeVacancy(): Promise<VacancyAnalysis> {
  const [
    { data: beds },
    { data: houses },
    { data: rooms },
    { data: invoices },
  ] = await Promise.all([
    supabase.from("beds").select("id, label, status, room_id, updated_at, rooms(id, house_id)"),
    supabase.from("houses").select("id, name"),
    supabase.from("rooms").select("id, name, house_id"),
    supabase.from("invoices").select("house_id, amount_cents").eq("status", "paid"),
  ]);

  const allBeds    = (beds ?? []) as any[];
  const allHouses  = (houses ?? []) as any[];
  const allRooms   = (rooms ?? []) as any[];
  const allInvoices = (invoices ?? []) as any[];
  const now = Date.now();

  const byHouse: HouseVacancy[] = allHouses.map((house) => {
    const houseBeds    = allBeds.filter((b) => b.rooms?.house_id === house.id);
    const houseInvoices = allInvoices.filter((i) => i.house_id === house.id);
    const totalBeds    = houseBeds.length;
    const occupiedCount = houseBeds.filter((b) => b.status === "occupied").length;

    // Average daily rate from paid invoices (assume monthly, /30)
    const avgMonthly =
      houseInvoices.length > 0
        ? houseInvoices.reduce((s: number, i: any) => s + i.amount_cents / 100, 0) /
          houseInvoices.length
        : 1050; // fallback $1050/mo
    const avgDailyRate = avgMonthly / 30;

    const vacantBeds: VacantBedInfo[] = houseBeds
      .filter((b) => b.status === "available")
      .map((b) => {
        // Calculate days vacant from the bed's updated_at timestamp (set when status changed)
        const updatedAt = b.updated_at ? new Date(b.updated_at).getTime() : now;
        const daysVacant = Math.max(1, Math.floor((now - updatedAt) / 86_400_000));
        return {
          bedId:     b.id,
          bedLabel:  b.label,
          roomName:  allRooms.find((r) => r.id === b.room_id)?.name ?? "Room",
          daysVacant,
        };
      });

    return {
      houseId:          house.id,
      houseName:        house.name,
      totalBeds,
      occupiedBeds:     occupiedCount,
      occupancyRate:    totalBeds > 0 ? (occupiedCount / totalBeds) * 100 : 0,
      vacantBeds,
      avgDailyRate,
      dailyRevenueLoss: vacantBeds.length * avgDailyRate,
    };
  });

  const totalBeds   = allBeds.length;
  const occupiedBeds = allBeds.filter((b) => b.status === "occupied").length;
  const dailyRevenueLoss = byHouse.reduce((s, h) => s + h.dailyRevenueLoss, 0);

  return {
    totalBeds,
    occupiedBeds,
    vacantBeds:         totalBeds - occupiedBeds,
    occupancyRate:      totalBeds > 0 ? (occupiedBeds / totalBeds) * 100 : 0,
    dailyRevenueLoss,
    weeklyRevenueLoss:  dailyRevenueLoss * 7,
    monthlyRevenueLoss: dailyRevenueLoss * 30,
    byHouse,
  };
}

// ─── Lead-to-Bed Matching ─────────────────────────────────────────────────────

export async function matchLeadsToBeds(): Promise<BedMatch[]> {
  const [
    { data: beds },
    { data: houses },
    { data: rooms },
    { data: leads },
  ] = await Promise.all([
    supabase.from("beds").select("id, label, room_id, status, rooms(id, house_id)"),
    supabase.from("houses").select("id, name"),
    supabase.from("rooms").select("id, name, house_id"),
    supabase
      .from("intake_leads")
      .select("id, name, status")
      .in("status", ["offer", "esign", "screening"]),
  ]);

  const vacantBeds  = ((beds ?? []) as any[]).filter((b) => b.status === "available");
  const readyLeads  = (leads ?? []) as any[];
  const allHouses   = (houses ?? []) as any[];
  const allRooms    = (rooms ?? []) as any[];
  const matches: BedMatch[] = [];

  readyLeads.slice(0, vacantBeds.length).forEach((lead, i) => {
    const bed   = vacantBeds[i];
    if (!bed) return;
    const room  = allRooms.find((r) => r.id === bed.room_id);
    const house = allHouses.find((h) => h.id === bed.rooms?.house_id);
    matches.push({
      bedId:              bed.id,
      bedLabel:           bed.label,
      houseId:            house?.id ?? "",
      houseName:          house?.name ?? "Unknown",
      roomName:           room?.name ?? "Unknown",
      suggestedLeadId:    lead.id,
      suggestedLeadName:  lead.name,
      matchScore:         Math.max(60, 90 - i * 5),
      matchReason:        `Lead in "${lead.status}" stage — ready to move in`,
    });
  });

  return matches;
}

// ─── Occupancy Forecast ───────────────────────────────────────────────────────

export async function forecastOccupancy(days = 90): Promise<ForecastPoint[]> {
  const [{ data: beds }, { data: residents }] = await Promise.all([
    supabase.from("beds").select("id, status"),
    supabase
      .from("residents")
      .select("id, move_out_date")
      .eq("status", "active")
      .not("move_out_date", "is", null),
  ]);

  const totalBeds      = (beds ?? []).length;
  const currentOccupied = (beds ?? []).filter((b: any) => b.status === "occupied").length;
  const allResidents   = (residents ?? []) as any[];
  const forecast: ForecastPoint[] = [];

  let projected = currentOccupied;

  for (let d = 0; d <= days; d += 7) {
    const checkDate = new Date(Date.now() + d * 86_400_000);
    const dateStr   = checkDate.toISOString().split("T")[0];

    // Count move-outs within ±3 days of check date
    const movingOut = allResidents.filter((r) => {
      if (!r.move_out_date) return false;
      const diff = Math.abs(new Date(r.move_out_date).getTime() - checkDate.getTime());
      return diff < 4 * 86_400_000;
    }).length;

    // Optimistic fill rate: 60% of vacancies convert from pipeline per week
    const newArrivals = d > 0 ? Math.floor(movingOut * 0.6) : 0;
    projected = Math.max(0, Math.min(totalBeds, projected - movingOut + newArrivals));

    forecast.push({
      date:          dateStr,
      projected,
      occupancyPct:  totalBeds > 0 ? Math.round((projected / totalBeds) * 100) : 0,
    });
  }

  return forecast;
}
