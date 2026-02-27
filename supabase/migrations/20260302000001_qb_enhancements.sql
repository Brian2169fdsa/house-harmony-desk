-- ============================================================
-- SYSTEM 1: QuickBooks enhancements + Agent infrastructure
-- ============================================================

-- Add missing columns to qb_connections
ALTER TABLE public.qb_connections
  ADD COLUMN IF NOT EXISTS is_connected    BOOLEAN      NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_sync_at    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS sync_errors     INTEGER      NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at      TIMESTAMPTZ  NOT NULL DEFAULT now();

-- ============================================================
-- Agent infrastructure tables (used by Systems 2-4)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.agent_actions_log (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_type    TEXT NOT NULL,
  action_type   TEXT NOT NULL,
  entity_id     UUID,
  entity_type   TEXT,
  input_json    JSONB,
  output_json   JSONB,
  status        TEXT NOT NULL DEFAULT 'success',
  error_message TEXT,
  duration_ms   INTEGER,
  triggered_by  UUID REFERENCES auth.users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agent_log_type_date
  ON public.agent_actions_log(agent_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_log_entity
  ON public.agent_actions_log(entity_id, agent_type);

ALTER TABLE public.agent_actions_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_manage_agent_log"
  ON public.agent_actions_log FOR ALL TO authenticated USING (true);


CREATE TABLE IF NOT EXISTS public.agent_configurations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_type  TEXT NOT NULL UNIQUE,
  enabled     BOOLEAN NOT NULL DEFAULT false,
  config_json JSONB NOT NULL DEFAULT '{}',
  updated_by  UUID REFERENCES auth.users(id),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.agent_configurations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_manage_agent_config"
  ON public.agent_configurations FOR ALL TO authenticated USING (true);

INSERT INTO public.agent_configurations (agent_type, enabled, config_json) VALUES
  ('maintenance_triage',    false, '{"auto_assign_vendor":true,"auto_set_priority":true,"cost_estimate_enabled":true}'),
  ('occupancy_optimizer',   false, '{"vacancy_alert_days":7,"min_occupancy_pct":70,"max_price_adj_pct":15,"forecast_days":90}'),
  ('report_generator',      false, '{"default_format":"pdf","schedule_enabled":false}'),
  ('communication_manager', false, '{"default_channel":"in_app","allow_sms":false,"allow_email":false}')
ON CONFLICT (agent_type) DO NOTHING;
