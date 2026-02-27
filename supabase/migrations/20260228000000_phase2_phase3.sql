-- Phase 2: ROI Analytics & Investor/Lender Dashboard
-- Phase 3: QuickBooks API Integration

-- ============================================================
-- PHASE 2 TABLES
-- ============================================================

-- Monthly financial snapshots per house
CREATE TABLE IF NOT EXISTS public.financial_snapshots (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  house_id      UUID REFERENCES public.houses(id) ON DELETE CASCADE,
  month         DATE NOT NULL,  -- first day of the month (e.g. 2026-02-01)
  revenue       NUMERIC(12,2) NOT NULL DEFAULT 0,
  expenses      NUMERIC(12,2) NOT NULL DEFAULT 0,
  noi           NUMERIC(12,2) GENERATED ALWAYS AS (revenue - expenses) STORED,
  occupancy_rate NUMERIC(5,2),  -- 0.00 – 100.00
  total_beds    INTEGER,
  occupied_beds INTEGER,
  generated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_financial_snapshots_house_month
  ON public.financial_snapshots(house_id, month DESC);

ALTER TABLE public.financial_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view financial snapshots"
  ON public.financial_snapshots FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert financial snapshots"
  ON public.financial_snapshots FOR INSERT
  TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update financial snapshots"
  ON public.financial_snapshots FOR UPDATE
  TO authenticated USING (true);


-- Detailed expense records per house
CREATE TABLE IF NOT EXISTS public.expense_records (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  house_id    UUID REFERENCES public.houses(id) ON DELETE CASCADE,
  category    TEXT NOT NULL,  -- maintenance, utilities, insurance, mortgage, payroll, supplies, other
  amount      NUMERIC(12,2) NOT NULL,
  date        DATE NOT NULL,
  description TEXT,
  receipt_url TEXT,
  created_by  UUID REFERENCES auth.users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_expense_records_house_date
  ON public.expense_records(house_id, date DESC);

ALTER TABLE public.expense_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view expense records"
  ON public.expense_records FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert expense records"
  ON public.expense_records FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update expense records"
  ON public.expense_records FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete expense records"
  ON public.expense_records FOR DELETE TO authenticated USING (true);


-- Resident outcome / milestone tracking
CREATE TABLE IF NOT EXISTS public.resident_outcomes (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resident_id    UUID REFERENCES public.residents(id) ON DELETE CASCADE,
  milestone_type TEXT NOT NULL,  -- sobriety_30, sobriety_60, sobriety_90, sobriety_180, sobriety_365, employment, independent_housing, program_complete, relapse, readmission
  milestone_date DATE NOT NULL,
  notes          TEXT,
  created_by     UUID REFERENCES auth.users(id),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_resident_outcomes_resident
  ON public.resident_outcomes(resident_id, milestone_date DESC);

ALTER TABLE public.resident_outcomes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage resident outcomes"
  ON public.resident_outcomes FOR ALL TO authenticated USING (true);


-- Alumni follow-up check-ins
CREATE TABLE IF NOT EXISTS public.alumni_followups (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resident_id     UUID REFERENCES public.residents(id) ON DELETE CASCADE,
  followup_date   DATE NOT NULL,
  status          TEXT NOT NULL DEFAULT 'scheduled',  -- scheduled, completed, missed, cancelled
  employment      TEXT,   -- employed, unemployed, unknown
  housing         TEXT,   -- independent, sober_living, family, homeless, other, unknown
  sobriety_status TEXT,   -- maintained, relapsed, unknown
  notes           TEXT,
  conducted_by    UUID REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_alumni_followups_resident
  ON public.alumni_followups(resident_id, followup_date DESC);

ALTER TABLE public.alumni_followups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage alumni followups"
  ON public.alumni_followups FOR ALL TO authenticated USING (true);


-- Investor account linkages (user → houses they can view)
CREATE TABLE IF NOT EXISTS public.investor_accounts (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  access_level     TEXT NOT NULL DEFAULT 'read_only',  -- read_only, limited, full
  linked_house_ids UUID[] NOT NULL DEFAULT '{}',
  notes            TEXT,
  created_by       UUID REFERENCES auth.users(id),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_investor_accounts_user
  ON public.investor_accounts(user_id);

ALTER TABLE public.investor_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners can manage investor accounts"
  ON public.investor_accounts FOR ALL TO authenticated USING (true);
CREATE POLICY "Investors can view own account"
  ON public.investor_accounts FOR SELECT TO authenticated
  USING (user_id = auth.uid());


-- Portfolio-level aggregated snapshots (all houses combined)
CREATE TABLE IF NOT EXISTS public.portfolio_metrics (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date  DATE NOT NULL,
  total_beds     INTEGER NOT NULL DEFAULT 0,
  occupied_beds  INTEGER NOT NULL DEFAULT 0,
  total_revenue  NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_expenses NUMERIC(12,2) NOT NULL DEFAULT 0,
  noi            NUMERIC(12,2) GENERATED ALWAYS AS (total_revenue - total_expenses) STORED,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_portfolio_metrics_date
  ON public.portfolio_metrics(snapshot_date DESC);

ALTER TABLE public.portfolio_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view portfolio metrics"
  ON public.portfolio_metrics FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert portfolio metrics"
  ON public.portfolio_metrics FOR INSERT TO authenticated WITH CHECK (true);


-- Financial projection / what-if scenarios
CREATE TABLE IF NOT EXISTS public.projection_scenarios (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  assumptions_json JSONB NOT NULL DEFAULT '{}',
  results_json    JSONB NOT NULL DEFAULT '{}',
  created_by      UUID REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.projection_scenarios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own projection scenarios"
  ON public.projection_scenarios FOR ALL TO authenticated
  USING (created_by = auth.uid() OR created_by IS NULL);


-- ============================================================
-- PHASE 3 TABLES: QuickBooks Integration
-- ============================================================

-- QuickBooks OAuth2 connection per operator account
CREATE TABLE IF NOT EXISTS public.qb_connections (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  realm_id                 TEXT NOT NULL,         -- QB company ID
  company_name             TEXT,
  access_token_encrypted   TEXT NOT NULL,
  refresh_token_encrypted  TEXT NOT NULL,
  expires_at               TIMESTAMPTZ NOT NULL,
  refresh_expires_at       TIMESTAMPTZ,
  scope                    TEXT,
  connected_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_refreshed_at        TIMESTAMPTZ,
  status                   TEXT NOT NULL DEFAULT 'active',  -- active, expired, disconnected, error
  error_message            TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_qb_connections_user
  ON public.qb_connections(user_id);

ALTER TABLE public.qb_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own QB connections"
  ON public.qb_connections FOR ALL TO authenticated
  USING (user_id = auth.uid());


-- Mapping between local entities and QuickBooks IDs
CREATE TABLE IF NOT EXISTS public.qb_sync_mappings (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_type  TEXT NOT NULL,  -- invoice, payment, expense, deposit, vendor_bill, resident, vendor
  local_id     TEXT NOT NULL,
  qb_id        TEXT NOT NULL,
  qb_doc_number TEXT,
  last_synced  TIMESTAMPTZ NOT NULL DEFAULT now(),
  sync_status  TEXT NOT NULL DEFAULT 'synced',  -- synced, pending, error
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_qb_sync_mappings_entity
  ON public.qb_sync_mappings(user_id, entity_type, local_id);

CREATE INDEX IF NOT EXISTS idx_qb_sync_mappings_user
  ON public.qb_sync_mappings(user_id, entity_type);

ALTER TABLE public.qb_sync_mappings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own QB sync mappings"
  ON public.qb_sync_mappings FOR ALL TO authenticated
  USING (user_id = auth.uid());


-- Audit log for every QB sync operation
CREATE TABLE IF NOT EXISTS public.qb_sync_log (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_type   TEXT NOT NULL,
  entity_id     TEXT,
  direction     TEXT NOT NULL,  -- push (local→QB), pull (QB→local)
  operation     TEXT NOT NULL,  -- create, update, delete, read
  status        TEXT NOT NULL,  -- success, error, conflict, skipped
  qb_id         TEXT,
  error_message TEXT,
  payload_json  JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_qb_sync_log_user_date
  ON public.qb_sync_log(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_qb_sync_log_status
  ON public.qb_sync_log(user_id, status, created_at DESC);

ALTER TABLE public.qb_sync_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own QB sync log"
  ON public.qb_sync_log FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "System can insert QB sync log"
  ON public.qb_sync_log FOR INSERT TO authenticated WITH CHECK (true);


-- Mapping between local expense categories and QuickBooks chart of accounts
CREATE TABLE IF NOT EXISTS public.qb_account_mappings (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  local_category   TEXT NOT NULL,  -- rent, program_fees, application_fees, late_fees, maintenance, utilities, insurance, mortgage, payroll, supplies, deposits
  qb_account_id    TEXT NOT NULL,
  qb_account_name  TEXT NOT NULL,
  qb_account_type  TEXT,           -- Income, Expense, Asset, Liability
  active           BOOLEAN NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_qb_account_mappings_user_category
  ON public.qb_account_mappings(user_id, local_category);

ALTER TABLE public.qb_account_mappings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own QB account mappings"
  ON public.qb_account_mappings FOR ALL TO authenticated
  USING (user_id = auth.uid());


-- ============================================================
-- SEED: default chart-of-accounts category labels
-- (these are display-only reference data, not QB specific)
-- ============================================================

-- No seed data needed — the UI will guide operators through mapping
-- their existing QB accounts to these local categories.

-- ============================================================
-- UPDATED_AT triggers
-- ============================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_projection_scenarios_updated_at'
  ) THEN
    CREATE TRIGGER set_projection_scenarios_updated_at
      BEFORE UPDATE ON public.projection_scenarios
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_qb_account_mappings_updated_at'
  ) THEN
    CREATE TRIGGER set_qb_account_mappings_updated_at
      BEFORE UPDATE ON public.qb_account_mappings
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END;
$$;
