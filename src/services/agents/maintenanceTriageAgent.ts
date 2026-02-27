import { supabase } from "@/integrations/supabase/client";

// ─── Keyword Maps ─────────────────────────────────────────────────────────────

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  plumbing:    ["leak", "drip", "pipe", "faucet", "toilet", "water heater", "drain", "clog", "flood", "sewage", "water pressure", "plumbing"],
  electrical:  ["outlet", "switch", "breaker", "wiring", "light", "power out", "electric", "sparking", "circuit", "socket", "electrical"],
  hvac:        ["ac", "heating", "hvac", "thermostat", "air", "furnace", "heat", "cool", "vent", "filter", "air conditioner"],
  appliance:   ["fridge", "oven", "stove", "dishwasher", "washer", "dryer", "refrigerator", "microwave", "garbage disposal"],
  pest:        ["roach", "ant", "mouse", "rat", "bed bug", "termite", "bug", "pest", "insect", "cockroach", "spider"],
  cleaning:    ["mold", "carpet", "deep clean", "odor", "smell", "biohazard", "cleaning"],
  landscaping: ["lawn", "tree", "sprinkler", "fence", "yard", "grass", "weed", "garden", "irrigation"],
  locksmith:   ["lock", "key", "deadbolt", "door lock", "lockout", "entry", "locksmith"],
  networking:  ["wifi", "internet", "cable", "network", "router", "connection", "bandwidth"],
  painting:    ["paint", "drywall", "wall", "ceiling", "hole", "crack", "patch"],
};

const HIGH_PRIORITY_KEYWORDS = [
  "emergency", "flood", "fire", "gas leak", "no heat", "no water",
  "sewage", "sparking", "electrical spark", "carbon monoxide", "smoke",
  "burst pipe", "urgent", "immediately",
];
const MEDIUM_PRIORITY_KEYWORDS = [
  "broken", "not working", "leaking", "stuck", "won't", "wont",
  "doesn't", "doesnt", "stopped", "failed", "needs repair", "damaged",
];
const LOW_PRIORITY_KEYWORDS = [
  "cosmetic", "minor", "squeaky", "slow", "request", "would like",
  "when possible", "eventually", "sometime",
];

// ─── Types ────────────────────────────────────────────────────────────────────

export type TriageResult = {
  requestId: string;
  detectedCategory: string;
  categoryConfidence: "high" | "medium" | "low";
  categoryKeywordsMatched: string[];
  suggestedPriority: "high" | "medium" | "low";
  priorityReason: string;
  suggestedVendorId: string | null;
  suggestedVendorName: string | null;
  costEstimate: number | null;
  costEstimateBasis: string | null;
  slaDeadlineHours: number | null;
  slaDeadlineAt: string | null;
};

// ─── Pure Analysis Functions ───────────────────────────────────────────────────

export function detectCategory(text: string): {
  category: string;
  confidence: "high" | "medium" | "low";
  matched: string[];
} {
  const lower = text.toLowerCase();
  const scores: Record<string, string[]> = {};

  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    const matched = keywords.filter((kw) => lower.includes(kw));
    if (matched.length > 0) scores[cat] = matched;
  }

  if (Object.keys(scores).length === 0) {
    return { category: "general", confidence: "low", matched: [] };
  }

  const [category, matched] = Object.entries(scores).sort(
    ([, a], [, b]) => b.length - a.length
  )[0];

  const confidence: "high" | "medium" | "low" =
    matched.length >= 3 ? "high" : matched.length >= 2 ? "medium" : "low";

  return { category, confidence, matched };
}

export function detectPriority(text: string): {
  priority: "high" | "medium" | "low";
  reason: string;
} {
  const lower = text.toLowerCase();

  for (const kw of HIGH_PRIORITY_KEYWORDS) {
    if (lower.includes(kw))
      return { priority: "high", reason: `Emergency keyword: "${kw}"` };
  }
  for (const kw of MEDIUM_PRIORITY_KEYWORDS) {
    if (lower.includes(kw))
      return { priority: "medium", reason: `Urgency keyword: "${kw}"` };
  }
  for (const kw of LOW_PRIORITY_KEYWORDS) {
    if (lower.includes(kw))
      return { priority: "low", reason: `Minor/cosmetic keyword: "${kw}"` };
  }

  return { priority: "medium", reason: "Default — no urgency keywords detected" };
}

// ─── Async Lookup Functions ───────────────────────────────────────────────────

export async function findPreferredVendor(
  serviceCategory: string
): Promise<{ vendorId: string | null; vendorName: string | null }> {
  const { data: services } = await supabase
    .from("services")
    .select("id")
    .eq("category", serviceCategory);

  if (!services?.length) return { vendorId: null, vendorName: null };

  const serviceIds = services.map((s: any) => s.id);

  const { data: vendorServices } = await supabase
    .from("vendor_services")
    .select("vendor_id, vendors(id, name, is_trusted, active)")
    .in("service_id", serviceIds)
    .eq("preferred", true);

  if (!vendorServices?.length) return { vendorId: null, vendorName: null };

  const pick =
    (vendorServices as any[]).find(
      (vs) => vs.vendors?.is_trusted && vs.vendors?.active
    ) ?? (vendorServices as any[])[0];

  return {
    vendorId: pick?.vendors?.id ?? null,
    vendorName: pick?.vendors?.name ?? null,
  };
}

export async function estimateCost(serviceCategory: string): Promise<{
  estimate: number | null;
  basis: string | null;
}> {
  const { data: services } = await supabase
    .from("services")
    .select("id")
    .eq("category", serviceCategory);

  if (!services?.length) return { estimate: null, basis: null };

  const serviceIds = services.map((s: any) => s.id);

  const { data: requests } = await supabase
    .from("maintenance_requests")
    .select("id, maintenance_costs(amount)")
    .in("service_id", serviceIds)
    .eq("status", "complete");

  if (!requests?.length) return { estimate: null, basis: "No completed jobs found" };

  const costs: number[] = [];
  (requests as any[]).forEach((req) => {
    const jobTotal = (req.maintenance_costs ?? []).reduce(
      (s: number, c: any) => s + Number(c.amount),
      0
    );
    if (jobTotal > 0) costs.push(jobTotal);
  });

  if (!costs.length) return { estimate: null, basis: "No cost records on completed jobs" };

  const avg = costs.reduce((s, c) => s + c, 0) / costs.length;
  return {
    estimate: Math.round(avg),
    basis: `Average of ${costs.length} past ${serviceCategory} job${costs.length !== 1 ? "s" : ""}`,
  };
}

export async function getSLADeadline(priority: string): Promise<{
  hours: number | null;
  deadline: string | null;
}> {
  const { data: sla } = await supabase
    .from("maintenance_sla_rules")
    .select("response_hours")
    .eq("priority", priority)
    .maybeSingle();

  if (!sla) return { hours: null, deadline: null };

  const deadline = new Date(Date.now() + (sla as any).response_hours * 3_600_000);
  return { hours: (sla as any).response_hours, deadline: deadline.toISOString() };
}

// ─── Main Entry Point ─────────────────────────────────────────────────────────

export async function triageRequest(requestId: string): Promise<TriageResult | null> {
  const start = Date.now();

  const { data: request, error } = await supabase
    .from("maintenance_requests")
    .select("id, title, description, house_id, service_id, vendor_id, priority, status, services(name, category)")
    .eq("id", requestId)
    .maybeSingle();

  if (error || !request) return null;

  const text = `${(request as any).title} ${(request as any).description ?? ""}`;
  const serviceCategory = (request as any).services?.category ?? "general";

  // Run analysis
  const { category, confidence, matched } = detectCategory(text);
  const { priority, reason }              = detectPriority(text);
  const { vendorId, vendorName }          = await findPreferredVendor(category);
  const { estimate, basis }              = await estimateCost(category);
  const { hours, deadline }              = await getSLADeadline(priority);

  const result: TriageResult = {
    requestId,
    detectedCategory:         category,
    categoryConfidence:       confidence,
    categoryKeywordsMatched:  matched,
    suggestedPriority:        priority,
    priorityReason:           reason,
    suggestedVendorId:        vendorId,
    suggestedVendorName:      vendorName,
    costEstimate:             estimate,
    costEstimateBasis:        basis,
    slaDeadlineHours:         hours,
    slaDeadlineAt:            deadline,
  };

  // Auto-apply if no vendor/priority already set
  const updates: Record<string, unknown> = {};
  if (vendorId && !(request as any).vendor_id) updates.vendor_id = vendorId;
  if (Object.keys(updates).length > 0) {
    await supabase.from("maintenance_requests").update(updates).eq("id", requestId);
  }

  // Log to agent_actions_log
  await supabase.from("agent_actions_log").insert({
    agent_type:  "maintenance_triage",
    action_type: "triage_request",
    entity_id:   requestId,
    entity_type: "maintenance_request",
    input_json:  { title: (request as any).title, description: (request as any).description },
    output_json: result,
    status:      "success",
    duration_ms: Date.now() - start,
  });

  return result;
}
