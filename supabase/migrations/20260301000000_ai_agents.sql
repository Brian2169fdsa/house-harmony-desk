-- ============================================================
-- AI Agent Infrastructure — Phase 5
-- ============================================================

-- ── agent_configurations ────────────────────────────────────
CREATE TYPE agent_type_enum AS ENUM (
  'intake_screening',
  'payment_collection',
  'maintenance_triage',
  'compliance_monitor',
  'occupancy_optimizer',
  'report_generator',
  'assistant'
);

CREATE TABLE agent_configurations (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_type    agent_type_enum NOT NULL UNIQUE,
  display_name  text NOT NULL,
  description   text,
  enabled       boolean NOT NULL DEFAULT false,
  config_json   jsonb NOT NULL DEFAULT '{}',
  schedule_cron text,
  last_run_at   timestamptz,
  next_run_at   timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE agent_configurations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage agent_configurations"
  ON agent_configurations FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── agent_actions_log ────────────────────────────────────────
CREATE TYPE agent_action_status AS ENUM (
  'pending', 'running', 'completed', 'failed', 'requires_approval'
);

CREATE TABLE agent_actions_log (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_type    text NOT NULL,
  action_type   text NOT NULL,
  entity_type   text,
  entity_id     uuid,
  input_json    jsonb,
  output_json   jsonb,
  status        agent_action_status NOT NULL DEFAULT 'pending',
  approved_by   uuid REFERENCES auth.users,
  approved_at   timestamptz,
  error_message text,
  tokens_used   integer,
  duration_ms   integer,
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE agent_actions_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage agent_actions_log"
  ON agent_actions_log FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE INDEX agent_actions_log_agent_type_idx ON agent_actions_log (agent_type);
CREATE INDEX agent_actions_log_status_idx     ON agent_actions_log (status);
CREATE INDEX agent_actions_log_created_at_idx ON agent_actions_log (created_at DESC);

-- ── agent_conversations ──────────────────────────────────────
CREATE TABLE agent_conversations (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid REFERENCES auth.users,
  agent_type    text NOT NULL DEFAULT 'assistant',
  title         text,
  messages_json jsonb NOT NULL DEFAULT '[]',
  context_json  jsonb,
  is_archived   boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE agent_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own conversations"
  ON agent_conversations FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE INDEX agent_conversations_user_idx ON agent_conversations (user_id, updated_at DESC);

-- ── ai_screening_results ────────────────────────────────────
CREATE TABLE ai_screening_results (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id                 uuid REFERENCES intake_leads ON DELETE CASCADE,
  fit_score               integer CHECK (fit_score >= 0 AND fit_score <= 100),
  screening_answers_json  jsonb,
  flags                   text[],
  agent_recommendation    text CHECK (agent_recommendation IN ('approve', 'review', 'reject')),
  recommendation_reason   text,
  operator_override       text CHECK (operator_override IN ('approve', 'reject')),
  override_by             uuid REFERENCES auth.users,
  override_at             timestamptz,
  screened_at             timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE ai_screening_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage ai_screening_results"
  ON ai_screening_results FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE INDEX ai_screening_results_lead_idx ON ai_screening_results (lead_id);

-- ── Seed agent_configurations ────────────────────────────────
INSERT INTO agent_configurations (agent_type, display_name, description, enabled, config_json, schedule_cron) VALUES
  ('intake_screening',   'Intake Screening Agent',      'Automatically scores and screens new leads using configurable criteria', false, '{"auto_advance_threshold":70,"auto_reject_threshold":30,"screening_questions":["What is your sobriety date?","Are you currently on any medications including MAT?","Do you have any felony convictions?","Are you currently employed or willing to seek employment?","Do you have a valid ID?","Can you pay first week''s rent and deposit at move-in?","Are you willing to submit to random drug testing?","How did you hear about us?"]}', null),
  ('payment_collection', 'Payment Collection Agent',    'Manages payment follow-up sequences from friendly reminders to formal notices', false, '{"reminder_day_minus3":true,"reminder_day_0":true,"overdue_day_1":true,"escalate_day_3":true,"formal_notice_day_7":true,"discharge_review_day_14":true,"late_fee_amount_cents":2500}', '0 8 * * *'),
  ('maintenance_triage', 'Maintenance Triage Agent',    'Auto-categorizes, prioritizes, and dispatches maintenance requests to vendors', false, '{"auto_assign_vendor":true,"auto_set_priority":true,"emergency_keywords":["leak","flood","gas","fire","no heat","no hot water","broken window"],"high_priority_keywords":["hvac","heater","pest","mold","security"]}', null),
  ('compliance_monitor', 'Compliance Monitor Agent',    'Daily scans for drug test compliance, meeting attendance, and facility supply expirations', false, '{"drug_test_compliance":true,"meeting_compliance":true,"supply_expiration_days":30,"cert_expiration_days":30,"doc_compliance":true}', '0 6 * * *'),
  ('occupancy_optimizer','Occupancy Optimizer Agent',   'Analyzes vacancies and matches available leads to optimize bed occupancy', false, '{"vacancy_alert_threshold":0.80,"auto_reach_waitlist":true,"revenue_per_bed_per_day":35}', '0 9 * * *'),
  ('report_generator',   'Report Generator Agent',      'Generates weekly summaries, investor reports, and compliance audit packages', false, '{"weekly_summary":true,"monthly_investor_report":true,"compliance_package":false,"recipients":[]}', '0 7 * * 1'),
  ('assistant',          'Smart AI Assistant',          'Natural language interface for querying data, drafting communications, and taking actions', true,  '{"model":"claude-3-haiku","temperature":0.3,"system_prompt":"You are a sober living operations assistant with access to facility data. Help operators manage residents, payments, compliance, and incidents efficiently.","max_tokens":1000}', null);
