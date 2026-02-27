import { supabase } from "@/integrations/supabase/client";

// ─── Types ────────────────────────────────────────────────────────────────────

export type CollectionStage =
  | "current"
  | "reminder_sent"
  | "overdue"
  | "escalated"
  | "formal_notice"
  | "discharge_review";

export type CollectionAction = {
  residentId: string;
  residentName: string;
  invoiceId: string;
  stage: CollectionStage;
  daysPastDue: number;
  amountCents: number;
  actionType: string;
  actionDescription: string;
  dueDate: string;
};

export type CollectionTimeline = {
  residentId: string;
  residentName: string;
  totalBalanceCents: number;
  oldestDueDays: number;
  stage: CollectionStage;
  actions: TimelineEntry[];
  snoozedUntil?: string | null;
};

export type TimelineEntry = {
  date: string;
  action: string;
  description: string;
  status: "completed" | "pending" | "skipped";
};

export type CollectionSummary = {
  totalResidentsInCollection: number;
  totalARCents: number;
  byStage: Record<CollectionStage, { count: number; totalCents: number }>;
  actions: CollectionAction[];
  timelines: CollectionTimeline[];
};

// ─── Stage determination ──────────────────────────────────────────────────────

function determineStage(daysPastDue: number): CollectionStage {
  if (daysPastDue <= -3) return "current"; // not yet due
  if (daysPastDue < 0) return "reminder_sent"; // within 3 days of due date
  if (daysPastDue === 0) return "reminder_sent"; // due today
  if (daysPastDue <= 3) return "overdue";
  if (daysPastDue <= 7) return "escalated";
  if (daysPastDue <= 14) return "formal_notice";
  return "discharge_review";
}

function getActionForStage(stage: CollectionStage, daysPastDue: number): { type: string; description: string } {
  switch (stage) {
    case "current":
      return { type: "none", description: "Payment not yet due" };
    case "reminder_sent":
      if (daysPastDue <= -3)
        return { type: "friendly_reminder", description: "Queue friendly reminder — payment due in 3 days" };
      if (daysPastDue === 0)
        return { type: "due_today", description: "Queue payment due today notification" };
      return { type: "friendly_reminder", description: "Friendly reminder sent" };
    case "overdue":
      return { type: "overdue_notice", description: "Queue overdue notice with late fee warning" };
    case "escalated":
      return { type: "escalate_manager", description: "Escalate to house manager with payment history" };
    case "formal_notice":
      return { type: "formal_notice", description: "Generate formal written notice, flag for admin review" };
    case "discharge_review":
      return { type: "discharge_review", description: "Recommend discharge review — full payment history" };
  }
}

function buildTimeline(daysPastDue: number, residentName: string): TimelineEntry[] {
  const now = new Date();
  const entries: TimelineEntry[] = [];

  const milestones = [
    { day: -3, action: "Friendly Reminder", desc: "Payment reminder sent" },
    { day: 0, action: "Due Today Notice", desc: "Payment due today notification" },
    { day: 1, action: "Overdue Notice", desc: "Overdue notice with late fee warning" },
    { day: 3, action: "Escalation", desc: "Escalated to house manager" },
    { day: 7, action: "Formal Notice", desc: "Formal written notice generated" },
    { day: 14, action: "Discharge Review", desc: "Discharge review recommended" },
  ];

  for (const m of milestones) {
    const date = new Date(now.getTime() - (daysPastDue - m.day) * 86_400_000);
    entries.push({
      date: date.toISOString(),
      action: m.action,
      description: m.desc,
      status: daysPastDue >= m.day ? "completed" : "pending",
    });
  }

  return entries;
}

// ─── Main scan function ───────────────────────────────────────────────────────

export async function scanPayments(): Promise<CollectionSummary> {
  const start = Date.now();

  // Fetch overdue and upcoming invoices with resident names
  const { data: invoices, error } = await supabase
    .from("invoices")
    .select("id, resident_id, house_id, amount_cents, due_date, status, residents(name)")
    .in("status", ["pending", "overdue", "partial"])
    .order("due_date", { ascending: true });

  if (error) throw error;

  const now = new Date();
  const actions: CollectionAction[] = [];
  const timelineMap = new Map<string, CollectionTimeline>();

  const byStage: Record<CollectionStage, { count: number; totalCents: number }> = {
    current: { count: 0, totalCents: 0 },
    reminder_sent: { count: 0, totalCents: 0 },
    overdue: { count: 0, totalCents: 0 },
    escalated: { count: 0, totalCents: 0 },
    formal_notice: { count: 0, totalCents: 0 },
    discharge_review: { count: 0, totalCents: 0 },
  };

  for (const inv of (invoices ?? []) as any[]) {
    const dueDate = new Date(inv.due_date);
    const daysPastDue = Math.floor((now.getTime() - dueDate.getTime()) / 86_400_000);
    const stage = determineStage(daysPastDue);
    const { type, description } = getActionForStage(stage, daysPastDue);
    const residentName = inv.residents?.name ?? "Unknown";
    const residentId = inv.resident_id ?? "unknown";

    byStage[stage].count++;
    byStage[stage].totalCents += inv.amount_cents ?? 0;

    if (type !== "none") {
      actions.push({
        residentId,
        residentName,
        invoiceId: inv.id,
        stage,
        daysPastDue,
        amountCents: inv.amount_cents ?? 0,
        actionType: type,
        actionDescription: description,
        dueDate: inv.due_date,
      });
    }

    // Aggregate into timeline per resident
    if (!timelineMap.has(residentId)) {
      timelineMap.set(residentId, {
        residentId,
        residentName,
        totalBalanceCents: 0,
        oldestDueDays: 0,
        stage: "current",
        actions: [],
      });
    }
    const tl = timelineMap.get(residentId)!;
    tl.totalBalanceCents += inv.amount_cents ?? 0;
    if (daysPastDue > tl.oldestDueDays) {
      tl.oldestDueDays = daysPastDue;
      tl.stage = stage;
    }
    tl.actions = buildTimeline(tl.oldestDueDays, residentName);
  }

  const summary: CollectionSummary = {
    totalResidentsInCollection: timelineMap.size,
    totalARCents: actions.reduce((s, a) => s + a.amountCents, 0),
    byStage,
    actions,
    timelines: Array.from(timelineMap.values()),
  };

  // Log agent run
  await supabase.from("agent_actions_log").insert({
    agent_type: "payment_collection",
    action_type: "daily_scan",
    entity_type: "invoices",
    input_json: { invoice_count: (invoices ?? []).length },
    output_json: {
      residents_in_collection: summary.totalResidentsInCollection,
      total_ar_cents: summary.totalARCents,
      actions_generated: actions.length,
    } as any,
    status: "completed",
    duration_ms: Date.now() - start,
  });

  return summary;
}

// ─── Snooze resident ──────────────────────────────────────────────────────────

export async function snoozeResident(
  residentId: string,
  reason: string,
  durationDays: number
): Promise<void> {
  const snoozedUntil = new Date(Date.now() + durationDays * 86_400_000).toISOString();

  await supabase.from("agent_actions_log").insert({
    agent_type: "payment_collection",
    action_type: "snooze_resident",
    entity_type: "resident",
    entity_id: residentId,
    input_json: { reason, duration_days: durationDays, snoozed_until: snoozedUntil },
    status: "completed",
  });
}
