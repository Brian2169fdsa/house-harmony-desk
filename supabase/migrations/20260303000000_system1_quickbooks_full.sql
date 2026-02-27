-- ============================================================
-- SYSTEM 1: QuickBooks Integration — Full Schema
-- ============================================================

-- Drop and recreate qb_connections with exact spec
CREATE TABLE IF NOT EXISTS public.qb_connections (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  realm_id                TEXT,
  company_name            TEXT,
  access_token_encrypted  TEXT,
  refresh_token_encrypted TEXT,
  token_expires_at        TIMESTAMPTZ,
  is_connected            BOOLEAN NOT NULL DEFAULT false,
  status                  TEXT NOT NULL DEFAULT 'disconnected',
  last_sync_at            TIMESTAMPTZ,
  sync_errors             INTEGER NOT NULL DEFAULT 0,
  last_refreshed_at       TIMESTAMPTZ,
  connected_at            TIMESTAMPTZ,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.qb_connections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth_manage_qb_connections" ON public.qb_connections;
CREATE POLICY "auth_manage_qb_connections"
  ON public.qb_connections FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- qb_account_mappings with direction enum
DO $$ BEGIN
  CREATE TYPE qb_direction AS ENUM ('income','expense','asset','liability');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.qb_account_mappings (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id    UUID REFERENCES public.qb_connections(id) ON DELETE CASCADE,
  user_id          UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  local_category   TEXT NOT NULL,
  qb_account_id    TEXT,
  qb_account_name  TEXT,
  qb_account_type  TEXT,
  direction        TEXT CHECK (direction IN ('income','expense','asset','liability')),
  is_active        BOOLEAN NOT NULL DEFAULT true,
  active           BOOLEAN NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, local_category)
);

ALTER TABLE public.qb_account_mappings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth_manage_qb_mappings" ON public.qb_account_mappings;
CREATE POLICY "auth_manage_qb_mappings"
  ON public.qb_account_mappings FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- qb_sync_mappings
DO $$ BEGIN
  CREATE TYPE qb_entity_type AS ENUM ('invoice','payment','expense','vendor_bill','deposit','journal_entry');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE qb_sync_status AS ENUM ('pending','synced','error','conflict');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.qb_sync_mappings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id   UUID REFERENCES public.qb_connections(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_type     TEXT NOT NULL,
  local_id        UUID NOT NULL,
  qb_id           TEXT,
  last_synced     TIMESTAMPTZ,
  last_synced_at  TIMESTAMPTZ,
  sync_status     TEXT NOT NULL DEFAULT 'pending',
  error_message   TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_qb_sync_mappings_user
  ON public.qb_sync_mappings(user_id, entity_type);

ALTER TABLE public.qb_sync_mappings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth_manage_qb_sync_mappings" ON public.qb_sync_mappings;
CREATE POLICY "auth_manage_qb_sync_mappings"
  ON public.qb_sync_mappings FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- qb_sync_log
CREATE TABLE IF NOT EXISTS public.qb_sync_log (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id    UUID REFERENCES public.qb_connections(id) ON DELETE SET NULL,
  user_id          UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_type      TEXT,
  direction        TEXT CHECK (direction IN ('push','pull')),
  operation        TEXT,
  local_id         UUID,
  qb_id            TEXT,
  entity_id        TEXT,
  status           TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('success','error','conflict','skipped','pending')),
  error_message    TEXT,
  request_payload  JSONB,
  response_payload JSONB,
  payload_json     JSONB,
  duration_ms      INTEGER,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_qb_sync_log_user
  ON public.qb_sync_log(user_id, created_at DESC);

ALTER TABLE public.qb_sync_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth_manage_qb_sync_log" ON public.qb_sync_log;
CREATE POLICY "auth_manage_qb_sync_log"
  ON public.qb_sync_log FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
