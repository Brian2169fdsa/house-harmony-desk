-- =============================================================
-- SYSTEM 3: Enhanced Maintenance with SLAs & Preventive Scheduling
-- SYSTEM 4: Staff Scheduling, Alumni Network & Marketing Analytics
-- SYSTEM 5: Notification Hub & Multi-Property Portfolio View
-- =============================================================

-- ─────────────────────────── SYSTEM 3 ────────────────────────
-- SLA rules per priority level
CREATE TABLE IF NOT EXISTS public.maintenance_sla_rules (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  priority         TEXT NOT NULL UNIQUE,
  response_hours   INTEGER NOT NULL,
  resolution_hours INTEGER NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.maintenance_sla_rules (priority, response_hours, resolution_hours) VALUES
  ('emergency', 4,   24),
  ('high',      24,  72),
  ('medium',    72,  168),
  ('low',       168, 336)
ON CONFLICT (priority) DO NOTHING;

ALTER TABLE public.maintenance_sla_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_view_sla_rules"   ON public.maintenance_sla_rules FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_manage_sla_rules" ON public.maintenance_sla_rules FOR ALL    TO authenticated USING (true);

-- Comment threads per maintenance request
CREATE TABLE IF NOT EXISTS public.maintenance_comments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id  UUID NOT NULL REFERENCES public.maintenance_requests(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES auth.users(id),
  comment     TEXT NOT NULL,
  is_internal BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_maint_comments_request ON public.maintenance_comments(request_id, created_at);

ALTER TABLE public.maintenance_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_manage_maint_comments" ON public.maintenance_comments FOR ALL TO authenticated USING (true);

-- File attachments per maintenance request
CREATE TABLE IF NOT EXISTS public.maintenance_attachments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id  UUID NOT NULL REFERENCES public.maintenance_requests(id) ON DELETE CASCADE,
  file_url    TEXT NOT NULL,
  file_name   TEXT NOT NULL,
  file_type   TEXT,
  uploaded_by UUID REFERENCES auth.users(id),
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.maintenance_attachments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_manage_maint_attach" ON public.maintenance_attachments FOR ALL TO authenticated USING (true);

-- Preventive maintenance recurring task schedules
CREATE TABLE IF NOT EXISTS public.preventive_schedules (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  house_id           UUID REFERENCES public.houses(id) ON DELETE CASCADE,
  task_name          TEXT NOT NULL,
  description        TEXT,
  frequency_days     INTEGER NOT NULL DEFAULT 90,
  last_completed     DATE,
  next_due           DATE NOT NULL,
  assigned_vendor_id UUID REFERENCES public.vendors(id),
  estimated_cost     NUMERIC(10,2),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_preventive_house_due ON public.preventive_schedules(house_id, next_due);

ALTER TABLE public.preventive_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_manage_preventive" ON public.preventive_schedules FOR ALL TO authenticated USING (true);

-- Itemized cost tracking per maintenance request
CREATE TABLE IF NOT EXISTS public.maintenance_costs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.maintenance_requests(id) ON DELETE CASCADE,
  cost_type  TEXT NOT NULL DEFAULT 'labor',  -- labor, parts, materials, travel, other
  amount     NUMERIC(10,2) NOT NULL,
  description TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.maintenance_costs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_manage_maint_costs" ON public.maintenance_costs FOR ALL TO authenticated USING (true);

-- Quarterly maintenance budget allocation per house
CREATE TABLE IF NOT EXISTS public.maintenance_budgets (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  house_id   UUID NOT NULL REFERENCES public.houses(id) ON DELETE CASCADE,
  quarter    INTEGER NOT NULL CHECK (quarter BETWEEN 1 AND 4),
  year       INTEGER NOT NULL,
  allocated  NUMERIC(10,2) NOT NULL DEFAULT 0,
  spent      NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (house_id, quarter, year)
);

ALTER TABLE public.maintenance_budgets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_manage_maint_budgets" ON public.maintenance_budgets FOR ALL TO authenticated USING (true);

-- Vendor ratings after job completion
CREATE TABLE IF NOT EXISTS public.vendor_ratings (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id  UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  request_id UUID REFERENCES public.maintenance_requests(id) ON DELETE SET NULL,
  rating     INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  feedback   TEXT,
  rated_by   UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.vendor_ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_manage_vendor_ratings" ON public.vendor_ratings FOR ALL TO authenticated USING (true);

-- ─────────────────────────── SYSTEM 4 ────────────────────────
-- Staff shift scheduling
CREATE TABLE IF NOT EXISTS public.staff_schedules (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  house_id   UUID NOT NULL REFERENCES public.houses(id) ON DELETE CASCADE,
  shift_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time   TIME NOT NULL,
  role       TEXT,
  notes      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_staff_schedules_date ON public.staff_schedules(shift_date, house_id);

ALTER TABLE public.staff_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_manage_staff_schedules" ON public.staff_schedules FOR ALL TO authenticated USING (true);

-- Clock-in / clock-out time entries
CREATE TABLE IF NOT EXISTS public.time_entries (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  house_id      UUID REFERENCES public.houses(id),
  clock_in      TIMESTAMPTZ NOT NULL DEFAULT now(),
  clock_out     TIMESTAMPTZ,
  break_minutes INTEGER NOT NULL DEFAULT 0,
  total_hours   NUMERIC(8,2),   -- set on clock-out
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_manage_time_entries" ON public.time_entries FOR ALL TO authenticated USING (true);

-- PTO / leave requests
CREATE TABLE IF NOT EXISTS public.pto_requests (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  start_date  DATE NOT NULL,
  end_date    DATE NOT NULL,
  pto_type    TEXT NOT NULL DEFAULT 'vacation',  -- vacation, sick, personal, bereavement
  status      TEXT NOT NULL DEFAULT 'pending',   -- pending, approved, denied
  notes       TEXT,
  approved_by UUID REFERENCES auth.users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.pto_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_manage_pto" ON public.pto_requests FOR ALL TO authenticated USING (true);

-- Alumni directory (opt-in post-discharge)
CREATE TABLE IF NOT EXISTS public.alumni_profiles (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resident_id       UUID NOT NULL REFERENCES public.residents(id) ON DELETE CASCADE UNIQUE,
  opt_in            BOOLEAN NOT NULL DEFAULT true,
  sober_date        DATE,
  current_city      TEXT,
  willing_to_mentor BOOLEAN NOT NULL DEFAULT false,
  contact_email     TEXT,
  contact_phone     TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.alumni_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_manage_alumni_profiles" ON public.alumni_profiles FOR ALL TO authenticated USING (true);

-- Alumni check-in log (30/60/90/180/365 day follow-ups)
CREATE TABLE IF NOT EXISTS public.alumni_checkins (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alumni_id         UUID NOT NULL REFERENCES public.alumni_profiles(id) ON DELETE CASCADE,
  checkin_date      DATE NOT NULL DEFAULT CURRENT_DATE,
  method            TEXT NOT NULL DEFAULT 'phone',  -- phone, text, email, in_person
  sobriety_confirmed BOOLEAN,
  employment_status TEXT,
  housing_status    TEXT,
  notes             TEXT,
  conducted_by      UUID REFERENCES auth.users(id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.alumni_checkins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_manage_alumni_checkins" ON public.alumni_checkins FOR ALL TO authenticated USING (true);

-- Mentorship pairings: alumni ↔ current resident
CREATE TABLE IF NOT EXISTS public.mentorship_pairs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alumni_id   UUID NOT NULL REFERENCES public.alumni_profiles(id) ON DELETE CASCADE,
  resident_id UUID NOT NULL REFERENCES public.residents(id) ON DELETE CASCADE,
  start_date  DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date    DATE,
  status      TEXT NOT NULL DEFAULT 'active',  -- active, completed, cancelled
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.mentorship_pairs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_manage_mentorship" ON public.mentorship_pairs FOR ALL TO authenticated USING (true);

-- Marketing channel definitions
CREATE TABLE IF NOT EXISTS public.marketing_channels (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  channel_type TEXT NOT NULL DEFAULT 'other',
  monthly_cost NUMERIC(10,2) NOT NULL DEFAULT 0,
  is_active    BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.marketing_channels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_manage_mktg_channels" ON public.marketing_channels FOR ALL TO authenticated USING (true);

-- Lead attribution: link intake_leads → marketing_channels
CREATE TABLE IF NOT EXISTS public.lead_attributions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id       UUID NOT NULL REFERENCES public.intake_leads(id) ON DELETE CASCADE,
  channel_id    UUID NOT NULL REFERENCES public.marketing_channels(id) ON DELETE CASCADE,
  campaign_name TEXT,
  cost          NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.lead_attributions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_manage_lead_attr" ON public.lead_attributions FOR ALL TO authenticated USING (true);

-- Seed default marketing channels
INSERT INTO public.marketing_channels (name, channel_type, monthly_cost, is_active) VALUES
  ('Google Ads',               'google_ads',       500, true),
  ('Facebook / Instagram',     'facebook',         300, true),
  ('Word of Mouth',            'word_of_mouth',      0, true),
  ('Treatment Center Referral','treatment_center',   0, true),
  ('Court / Probation',        'court',              0, true),
  ('SAMHSA Directory',         'directory',         50, true),
  ('Website Organic',          'website',            0, true),
  ('Alumni Referral',          'referral_partner',   0, true)
ON CONFLICT DO NOTHING;

-- ─────────────────────────── SYSTEM 5 ────────────────────────
-- Per-user notification channel preferences
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel    TEXT NOT NULL,   -- in_app, email, sms
  category   TEXT NOT NULL,   -- payments, maintenance, compliance, intake, general
  enabled    BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, channel, category)
);

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_manage_own_notif_prefs" ON public.notification_preferences FOR ALL TO authenticated USING (user_id = auth.uid());

-- Notification delivery log
CREATE TABLE IF NOT EXISTS public.notification_log (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel      TEXT NOT NULL,
  category     TEXT NOT NULL DEFAULT 'general',
  title        TEXT NOT NULL,
  body         TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'pending',  -- pending, sent, delivered, failed, read
  read_at      TIMESTAMPTZ,
  sent_at      TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notif_log_recipient ON public.notification_log(recipient_id, created_at DESC);

ALTER TABLE public.notification_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_view_own_notifs"   ON public.notification_log FOR SELECT TO authenticated USING (recipient_id = auth.uid());
CREATE POLICY "auth_insert_notifs"      ON public.notification_log FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "users_update_own_notifs" ON public.notification_log FOR UPDATE TO authenticated USING (recipient_id = auth.uid());

-- Reusable message templates with variable placeholders
CREATE TABLE IF NOT EXISTS public.message_templates (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT NOT NULL,
  category         TEXT NOT NULL,
  subject_template TEXT NOT NULL,
  body_template    TEXT NOT NULL,
  variables        TEXT[] NOT NULL DEFAULT '{}',
  is_system        BOOLEAN NOT NULL DEFAULT false,
  created_by       UUID REFERENCES auth.users(id),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_view_msg_templates"   ON public.message_templates FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_manage_msg_templates" ON public.message_templates FOR ALL    TO authenticated USING (true);

-- Seed system message templates
INSERT INTO public.message_templates (name, category, subject_template, body_template, variables, is_system) VALUES
  (
    'Payment Due Reminder', 'payments',
    'Payment Due: {{amount}} on {{due_date}}',
    E'Hi {{resident_name}},\n\nYour payment of {{amount}} is due on {{due_date}}. Please ensure payment is made on time to avoid late fees.\n\nThank you,\n{{facility_name}}',
    ARRAY['resident_name','amount','due_date','facility_name'], true
  ),
  (
    'Payment Overdue Notice', 'payments',
    'OVERDUE: Payment of {{amount}} was due {{due_date}}',
    E'Hi {{resident_name}},\n\nYour payment of {{amount}} was due on {{due_date}} and has not been received. A late fee may apply.\n\nPlease contact us immediately.\n\n{{facility_name}}',
    ARRAY['resident_name','amount','due_date','facility_name'], true
  ),
  (
    'Maintenance Request Update', 'maintenance',
    'Maintenance Update: {{ticket_title}}',
    E'Your maintenance request "{{ticket_title}}" has been updated to: {{status}}.\n\n{{notes}}\n\nThank you for your patience.',
    ARRAY['ticket_title','status','notes'], true
  ),
  (
    'Welcome to the House', 'general',
    'Welcome to {{house_name}}!',
    E'Welcome, {{resident_name}}!\n\nWe are glad to have you at {{house_name}}. Your room is {{room_number}}. Please review the house rules and let us know if you have any questions.\n\nYour house manager: {{manager_name}}\n\n{{facility_name}}',
    ARRAY['resident_name','house_name','room_number','manager_name','facility_name'], true
  ),
  (
    'Drug Test Scheduled', 'compliance',
    'Drug Test Scheduled for {{test_date}}',
    E'Hi {{resident_name}},\n\nYou have a drug test scheduled for {{test_date}} at {{test_time}}. Please be present at {{location}}.\n\n{{facility_name}}',
    ARRAY['resident_name','test_date','test_time','location','facility_name'], true
  ),
  (
    'Lease Renewal Notice', 'general',
    'Lease Renewal Notice — Action Required',
    E'Hi {{resident_name}},\n\nYour current lease at {{house_name}} expires on {{expiry_date}}. Please contact us by {{response_date}} to confirm your renewal.\n\nMonthly rate: {{monthly_rate}}\n\n{{facility_name}}',
    ARRAY['resident_name','house_name','expiry_date','response_date','monthly_rate','facility_name'], true
  )
ON CONFLICT DO NOTHING;
