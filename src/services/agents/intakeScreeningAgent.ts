import { supabase } from "@/integrations/supabase/client";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ScreeningResult = {
  leadId: string;
  fitScore: number;
  breakdown: ScoreBreakdown;
  flags: string[];
  recommendation: "approve" | "review" | "reject";
  recommendationReason: string;
};

export type ScoreBreakdown = {
  referralSourceQuality: number; // max 25
  contactCompleteness: number; // max 15
  geographicProximity: number; // max 10
  immediateAvailability: number; // max 15
  referralNotesSentiment: number; // max 20
  inquiryResponsiveness: number; // max 15
};

export type ScreeningQuestion = {
  id: string;
  question: string;
  type: "text" | "yes_no" | "date" | "select";
  options?: string[];
  required: boolean;
};

// ─── Default screening questions ──────────────────────────────────────────────

export const DEFAULT_SCREENING_QUESTIONS: ScreeningQuestion[] = [
  { id: "sobriety_date", question: "What is your sobriety date?", type: "date", required: true },
  { id: "medications", question: "Are you currently on any medications including MAT?", type: "yes_no", required: true },
  { id: "felony_convictions", question: "Do you have any felony convictions?", type: "yes_no", required: true },
  { id: "employment", question: "Are you currently employed or willing to seek employment?", type: "yes_no", required: true },
  { id: "valid_id", question: "Do you have a valid ID?", type: "yes_no", required: true },
  { id: "move_in_payment", question: "Can you pay first week's rent and deposit at move-in?", type: "yes_no", required: true },
  { id: "drug_testing", question: "Are you willing to submit to random drug testing?", type: "yes_no", required: true },
  { id: "referral_how", question: "How did you hear about us?", type: "text", required: false },
];

// ─── Referral source quality scoring ──────────────────────────────────────────

const REFERRAL_SCORES: Record<string, number> = {
  "treatment center": 25,
  "treatment": 25,
  "rehab": 25,
  "therapist": 22,
  "counselor": 22,
  "probation officer": 20,
  "parole": 20,
  "court": 18,
  "alumni": 23,
  "current resident": 22,
  "family": 15,
  "friend": 12,
  "google": 10,
  "website": 10,
  "facebook": 8,
  "social media": 8,
  "craigslist": 5,
  "walk-in": 7,
  "other": 8,
};

// ─── Scoring functions ────────────────────────────────────────────────────────

function scoreReferralSource(source: string | null): number {
  if (!source) return 5;
  const lower = source.toLowerCase();
  for (const [key, score] of Object.entries(REFERRAL_SCORES)) {
    if (lower.includes(key)) return score;
  }
  return 8; // default unknown source
}

function scoreContactCompleteness(lead: {
  name: string | null;
  phone: string | null;
  email: string | null;
}): number {
  let score = 0;
  if (lead.name && lead.name.trim().length > 2) score += 5;
  if (lead.phone && lead.phone.trim().length >= 10) score += 5;
  if (lead.email && lead.email.includes("@")) score += 5;
  return score;
}

function scoreGeographicProximity(): number {
  // Without actual geolocation, assign a moderate default
  return 7;
}

function scoreImmediateAvailability(lead: { created_at: string }): number {
  // More recent leads score higher — assume immediate need
  const ageHours = (Date.now() - new Date(lead.created_at).getTime()) / 3_600_000;
  if (ageHours < 24) return 15;
  if (ageHours < 72) return 12;
  if (ageHours < 168) return 8;
  return 5;
}

function scoreReferralNotesSentiment(source: string | null, notes?: string | null): number {
  if (!source && !notes) return 5;
  const text = `${source ?? ""} ${notes ?? ""}`.toLowerCase();

  let score = 10; // baseline

  // Positive indicators
  const positiveWords = ["motivated", "ready", "willing", "committed", "sober", "clean", "treatment", "recovery", "program", "recommended"];
  for (const word of positiveWords) {
    if (text.includes(word)) score += 2;
  }

  // Negative indicators
  const negativeWords = ["violent", "sex offender", "arson", "aggressive", "refused", "non-compliant", "danger"];
  for (const word of negativeWords) {
    if (text.includes(word)) score -= 5;
  }

  return Math.max(0, Math.min(20, score));
}

function scoreInquiryResponsiveness(lead: { created_at: string; updated_at: string }): number {
  // If the lead was updated after creation, they're responsive
  const created = new Date(lead.created_at).getTime();
  const updated = new Date(lead.updated_at).getTime();
  if (updated - created > 60_000) return 15; // had follow-up activity
  return 10; // default — just created
}

// ─── Flag detection ───────────────────────────────────────────────────────────

function detectFlags(
  lead: { referral_source: string | null },
  answers?: Record<string, string>
): string[] {
  const flags: string[] = [];
  const source = (lead.referral_source ?? "").toLowerCase();

  if (source.includes("sex offender")) flags.push("SEX_OFFENDER_REGISTRY");
  if (source.includes("violent")) flags.push("HISTORY_OF_VIOLENCE");

  if (answers) {
    if (answers.felony_convictions === "yes") flags.push("FELONY_CONVICTION");
    if (answers.medications === "yes") flags.push("MAT_MEDICATIONS");
    if (answers.valid_id === "no") flags.push("NO_VALID_ID");
    if (answers.move_in_payment === "no") flags.push("CANNOT_PAY_MOVE_IN");
    if (answers.drug_testing === "no") flags.push("REFUSES_DRUG_TESTING");
    if (answers.employment === "no") flags.push("UNEMPLOYED");
  }

  return flags;
}

// ─── Main scoring function ────────────────────────────────────────────────────

export function scoreLead(lead: {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  referral_source: string | null;
  created_at: string;
  updated_at: string;
  notes?: string | null;
}, answers?: Record<string, string>): ScreeningResult {
  const breakdown: ScoreBreakdown = {
    referralSourceQuality: scoreReferralSource(lead.referral_source),
    contactCompleteness: scoreContactCompleteness(lead),
    geographicProximity: scoreGeographicProximity(),
    immediateAvailability: scoreImmediateAvailability(lead),
    referralNotesSentiment: scoreReferralNotesSentiment(lead.referral_source, lead.notes),
    inquiryResponsiveness: scoreInquiryResponsiveness(lead),
  };

  const fitScore = Math.min(
    100,
    breakdown.referralSourceQuality +
    breakdown.contactCompleteness +
    breakdown.geographicProximity +
    breakdown.immediateAvailability +
    breakdown.referralNotesSentiment +
    breakdown.inquiryResponsiveness
  );

  const flags = detectFlags(lead, answers);

  // Hard reject flags
  const hardRejectFlags = ["SEX_OFFENDER_REGISTRY", "REFUSES_DRUG_TESTING"];
  const hasHardReject = flags.some((f) => hardRejectFlags.includes(f));

  let recommendation: "approve" | "review" | "reject";
  let recommendationReason: string;

  if (hasHardReject) {
    recommendation = "reject";
    recommendationReason = `Hard reject flag: ${flags.filter((f) => hardRejectFlags.includes(f)).join(", ")}`;
  } else if (fitScore >= 70 && flags.length === 0) {
    recommendation = "approve";
    recommendationReason = `High fit score (${fitScore}) with no flags — auto-advance recommended`;
  } else if (fitScore >= 70 && flags.length > 0) {
    recommendation = "review";
    recommendationReason = `Good fit score (${fitScore}) but ${flags.length} flag(s) require manual review`;
  } else if (fitScore >= 40) {
    recommendation = "review";
    recommendationReason = `Moderate fit score (${fitScore}) — manual screening recommended`;
  } else {
    recommendation = "reject";
    recommendationReason = `Low fit score (${fitScore}) — below minimum threshold`;
  }

  return {
    leadId: lead.id,
    fitScore,
    breakdown,
    flags,
    recommendation,
    recommendationReason,
  };
}

// ─── Persist screening result ─────────────────────────────────────────────────

export async function screenLead(
  lead: any,
  answers?: Record<string, string>,
  autoAdvanceThreshold = 70
): Promise<ScreeningResult> {
  const start = Date.now();
  const result = scoreLead(lead, answers);

  // Save to ai_screening_results
  await supabase.from("ai_screening_results").upsert({
    lead_id: lead.id,
    fit_score: result.fitScore,
    screening_answers_json: answers ?? null,
    flags: result.flags,
    agent_recommendation: result.recommendation,
    recommendation_reason: result.recommendationReason,
    screened_at: new Date().toISOString(),
  }, { onConflict: "lead_id" });

  // Auto-advance if approved
  if (result.recommendation === "approve" && result.fitScore >= autoAdvanceThreshold) {
    const currentStatus = lead.status;
    const nextStatus = currentStatus === "lead" ? "application" : currentStatus;
    if (nextStatus !== currentStatus) {
      await supabase
        .from("intake_leads")
        .update({ status: nextStatus, updated_at: new Date().toISOString() })
        .eq("id", lead.id);
    }
  }

  // Log action
  await supabase.from("agent_actions_log").insert({
    agent_type: "intake_screening",
    action_type: "screen_lead",
    entity_type: "intake_lead",
    entity_id: lead.id,
    input_json: { lead_name: lead.name, referral_source: lead.referral_source },
    output_json: result as any,
    status: result.recommendation === "approve" ? "completed" : "requires_approval",
    duration_ms: Date.now() - start,
  });

  return result;
}

// ─── Get agent config ─────────────────────────────────────────────────────────

export async function getScreeningConfig(): Promise<{
  enabled: boolean;
  autoAdvanceThreshold: number;
  autoRejectThreshold: number;
  questions: ScreeningQuestion[];
}> {
  const { data } = await supabase
    .from("agent_configurations")
    .select("enabled, config_json")
    .eq("agent_type", "intake_screening")
    .maybeSingle();

  const config = (data?.config_json ?? {}) as any;
  return {
    enabled: data?.enabled ?? false,
    autoAdvanceThreshold: config.auto_advance_threshold ?? 70,
    autoRejectThreshold: config.auto_reject_threshold ?? 30,
    questions: config.screening_questions
      ? config.screening_questions.map((q: string, i: number) => ({
          id: `q_${i}`,
          question: q,
          type: "text" as const,
          required: false,
        }))
      : DEFAULT_SCREENING_QUESTIONS,
  };
}
