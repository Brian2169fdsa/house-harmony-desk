import { supabase } from "@/integrations/supabase/client";
import { addDays, isAfter, parseISO, differenceInDays } from "date-fns";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ComplianceLevel = "compliant" | "warning" | "violation";

export type ComplianceCategory = {
  name: string;
  level: ComplianceLevel;
  score: number; // 0-100
  items: ComplianceItem[];
};

export type ComplianceItem = {
  id: string;
  entityType: "resident" | "staff" | "house";
  entityId: string;
  entityName: string;
  issue: string;
  detail: string;
  level: ComplianceLevel;
};

export type ComplianceReport = {
  overallScore: number;
  categories: ComplianceCategory[];
  generatedAt: string;
};

// ─── Drug test compliance ─────────────────────────────────────────────────────

async function scanDrugTestCompliance(): Promise<ComplianceCategory> {
  const items: ComplianceItem[] = [];

  const [{ data: residents }, { data: drugTests }, { data: schedules }] = await Promise.all([
    supabase.from("residents").select("id, name, house_id").eq("status", "active"),
    supabase.from("drug_tests").select("resident_id, tested_at").order("tested_at", { ascending: false }),
    supabase.from("drug_test_schedules").select("resident_id, frequency_days, next_test_date"),
  ]);

  const allResidents = (residents ?? []) as any[];
  const allTests = (drugTests ?? []) as any[];
  const allSchedules = (schedules ?? []) as any[];
  const now = new Date();

  for (const resident of allResidents) {
    const schedule = allSchedules.find((s) => s.resident_id === resident.id);
    const latestTest = allTests.find((t) => t.resident_id === resident.id);
    const frequencyDays = schedule?.frequency_days ?? 14; // default biweekly

    if (!latestTest) {
      items.push({
        id: `dt-${resident.id}`,
        entityType: "resident",
        entityId: resident.id,
        entityName: resident.name,
        issue: "No drug test on record",
        detail: "Resident has never been tested",
        level: "violation",
      });
      continue;
    }

    const daysSinceTest = differenceInDays(now, parseISO(latestTest.tested_at));
    if (daysSinceTest > frequencyDays) {
      items.push({
        id: `dt-${resident.id}`,
        entityType: "resident",
        entityId: resident.id,
        entityName: resident.name,
        issue: "Drug test overdue",
        detail: `Last tested ${daysSinceTest} days ago (required every ${frequencyDays} days)`,
        level: daysSinceTest > frequencyDays * 1.5 ? "violation" : "warning",
      });
    }
  }

  const violationCount = items.filter((i) => i.level === "violation").length;
  const warningCount = items.filter((i) => i.level === "warning").length;
  const total = allResidents.length || 1;
  const compliantCount = total - violationCount - warningCount;
  const score = Math.round((compliantCount / total) * 100);

  return {
    name: "Drug Test Compliance",
    level: score >= 90 ? "compliant" : score >= 70 ? "warning" : "violation",
    score,
    items,
  };
}

// ─── Meeting attendance compliance ────────────────────────────────────────────

async function scanMeetingCompliance(): Promise<ComplianceCategory> {
  const items: ComplianceItem[] = [];

  const [{ data: residents }, { data: attendance }, { data: phaseRules }] = await Promise.all([
    supabase.from("residents").select("id, name, program_phase"),
    supabase.from("meeting_attendance")
      .select("resident_id, meeting_date")
      .gte("meeting_date", addDays(new Date(), -7).toISOString().split("T")[0]),
    supabase.from("program_phase_rules").select("phase_number, required_meetings_per_week"),
  ]);

  const allResidents = (residents ?? []) as any[];
  const allAttendance = (attendance ?? []) as any[];
  const rules = (phaseRules ?? []) as any[];

  for (const resident of allResidents) {
    const phase = resident.program_phase ?? 1;
    const rule = rules.find((r) => r.phase_number === phase);
    const requiredPerWeek = rule?.required_meetings_per_week ?? 3;

    const thisWeekCount = allAttendance.filter(
      (a) => a.resident_id === resident.id
    ).length;

    if (thisWeekCount < requiredPerWeek) {
      items.push({
        id: `mt-${resident.id}`,
        entityType: "resident",
        entityId: resident.id,
        entityName: resident.name,
        issue: "Below meeting requirement",
        detail: `${thisWeekCount}/${requiredPerWeek} meetings this week`,
        level: thisWeekCount === 0 ? "violation" : "warning",
      });
    }
  }

  const total = allResidents.length || 1;
  const compliantCount = total - items.length;
  const score = Math.round((compliantCount / total) * 100);

  return {
    name: "Meeting Attendance",
    level: score >= 90 ? "compliant" : score >= 70 ? "warning" : "violation",
    score,
    items,
  };
}

// ─── Staff certification compliance ───────────────────────────────────────────

async function scanCertificationCompliance(): Promise<ComplianceCategory> {
  const items: ComplianceItem[] = [];
  const now = new Date();
  const warningDate = addDays(now, 30);

  const [{ data: staff }, { data: certs }] = await Promise.all([
    supabase.from("staff_profiles").select("id, user_id, full_name").eq("status", "active"),
    supabase.from("lms_certificates").select("user_id, certificate_title, expires_at"),
  ]);

  const allStaff = (staff ?? []) as any[];
  const allCerts = (certs ?? []) as any[];

  for (const member of allStaff) {
    const staffCerts = allCerts.filter((c) => c.user_id === member.user_id);

    for (const cert of staffCerts) {
      if (!cert.expires_at) continue;
      const expiry = parseISO(cert.expires_at);

      if (isAfter(now, expiry)) {
        items.push({
          id: `cert-${member.id}-${cert.certificate_title}`,
          entityType: "staff",
          entityId: member.id,
          entityName: member.full_name,
          issue: "Certification expired",
          detail: `${cert.certificate_title} expired ${differenceInDays(now, expiry)} days ago`,
          level: "violation",
        });
      } else if (isAfter(warningDate, expiry)) {
        items.push({
          id: `cert-${member.id}-${cert.certificate_title}`,
          entityType: "staff",
          entityId: member.id,
          entityName: member.full_name,
          issue: "Certification expiring soon",
          detail: `${cert.certificate_title} expires in ${differenceInDays(expiry, now)} days`,
          level: "warning",
        });
      }
    }
  }

  const total = allStaff.length || 1;
  const violatedStaff = new Set(items.filter((i) => i.level === "violation").map((i) => i.entityId)).size;
  const score = Math.round(((total - violatedStaff) / total) * 100);

  return {
    name: "Staff Certifications",
    level: score >= 90 ? "compliant" : score >= 70 ? "warning" : "violation",
    score,
    items,
  };
}

// ─── Facility supply compliance ───────────────────────────────────────────────

async function scanSupplyCompliance(): Promise<ComplianceCategory> {
  const items: ComplianceItem[] = [];
  const now = new Date();
  const warningDate = addDays(now, 30);

  const { data: supplies } = await supabase
    .from("emergency_supplies")
    .select("id, house_id, supply_type, quantity, expiration_date, houses(name)");

  for (const supply of (supplies ?? []) as any[]) {
    if (!supply.expiration_date) continue;
    const expiry = parseISO(supply.expiration_date);
    const houseName = supply.houses?.name ?? "Unknown House";

    if (isAfter(now, expiry)) {
      items.push({
        id: `supply-${supply.id}`,
        entityType: "house",
        entityId: supply.house_id,
        entityName: houseName,
        issue: `${supply.supply_type} expired`,
        detail: `Expired ${differenceInDays(now, expiry)} days ago`,
        level: "violation",
      });
    } else if (isAfter(warningDate, expiry)) {
      items.push({
        id: `supply-${supply.id}`,
        entityType: "house",
        entityId: supply.house_id,
        entityName: houseName,
        issue: `${supply.supply_type} expiring soon`,
        detail: `Expires in ${differenceInDays(expiry, now)} days`,
        level: "warning",
      });
    }
  }

  const total = (supplies ?? []).length || 1;
  const violationCount = items.filter((i) => i.level === "violation").length;
  const score = Math.round(((total - violationCount) / total) * 100);

  return {
    name: "Facility Supplies",
    level: score >= 90 ? "compliant" : score >= 70 ? "warning" : "violation",
    score,
    items,
  };
}

// ─── Documentation compliance ─────────────────────────────────────────────────

async function scanDocumentationCompliance(): Promise<ComplianceCategory> {
  const items: ComplianceItem[] = [];

  const [{ data: residents }, { data: documents }, { data: contacts }] = await Promise.all([
    supabase.from("residents").select("id, name").eq("status", "active"),
    supabase.from("resident_documents").select("resident_id, doc_type"),
    supabase.from("emergency_contacts").select("resident_id"),
  ]);

  const allResidents = (residents ?? []) as any[];
  const allDocs = (documents ?? []) as any[];
  const allContacts = (contacts ?? []) as any[];

  const requiredDocs = ["signed_agreement", "intake_drug_test", "id_copy"];

  for (const resident of allResidents) {
    const resDocs = allDocs.filter((d) => d.resident_id === resident.id);
    const resDocTypes = new Set(resDocs.map((d) => d.doc_type));
    const hasEmergencyContact = allContacts.some((c) => c.resident_id === resident.id);

    const missing: string[] = [];
    for (const req of requiredDocs) {
      if (!resDocTypes.has(req)) missing.push(req);
    }
    if (!hasEmergencyContact) missing.push("emergency_contact");

    if (missing.length > 0) {
      items.push({
        id: `doc-${resident.id}`,
        entityType: "resident",
        entityId: resident.id,
        entityName: resident.name,
        issue: "Missing required documents",
        detail: `Missing: ${missing.join(", ").replace(/_/g, " ")}`,
        level: missing.length >= 3 ? "violation" : "warning",
      });
    }
  }

  const total = allResidents.length || 1;
  const compliantCount = total - items.length;
  const score = Math.round((compliantCount / total) * 100);

  return {
    name: "Documentation",
    level: score >= 90 ? "compliant" : score >= 70 ? "warning" : "violation",
    score,
    items,
  };
}

// ─── Main compliance scan ─────────────────────────────────────────────────────

export async function runComplianceScan(): Promise<ComplianceReport> {
  const start = Date.now();

  const categories = await Promise.all([
    scanDrugTestCompliance(),
    scanMeetingCompliance(),
    scanCertificationCompliance(),
    scanSupplyCompliance(),
    scanDocumentationCompliance(),
  ]);

  const overallScore = Math.round(
    categories.reduce((s, c) => s + c.score, 0) / categories.length
  );

  const report: ComplianceReport = {
    overallScore,
    categories,
    generatedAt: new Date().toISOString(),
  };

  // Log agent run
  await supabase.from("agent_actions_log").insert({
    agent_type: "compliance_monitor",
    action_type: "daily_scan",
    entity_type: "compliance",
    input_json: { categories_scanned: categories.length },
    output_json: {
      overall_score: overallScore,
      category_scores: categories.map((c) => ({ name: c.name, score: c.score, level: c.level })),
      total_violations: categories.reduce((s, c) => s + c.items.filter((i) => i.level === "violation").length, 0),
      total_warnings: categories.reduce((s, c) => s + c.items.filter((i) => i.level === "warning").length, 0),
    } as any,
    status: "completed",
    duration_ms: Date.now() - start,
  });

  return report;
}
