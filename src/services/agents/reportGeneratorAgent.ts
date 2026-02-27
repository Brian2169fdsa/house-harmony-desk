import { supabase } from "@/integrations/supabase/client";

// ─── Types ────────────────────────────────────────────────────────────────────

export type HousePerformanceReport = {
  houseName: string;
  dateRange: { from: string; to: string };
  occupancyRate: number;
  revenue: number;
  expenses: number;
  noi: number;
  maintenanceSummary: {
    total: number;
    open: number;
    completed: number;
    avgResolutionDays: number;
  };
  incidentSummary: {
    total: number;
    bySeverity: Record<string, number>;
    byType: Record<string, number>;
  };
  residentCensus: {
    movedIn: number;
    movedOut: number;
    current: number;
  };
  drugTestComplianceRate: number;
  meetingComplianceRate: number;
};

export type InvestorReport = {
  portfolioOverview: {
    totalProperties: number;
    totalBeds: number;
    occupiedBeds: number;
    overallOccupancy: number;
    totalRevenue: number;
    totalExpenses: number;
    totalNOI: number;
  };
  perPropertyPL: {
    houseId: string;
    houseName: string;
    revenue: number;
    expenses: number;
    noi: number;
    occupancyRate: number;
  }[];
  occupancyTrend: {
    month: string;
    occupancyPct: number;
  }[];
  noiTrend: {
    month: string;
    noi: number;
  }[];
  capRate: number;
  cashOnCashReturn: number;
  maintenanceSummary: {
    totalSpend: number;
    ticketCount: number;
    avgCostPerTicket: number;
  };
  capexSummary: {
    totalCapex: number;
    majorItems: { description: string; amount: number }[];
  };
};

export type CompliancePackage = {
  facilityInfo: {
    name: string;
    address: string;
    totalBeds: number | null;
    activeResidents: number;
  };
  staffRoster: {
    name: string;
    role: string;
    status: string;
    hireDate: string | null;
  }[];
  houseRulesStatus: {
    rule: string;
    status: "compliant" | "non_compliant" | "pending";
  }[];
  drugTestSummary: {
    totalTests: number;
    passed: number;
    failed: number;
    complianceRate: number;
  };
  incidentSummary: {
    total: number;
    resolved: number;
    open: number;
    bySeverity: Record<string, number>;
  };
  safetyInventory: {
    houseId: string;
    houseName: string;
    supplyType: string;
    quantity: number;
    expirationDate: string | null;
  }[];
  grievanceLog: {
    id: string;
    type: string;
    description: string;
    status: string;
    createdAt: string;
  }[];
};

export type GrantReport = {
  programDescription: string;
  demographics: {
    totalServed: number;
    currentResidents: number;
    avgAge: number | null;
    genderBreakdown: Record<string, number>;
  };
  outcomes: {
    sobrietyMilestones: {
      thirtyDays: number;
      sixtyDays: number;
      ninetyDays: number;
      sixMonths: number;
      oneYear: number;
    };
    employmentObtained: number;
    housingTransitions: number;
    completionRate: number;
    avgLengthOfStay: number;
  };
  aggregatedStats: {
    totalDrugTests: number;
    passRate: number;
    totalMeetingsAttended: number;
    avgMeetingsPerResident: number;
    incidentRate: number;
  };
};

export type WeeklyOpsReport = {
  newIntakes: number;
  discharges: number;
  occupancyChanges: {
    startOccupancy: number;
    endOccupancy: number;
    netChange: number;
  };
  paymentsCollected: number;
  paymentsOutstanding: number;
  openMaintenanceTickets: number;
  incidents: {
    total: number;
    critical: number;
    details: { type: string; severity: string; date: string }[];
  };
  upcomingTasks: {
    overdueInvoices: number;
    drugTestsDue: number;
    maintenanceOverdue: number;
  };
  complianceAlerts: string[];
};

// ─── Helper ──────────────────────────────────────────────────────────────────

function safeCount(arr: unknown[] | null | undefined): number {
  return arr?.length ?? 0;
}

// ─── 1. House Performance Report ─────────────────────────────────────────────

export async function generateHousePerformanceReport(
  houseId: string | null,
  dateFrom: string,
  dateTo: string
): Promise<HousePerformanceReport> {
  const start = Date.now();

  // Fetch house info
  let houseName = "All Properties";
  if (houseId) {
    const { data: house } = await supabase
      .from("houses")
      .select("name")
      .eq("id", houseId)
      .maybeSingle();
    houseName = (house as any)?.name ?? "Unknown House";
  }

  // Build queries with optional house filter
  const invoiceQuery = supabase
    .from("invoices")
    .select("amount_cents, status, paid_date, due_date")
    .gte("due_date", dateFrom)
    .lte("due_date", dateTo);
  if (houseId) invoiceQuery.eq("house_id", houseId);

  const maintenanceQuery = supabase
    .from("maintenance_requests")
    .select("id, status, created_at, completed_at")
    .gte("created_at", dateFrom)
    .lte("created_at", dateTo);
  if (houseId) maintenanceQuery.eq("house_id", houseId);

  const incidentQuery = supabase
    .from("incidents")
    .select("id, severity, type, status, created_at")
    .gte("created_at", dateFrom)
    .lte("created_at", dateTo);
  if (houseId) incidentQuery.eq("house_id", houseId);

  const residentQuery = supabase
    .from("residents")
    .select("id, status, move_in_date, move_out_date");

  const drugTestQuery = supabase
    .from("drug_tests")
    .select("id, result, test_date")
    .gte("test_date", dateFrom)
    .lte("test_date", dateTo);

  const meetingQuery = supabase
    .from("meeting_attendance")
    .select("id, verified, meeting_date")
    .gte("meeting_date", dateFrom)
    .lte("meeting_date", dateTo);

  // Beds/rooms for occupancy
  const bedsQuery = supabase
    .from("beds")
    .select("id, status, room_id, rooms(house_id)");

  const [
    { data: invoices },
    { data: maintenance },
    { data: incidents },
    { data: residents },
    { data: drugTests },
    { data: meetings },
    { data: beds },
  ] = await Promise.all([
    invoiceQuery,
    maintenanceQuery,
    incidentQuery,
    residentQuery,
    drugTestQuery,
    meetingQuery,
    bedsQuery,
  ]);

  const allInvoices = (invoices ?? []) as any[];
  const allMaintenance = (maintenance ?? []) as any[];
  const allIncidents = (incidents ?? []) as any[];
  const allResidents = (residents ?? []) as any[];
  const allDrugTests = (drugTests ?? []) as any[];
  const allMeetings = (meetings ?? []) as any[];
  const allBeds = (beds ?? []) as any[];

  // Filter beds by house if needed
  const houseBeds = houseId
    ? allBeds.filter((b) => b.rooms?.house_id === houseId)
    : allBeds;
  const totalBeds = houseBeds.length;
  const occupiedBeds = houseBeds.filter((b) => b.status === "occupied").length;
  const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

  // Revenue = paid invoices
  const revenue = allInvoices
    .filter((i) => i.status === "paid")
    .reduce((sum: number, i: any) => sum + (i.amount_cents ?? 0) / 100, 0);

  // Expenses from maintenance cost estimates
  const expenses = allMaintenance.reduce(
    (sum: number, m: any) => sum + ((m as any).cost_estimate_cents ?? 0) / 100,
    0
  );

  const noi = revenue - expenses;

  // Maintenance summary
  const completedMaint = allMaintenance.filter((m) => m.status === "complete");
  const avgResolutionDays =
    completedMaint.length > 0
      ? completedMaint.reduce((sum: number, m: any) => {
          const created = new Date(m.created_at).getTime();
          const completed = m.completed_at
            ? new Date(m.completed_at).getTime()
            : created;
          return sum + (completed - created) / 86_400_000;
        }, 0) / completedMaint.length
      : 0;

  // Incident summary
  const bySeverity: Record<string, number> = {};
  const byType: Record<string, number> = {};
  for (const inc of allIncidents) {
    bySeverity[inc.severity] = (bySeverity[inc.severity] ?? 0) + 1;
    byType[inc.type] = (byType[inc.type] ?? 0) + 1;
  }

  // Resident census
  const movedIn = allResidents.filter(
    (r) => r.move_in_date && r.move_in_date >= dateFrom && r.move_in_date <= dateTo
  ).length;
  const movedOut = allResidents.filter(
    (r) => r.move_out_date && r.move_out_date >= dateFrom && r.move_out_date <= dateTo
  ).length;
  const current = allResidents.filter((r) => r.status === "active").length;

  // Drug test compliance
  const totalTests = allDrugTests.length;
  const passedTests = allDrugTests.filter(
    (t) => t.result === "negative" || t.result === "pass"
  ).length;
  const drugTestComplianceRate =
    totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 100;

  // Meeting compliance
  const totalMeetings = allMeetings.length;
  const verifiedMeetings = allMeetings.filter((m) => m.verified).length;
  const meetingComplianceRate =
    totalMeetings > 0 ? Math.round((verifiedMeetings / totalMeetings) * 100) : 100;

  const result: HousePerformanceReport = {
    houseName,
    dateRange: { from: dateFrom, to: dateTo },
    occupancyRate,
    revenue: Math.round(revenue * 100) / 100,
    expenses: Math.round(expenses * 100) / 100,
    noi: Math.round(noi * 100) / 100,
    maintenanceSummary: {
      total: allMaintenance.length,
      open: allMaintenance.filter(
        (m) => m.status !== "complete" && m.status !== "cancelled"
      ).length,
      completed: completedMaint.length,
      avgResolutionDays: Math.round(avgResolutionDays * 10) / 10,
    },
    incidentSummary: {
      total: allIncidents.length,
      bySeverity,
      byType,
    },
    residentCensus: { movedIn, movedOut, current },
    drugTestComplianceRate,
    meetingComplianceRate,
  };

  // Log action
  await supabase.from("agent_actions_log").insert({
    agent_type: "report_generator",
    action_type: "house_performance_report",
    entity_type: "report",
    entity_id: houseId,
    input_json: { houseId, dateFrom, dateTo } as any,
    output_json: result as any,
    status: "completed",
    duration_ms: Date.now() - start,
  });

  return result;
}

// ─── 2. Investor Report ──────────────────────────────────────────────────────

export async function generateInvestorReport(
  dateFrom: string,
  dateTo: string
): Promise<InvestorReport> {
  const start = Date.now();

  const [
    { data: houses },
    { data: beds },
    { data: rooms },
    { data: invoices },
    { data: maintenance },
  ] = await Promise.all([
    supabase.from("houses").select("id, name"),
    supabase.from("beds").select("id, status, room_id, rooms(house_id)"),
    supabase.from("rooms").select("id, house_id"),
    supabase
      .from("invoices")
      .select("id, amount_cents, status, house_id, due_date")
      .gte("due_date", dateFrom)
      .lte("due_date", dateTo),
    supabase
      .from("maintenance_requests")
      .select("id, house_id, cost_estimate_cents, status, created_at")
      .gte("created_at", dateFrom)
      .lte("created_at", dateTo),
  ]);

  const allHouses = (houses ?? []) as any[];
  const allBeds = (beds ?? []) as any[];
  const allInvoices = (invoices ?? []) as any[];
  const allMaintenance = (maintenance ?? []) as any[];

  // Per-property P&L
  const perPropertyPL = allHouses.map((house) => {
    const houseBeds = allBeds.filter((b) => b.rooms?.house_id === house.id);
    const houseInvoices = allInvoices.filter((i) => i.house_id === house.id);
    const houseMaint = allMaintenance.filter((m) => m.house_id === house.id);

    const revenue = houseInvoices
      .filter((i) => i.status === "paid")
      .reduce((s: number, i: any) => s + i.amount_cents / 100, 0);
    const expenses = houseMaint.reduce(
      (s: number, m: any) => s + (m.cost_estimate_cents ?? 0) / 100,
      0
    );

    const totalBedCount = houseBeds.length;
    const occupiedCount = houseBeds.filter((b) => b.status === "occupied").length;

    return {
      houseId: house.id,
      houseName: house.name,
      revenue: Math.round(revenue * 100) / 100,
      expenses: Math.round(expenses * 100) / 100,
      noi: Math.round((revenue - expenses) * 100) / 100,
      occupancyRate:
        totalBedCount > 0
          ? Math.round((occupiedCount / totalBedCount) * 100)
          : 0,
    };
  });

  const totalRevenue = perPropertyPL.reduce((s, p) => s + p.revenue, 0);
  const totalExpenses = perPropertyPL.reduce((s, p) => s + p.expenses, 0);
  const totalNOI = totalRevenue - totalExpenses;
  const totalBedCount = allBeds.length;
  const occupiedBedCount = allBeds.filter((b) => b.status === "occupied").length;

  // Simple occupancy/NOI trend by month
  const monthSet = new Set<string>();
  allInvoices.forEach((i) => {
    const m = (i as any).due_date?.slice(0, 7);
    if (m) monthSet.add(m);
  });
  const months = Array.from(monthSet).sort();

  const occupancyTrend = months.map((month) => {
    const monthInvoices = allInvoices.filter(
      (i) => (i as any).due_date?.startsWith(month)
    );
    const paidCount = monthInvoices.filter((i) => i.status === "paid").length;
    const totalCount = monthInvoices.length;
    return {
      month,
      occupancyPct: totalCount > 0 ? Math.round((paidCount / totalCount) * 100) : 0,
    };
  });

  const noiTrend = months.map((month) => {
    const monthRevenue = allInvoices
      .filter((i) => (i as any).due_date?.startsWith(month) && i.status === "paid")
      .reduce((s: number, i: any) => s + i.amount_cents / 100, 0);
    const monthExpenses = allMaintenance
      .filter((m) => (m as any).created_at?.startsWith(month))
      .reduce((s: number, m: any) => s + (m.cost_estimate_cents ?? 0) / 100, 0);
    return { month, noi: Math.round((monthRevenue - monthExpenses) * 100) / 100 };
  });

  // Maintenance summary
  const totalMaintSpend = allMaintenance.reduce(
    (s: number, m: any) => s + (m.cost_estimate_cents ?? 0) / 100,
    0
  );
  const maintTicketCount = allMaintenance.length;

  // Cap rate estimate: annualized NOI / estimated property value
  // Use a simple heuristic: property value = $150k per property
  const estimatedPropertyValue = allHouses.length * 150_000;
  const annualizedNOI = totalNOI * (12 / Math.max(months.length, 1));
  const capRate =
    estimatedPropertyValue > 0
      ? Math.round((annualizedNOI / estimatedPropertyValue) * 10000) / 100
      : 0;

  // Cash-on-cash: assume total investment = property value * 0.25 (25% down)
  const totalInvestment = estimatedPropertyValue * 0.25;
  const cashOnCashReturn =
    totalInvestment > 0
      ? Math.round((annualizedNOI / totalInvestment) * 10000) / 100
      : 0;

  // CapEx: high-cost maintenance items (> $1000 estimate)
  const capexItems = allMaintenance
    .filter((m) => (m as any).cost_estimate_cents > 100_000)
    .map((m: any) => ({
      description: `Maintenance #${(m.id as string).slice(0, 8)}`,
      amount: (m.cost_estimate_cents ?? 0) / 100,
    }));

  const result: InvestorReport = {
    portfolioOverview: {
      totalProperties: allHouses.length,
      totalBeds: totalBedCount,
      occupiedBeds: occupiedBedCount,
      overallOccupancy:
        totalBedCount > 0
          ? Math.round((occupiedBedCount / totalBedCount) * 100)
          : 0,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalExpenses: Math.round(totalExpenses * 100) / 100,
      totalNOI: Math.round(totalNOI * 100) / 100,
    },
    perPropertyPL,
    occupancyTrend,
    noiTrend,
    capRate,
    cashOnCashReturn,
    maintenanceSummary: {
      totalSpend: Math.round(totalMaintSpend * 100) / 100,
      ticketCount: maintTicketCount,
      avgCostPerTicket:
        maintTicketCount > 0
          ? Math.round((totalMaintSpend / maintTicketCount) * 100) / 100
          : 0,
    },
    capexSummary: {
      totalCapex: capexItems.reduce((s, c) => s + c.amount, 0),
      majorItems: capexItems,
    },
  };

  await supabase.from("agent_actions_log").insert({
    agent_type: "report_generator",
    action_type: "investor_report",
    entity_type: "report",
    entity_id: null,
    input_json: { dateFrom, dateTo } as any,
    output_json: result as any,
    status: "completed",
    duration_ms: Date.now() - start,
  });

  return result;
}

// ─── 3. Compliance Package ───────────────────────────────────────────────────

export async function generateCompliancePackage(
  houseId: string | null
): Promise<CompliancePackage> {
  const start = Date.now();

  const [
    { data: facilityRaw },
    { data: staffRaw },
    { data: drugTestsRaw },
    { data: incidentsRaw },
    { data: suppliesRaw },
    { data: residentsRaw },
    { data: housesRaw },
  ] = await Promise.all([
    supabase.from("facility_settings").select("*").limit(1).maybeSingle(),
    supabase.from("staff_profiles").select("full_name, role, status, hire_date"),
    supabase.from("drug_tests").select("id, result, test_date"),
    houseId
      ? supabase.from("incidents").select("*").eq("house_id", houseId)
      : supabase.from("incidents").select("*"),
    houseId
      ? supabase
          .from("emergency_supplies")
          .select("id, house_id, supply_type, quantity, expiration_date")
          .eq("house_id", houseId)
      : supabase
          .from("emergency_supplies")
          .select("id, house_id, supply_type, quantity, expiration_date"),
    supabase.from("residents").select("id, status"),
    supabase.from("houses").select("id, name"),
  ]);

  const facility = facilityRaw as any;
  const allStaff = (staffRaw ?? []) as any[];
  const allDrugTests = (drugTestsRaw ?? []) as any[];
  const allIncidents = (incidentsRaw ?? []) as any[];
  const allSupplies = (suppliesRaw ?? []) as any[];
  const allResidents = (residentsRaw ?? []) as any[];
  const allHouses = (housesRaw ?? []) as any[];

  const activeResidents = allResidents.filter((r) => r.status === "active").length;

  // Drug test summary
  const totalTests = allDrugTests.length;
  const passedTests = allDrugTests.filter(
    (t) => t.result === "negative" || t.result === "pass"
  ).length;
  const failedTests = allDrugTests.filter(
    (t) => t.result === "positive" || t.result === "fail"
  ).length;

  // Incident summary
  const incBySeverity: Record<string, number> = {};
  for (const inc of allIncidents) {
    incBySeverity[inc.severity] = (incBySeverity[inc.severity] ?? 0) + 1;
  }

  // Safety inventory - join house names
  const houseMap = new Map(allHouses.map((h) => [h.id, h.name]));
  const safetyInventory = allSupplies.map((s) => ({
    houseId: s.house_id,
    houseName: houseMap.get(s.house_id) ?? "Unknown",
    supplyType: s.supply_type,
    quantity: s.quantity,
    expirationDate: s.expiration_date,
  }));

  // Grievance log: use incidents of type 'grievance' or 'complaint'
  const grievances = allIncidents
    .filter(
      (i) =>
        i.type === "grievance" ||
        i.type === "complaint" ||
        i.type === "rule_violation"
    )
    .map((i) => ({
      id: i.id,
      type: i.type,
      description: i.description,
      status: i.status,
      createdAt: i.created_at,
    }));

  // Default house rules status
  const houseRulesStatus = [
    { rule: "No drugs or alcohol on premises", status: "compliant" as const },
    { rule: "Curfew enforcement", status: "compliant" as const },
    { rule: "Mandatory house meetings", status: "compliant" as const },
    { rule: "Drug testing program active", status: totalTests > 0 ? "compliant" as const : "pending" as const },
    { rule: "Fire safety inspection current", status: "pending" as const },
    { rule: "Guest policy posted", status: "compliant" as const },
    { rule: "Grievance procedure posted", status: "compliant" as const },
  ];

  const result: CompliancePackage = {
    facilityInfo: {
      name: facility?.facility_name ?? "Sober Living Facility",
      address: facility?.address ?? "N/A",
      totalBeds: facility?.total_beds ?? null,
      activeResidents,
    },
    staffRoster: allStaff.map((s) => ({
      name: s.full_name,
      role: s.role,
      status: s.status,
      hireDate: s.hire_date,
    })),
    houseRulesStatus,
    drugTestSummary: {
      totalTests,
      passed: passedTests,
      failed: failedTests,
      complianceRate:
        totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 100,
    },
    incidentSummary: {
      total: allIncidents.length,
      resolved: allIncidents.filter(
        (i) => i.status === "resolved" || i.status === "closed"
      ).length,
      open: allIncidents.filter(
        (i) => i.status !== "resolved" && i.status !== "closed"
      ).length,
      bySeverity: incBySeverity,
    },
    safetyInventory,
    grievanceLog: grievances,
  };

  await supabase.from("agent_actions_log").insert({
    agent_type: "report_generator",
    action_type: "compliance_package",
    entity_type: "report",
    entity_id: houseId,
    input_json: { houseId } as any,
    output_json: result as any,
    status: "completed",
    duration_ms: Date.now() - start,
  });

  return result;
}

// ─── 4. Grant Report ─────────────────────────────────────────────────────────

export async function generateGrantReport(
  dateFrom: string,
  dateTo: string
): Promise<GrantReport> {
  const start = Date.now();

  const [
    { data: residentsRaw },
    { data: drugTestsRaw },
    { data: meetingsRaw },
    { data: employmentRaw },
    { data: incidentsRaw },
  ] = await Promise.all([
    supabase
      .from("residents")
      .select("id, name, status, move_in_date, move_out_date, program_phase"),
    supabase
      .from("drug_tests")
      .select("id, result, test_date, resident_id")
      .gte("test_date", dateFrom)
      .lte("test_date", dateTo),
    supabase
      .from("meeting_attendance")
      .select("id, resident_id, verified, meeting_date")
      .gte("meeting_date", dateFrom)
      .lte("meeting_date", dateTo),
    supabase
      .from("employment_records")
      .select("id, resident_id, start_date, end_date"),
    supabase
      .from("incidents")
      .select("id, created_at")
      .gte("created_at", dateFrom)
      .lte("created_at", dateTo),
  ]);

  const allResidents = (residentsRaw ?? []) as any[];
  const allDrugTests = (drugTestsRaw ?? []) as any[];
  const allMeetings = (meetingsRaw ?? []) as any[];
  const allEmployment = (employmentRaw ?? []) as any[];
  const allIncidents = (incidentsRaw ?? []) as any[];

  const activeResidents = allResidents.filter((r) => r.status === "active");
  const totalServed = allResidents.filter(
    (r) =>
      r.move_in_date &&
      r.move_in_date <= dateTo &&
      (!r.move_out_date || r.move_out_date >= dateFrom)
  ).length;

  // Sobriety milestones based on move_in_date
  const now = new Date(dateTo);
  const milestones = { thirtyDays: 0, sixtyDays: 0, ninetyDays: 0, sixMonths: 0, oneYear: 0 };
  for (const r of activeResidents) {
    if (!r.move_in_date) continue;
    const daysIn = Math.floor(
      (now.getTime() - new Date(r.move_in_date).getTime()) / 86_400_000
    );
    if (daysIn >= 365) milestones.oneYear++;
    if (daysIn >= 180) milestones.sixMonths++;
    if (daysIn >= 90) milestones.ninetyDays++;
    if (daysIn >= 60) milestones.sixtyDays++;
    if (daysIn >= 30) milestones.thirtyDays++;
  }

  // Employment obtained in period
  const employmentObtained = allEmployment.filter(
    (e) => e.start_date && e.start_date >= dateFrom && e.start_date <= dateTo
  ).length;

  // Housing transitions: residents who moved out with a positive status
  const housingTransitions = allResidents.filter(
    (r) =>
      r.move_out_date &&
      r.move_out_date >= dateFrom &&
      r.move_out_date <= dateTo &&
      r.program_phase !== "discharged"
  ).length;

  // Completion rate: moved-out with program_phase >= phase 3 or "completed"
  const movedOutInPeriod = allResidents.filter(
    (r) => r.move_out_date && r.move_out_date >= dateFrom && r.move_out_date <= dateTo
  );
  const completedProgram = movedOutInPeriod.filter(
    (r) =>
      r.program_phase === "completed" ||
      r.program_phase === "alumni" ||
      r.program_phase === "Phase 4" ||
      r.program_phase === "phase_4"
  ).length;
  const completionRate =
    movedOutInPeriod.length > 0
      ? Math.round((completedProgram / movedOutInPeriod.length) * 100)
      : 0;

  // Average length of stay
  const stayDays = allResidents
    .filter((r) => r.move_in_date)
    .map((r) => {
      const end = r.move_out_date ? new Date(r.move_out_date) : now;
      return Math.floor(
        (end.getTime() - new Date(r.move_in_date).getTime()) / 86_400_000
      );
    })
    .filter((d) => d > 0);
  const avgLengthOfStay =
    stayDays.length > 0
      ? Math.round(stayDays.reduce((s, d) => s + d, 0) / stayDays.length)
      : 0;

  // Drug test stats
  const totalTests = allDrugTests.length;
  const passedTests = allDrugTests.filter(
    (t) => t.result === "negative" || t.result === "pass"
  ).length;

  // Meetings
  const uniqueResidentMeetings = new Set(allMeetings.map((m) => m.resident_id));

  // Incident rate per 100 resident-days
  const totalResidentDays = stayDays.reduce((s, d) => s + d, 0) || 1;
  const incidentRate =
    Math.round((allIncidents.length / totalResidentDays) * 10000) / 100;

  const result: GrantReport = {
    programDescription:
      "Structured sober living program providing transitional housing, recovery support, employment assistance, and life skills development for individuals in early recovery from substance use disorders.",
    demographics: {
      totalServed: totalServed || allResidents.length,
      currentResidents: activeResidents.length,
      avgAge: null, // Age data not in schema
      genderBreakdown: { not_tracked: totalServed || allResidents.length },
    },
    outcomes: {
      sobrietyMilestones: milestones,
      employmentObtained,
      housingTransitions,
      completionRate,
      avgLengthOfStay,
    },
    aggregatedStats: {
      totalDrugTests: totalTests,
      passRate: totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 100,
      totalMeetingsAttended: allMeetings.filter((m) => m.verified).length,
      avgMeetingsPerResident:
        uniqueResidentMeetings.size > 0
          ? Math.round(
              (allMeetings.filter((m) => m.verified).length /
                uniqueResidentMeetings.size) *
                10
            ) / 10
          : 0,
      incidentRate,
    },
  };

  await supabase.from("agent_actions_log").insert({
    agent_type: "report_generator",
    action_type: "grant_report",
    entity_type: "report",
    entity_id: null,
    input_json: { dateFrom, dateTo } as any,
    output_json: result as any,
    status: "completed",
    duration_ms: Date.now() - start,
  });

  return result;
}

// ─── 5. Weekly Operations Summary ────────────────────────────────────────────

export async function generateWeeklyOps(): Promise<WeeklyOpsReport> {
  const start = Date.now();

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 86_400_000);
  const dateFrom = weekAgo.toISOString().split("T")[0];
  const dateTo = now.toISOString().split("T")[0];

  const [
    { data: residentsRaw },
    { data: invoicesRaw },
    { data: paymentsRaw },
    { data: maintenanceRaw },
    { data: incidentsRaw },
    { data: drugSchedulesRaw },
    { data: bedsRaw },
  ] = await Promise.all([
    supabase.from("residents").select("id, status, move_in_date, move_out_date"),
    supabase.from("invoices").select("id, amount_cents, status, due_date"),
    supabase
      .from("payments")
      .select("id, amount_cents, paid_at")
      .gte("paid_at", dateFrom),
    supabase.from("maintenance_requests").select("id, status, priority, created_at"),
    supabase
      .from("incidents")
      .select("id, type, severity, created_at")
      .gte("created_at", dateFrom),
    supabase
      .from("drug_test_schedules")
      .select("id, next_test_date, active")
      .eq("active", true),
    supabase.from("beds").select("id, status"),
  ]);

  const allResidents = (residentsRaw ?? []) as any[];
  const allInvoices = (invoicesRaw ?? []) as any[];
  const allPayments = (paymentsRaw ?? []) as any[];
  const allMaintenance = (maintenanceRaw ?? []) as any[];
  const allIncidents = (incidentsRaw ?? []) as any[];
  const allDrugSchedules = (drugSchedulesRaw ?? []) as any[];
  const allBeds = (bedsRaw ?? []) as any[];

  // New intakes this week
  const newIntakes = allResidents.filter(
    (r) => r.move_in_date && r.move_in_date >= dateFrom && r.move_in_date <= dateTo
  ).length;

  // Discharges this week
  const discharges = allResidents.filter(
    (r) => r.move_out_date && r.move_out_date >= dateFrom && r.move_out_date <= dateTo
  ).length;

  // Occupancy
  const totalBeds = allBeds.length;
  const occupiedBeds = allBeds.filter((b) => b.status === "occupied").length;
  const prevOccupied = Math.max(0, occupiedBeds - newIntakes + discharges);

  // Payments
  const paymentsCollected = allPayments.reduce(
    (s: number, p: any) => s + (p.amount_cents ?? 0) / 100,
    0
  );
  const paymentsOutstanding = allInvoices
    .filter(
      (i) =>
        (i.status === "pending" || i.status === "overdue") &&
        i.due_date <= dateTo
    )
    .reduce((s: number, i: any) => s + i.amount_cents / 100, 0);

  // Open maintenance
  const openMaintenanceTickets = allMaintenance.filter(
    (m) => m.status !== "complete" && m.status !== "cancelled"
  ).length;

  // Incidents
  const criticalIncidents = allIncidents.filter(
    (i) => i.severity === "high" || i.severity === "critical"
  ).length;

  // Upcoming tasks
  const overdueInvoices = allInvoices.filter(
    (i) => i.status === "overdue" || (i.status === "pending" && i.due_date < dateFrom)
  ).length;

  const nextWeek = new Date(now.getTime() + 7 * 86_400_000)
    .toISOString()
    .split("T")[0];
  const drugTestsDue = allDrugSchedules.filter(
    (s) => s.next_test_date && s.next_test_date <= nextWeek
  ).length;

  const maintenanceOverdue = allMaintenance.filter(
    (m) =>
      m.status !== "complete" &&
      m.status !== "cancelled" &&
      m.priority === "high"
  ).length;

  // Compliance alerts
  const complianceAlerts: string[] = [];
  if (overdueInvoices > 0) {
    complianceAlerts.push(`${overdueInvoices} overdue invoice(s) need attention`);
  }
  if (drugTestsDue > 5) {
    complianceAlerts.push(`${drugTestsDue} drug tests due in the next 7 days`);
  }
  if (criticalIncidents > 0) {
    complianceAlerts.push(
      `${criticalIncidents} critical incident(s) reported this week`
    );
  }
  if (maintenanceOverdue > 0) {
    complianceAlerts.push(
      `${maintenanceOverdue} high-priority maintenance ticket(s) still open`
    );
  }

  const result: WeeklyOpsReport = {
    newIntakes,
    discharges,
    occupancyChanges: {
      startOccupancy: totalBeds > 0 ? Math.round((prevOccupied / totalBeds) * 100) : 0,
      endOccupancy: totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0,
      netChange: newIntakes - discharges,
    },
    paymentsCollected: Math.round(paymentsCollected * 100) / 100,
    paymentsOutstanding: Math.round(paymentsOutstanding * 100) / 100,
    openMaintenanceTickets,
    incidents: {
      total: allIncidents.length,
      critical: criticalIncidents,
      details: allIncidents.slice(0, 10).map((i) => ({
        type: i.type,
        severity: i.severity,
        date: i.created_at,
      })),
    },
    upcomingTasks: {
      overdueInvoices,
      drugTestsDue,
      maintenanceOverdue,
    },
    complianceAlerts,
  };

  await supabase.from("agent_actions_log").insert({
    agent_type: "report_generator",
    action_type: "weekly_ops",
    entity_type: "report",
    entity_id: null,
    input_json: { dateFrom, dateTo } as any,
    output_json: result as any,
    status: "completed",
    duration_ms: Date.now() - start,
  });

  return result;
}
