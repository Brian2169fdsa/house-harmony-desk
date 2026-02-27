-- =============================================================
-- BATCH 1: Foundation — Audit Trail, RBAC, Drug Testing,
-- Recovery Tracking, Document Management, Emergency Protocols
-- =============================================================

-- ---------------------------------------------------------------
-- AUDIT TRAIL
-- ---------------------------------------------------------------
CREATE TABLE public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'INVITE', 'ROLE_CHANGE')),
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  old_value JSONB,
  new_value JSONB,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users to read audit_log"
  ON public.audit_log FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow service role to insert audit_log"
  ON public.audit_log FOR INSERT TO authenticated USING (true) WITH CHECK (true);

CREATE INDEX idx_audit_log_entity ON public.audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_log_user_id ON public.audit_log(user_id);
CREATE INDEX idx_audit_log_created_at ON public.audit_log(created_at DESC);

-- DB trigger function for automatic audit logging
CREATE OR REPLACE FUNCTION public.audit_trigger_fn()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_action TEXT;
  v_old JSONB;
  v_new JSONB;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_action := 'INSERT';
    v_old := NULL;
    v_new := to_jsonb(NEW);
  ELSIF TG_OP = 'UPDATE' THEN
    v_action := 'UPDATE';
    v_old := to_jsonb(OLD);
    v_new := to_jsonb(NEW);
  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'DELETE';
    v_old := to_jsonb(OLD);
    v_new := NULL;
  END IF;

  INSERT INTO public.audit_log (action, entity_type, entity_id, old_value, new_value)
  VALUES (
    v_action,
    TG_TABLE_NAME,
    COALESCE(
      (CASE WHEN TG_OP = 'DELETE' THEN OLD.id::TEXT ELSE NEW.id::TEXT END),
      ''
    ),
    v_old,
    v_new
  );

  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;

-- Apply audit triggers to key tables
CREATE TRIGGER audit_residents AFTER INSERT OR UPDATE OR DELETE ON public.residents
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_fn();

CREATE TRIGGER audit_incidents AFTER INSERT OR UPDATE OR DELETE ON public.incidents
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_fn();

CREATE TRIGGER audit_maintenance_requests AFTER INSERT OR UPDATE OR DELETE ON public.maintenance_requests
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_fn();

-- ---------------------------------------------------------------
-- ROLE-BASED ACCESS CONTROL
-- ---------------------------------------------------------------
CREATE TYPE public.staff_role AS ENUM (
  'owner',
  'regional_manager',
  'house_manager',
  'staff',
  'investor'
);

CREATE TABLE public.staff_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.staff_role NOT NULL DEFAULT 'staff',
  full_name TEXT NOT NULL DEFAULT '',
  phone TEXT,
  hire_date DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  house_id UUID REFERENCES public.houses(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

ALTER TABLE public.staff_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users full access to staff_profiles"
  ON public.staff_profiles FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE INDEX idx_staff_profiles_user_id ON public.staff_profiles(user_id);
CREATE INDEX idx_staff_profiles_role ON public.staff_profiles(role);

CREATE TRIGGER update_staff_profiles_updated_at
  BEFORE UPDATE ON public.staff_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.staff_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  role public.staff_role NOT NULL DEFAULT 'staff',
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.staff_invitations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users full access to staff_invitations"
  ON public.staff_invitations FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE INDEX idx_staff_invitations_email ON public.staff_invitations(email);
CREATE INDEX idx_staff_invitations_token ON public.staff_invitations(token);

-- ---------------------------------------------------------------
-- DRUG TESTING
-- ---------------------------------------------------------------
CREATE TABLE public.drug_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resident_id UUID NOT NULL REFERENCES public.residents(id) ON DELETE CASCADE,
  test_date DATE NOT NULL DEFAULT CURRENT_DATE,
  test_type TEXT NOT NULL DEFAULT 'screening' CHECK (test_type IN ('screening', 'random', 'dot', 'court_ordered', 'for_cause')),
  result TEXT NOT NULL DEFAULT 'pending' CHECK (result IN ('pass', 'fail', 'dilute', 'refused', 'pending')),
  administered_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.drug_tests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users full access to drug_tests"
  ON public.drug_tests FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE INDEX idx_drug_tests_resident_id ON public.drug_tests(resident_id);
CREATE INDEX idx_drug_tests_test_date ON public.drug_tests(test_date DESC);
CREATE INDEX idx_drug_tests_result ON public.drug_tests(result);

CREATE TABLE public.drug_test_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resident_id UUID NOT NULL REFERENCES public.residents(id) ON DELETE CASCADE,
  frequency TEXT NOT NULL DEFAULT 'weekly' CHECK (frequency IN ('daily', 'twice_weekly', 'three_times_weekly', 'weekly', 'biweekly', 'monthly')),
  last_test_date DATE,
  next_test_date DATE,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (resident_id)
);

ALTER TABLE public.drug_test_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users full access to drug_test_schedules"
  ON public.drug_test_schedules FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TRIGGER update_drug_test_schedules_updated_at
  BEFORE UPDATE ON public.drug_test_schedules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------------------------------------------------------------
-- RECOVERY PROGRAM TRACKING
-- ---------------------------------------------------------------
CREATE TABLE public.meeting_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resident_id UUID NOT NULL REFERENCES public.residents(id) ON DELETE CASCADE,
  meeting_type TEXT NOT NULL DEFAULT 'aa' CHECK (meeting_type IN ('aa', 'na', 'smart_recovery', 'church', 'celebrate_recovery', 'other')),
  meeting_date DATE NOT NULL DEFAULT CURRENT_DATE,
  meeting_name TEXT,
  verified BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.meeting_attendance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users full access to meeting_attendance"
  ON public.meeting_attendance FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE INDEX idx_meeting_attendance_resident_id ON public.meeting_attendance(resident_id);
CREATE INDEX idx_meeting_attendance_date ON public.meeting_attendance(meeting_date DESC);

CREATE TABLE public.court_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resident_id UUID NOT NULL REFERENCES public.residents(id) ON DELETE CASCADE,
  requirement_type TEXT NOT NULL,
  frequency TEXT,
  officer_name TEXT,
  officer_phone TEXT,
  officer_email TEXT,
  next_check_in_date DATE,
  notes TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.court_requirements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users full access to court_requirements"
  ON public.court_requirements FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE INDEX idx_court_requirements_resident_id ON public.court_requirements(resident_id);

CREATE TRIGGER update_court_requirements_updated_at
  BEFORE UPDATE ON public.court_requirements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.employment_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resident_id UUID NOT NULL REFERENCES public.residents(id) ON DELETE CASCADE,
  employer TEXT NOT NULL,
  position TEXT,
  start_date DATE,
  end_date DATE,
  hourly_rate NUMERIC(8,2),
  verified BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.employment_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users full access to employment_records"
  ON public.employment_records FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE INDEX idx_employment_records_resident_id ON public.employment_records(resident_id);

CREATE TRIGGER update_employment_records_updated_at
  BEFORE UPDATE ON public.employment_records
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.program_phase_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phase_number INTEGER NOT NULL UNIQUE,
  phase_name TEXT NOT NULL,
  min_days_required INTEGER NOT NULL DEFAULT 30,
  required_meetings_per_week INTEGER NOT NULL DEFAULT 3,
  required_tests_per_week INTEGER NOT NULL DEFAULT 2,
  curfew_time TIME,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.program_phase_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users full access to program_phase_rules"
  ON public.program_phase_rules FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Seed default program phases
INSERT INTO public.program_phase_rules (phase_number, phase_name, min_days_required, required_meetings_per_week, required_tests_per_week, curfew_time, description) VALUES
(1, 'Phase 1 — Foundation', 30, 5, 3, '21:00', 'Initial stabilization. Highest structure, most supervision.'),
(2, 'Phase 2 — Growth', 60, 4, 2, '22:00', 'Building routines. Employment search required.'),
(3, 'Phase 3 — Independence', 90, 3, 1, '23:00', 'Employment required. Increased autonomy.'),
(4, 'Phase 4 — Transition', 60, 2, 1, NULL, 'Preparing for independent living. Alumni mentorship.');

CREATE TRIGGER update_program_phase_rules_updated_at
  BEFORE UPDATE ON public.program_phase_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------------------------------------------------------------
-- DOCUMENT MANAGEMENT
-- ---------------------------------------------------------------
CREATE TABLE public.document_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'other' CHECK (category IN ('lease', 'house_rules', 'intake_form', 'incident_report', 'consent', 'other')),
  template_content TEXT NOT NULL DEFAULT '',
  variables_json JSONB DEFAULT '[]'::jsonb,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.document_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users full access to document_templates"
  ON public.document_templates FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TRIGGER update_document_templates_updated_at
  BEFORE UPDATE ON public.document_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.generated_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES public.document_templates(id) ON DELETE SET NULL,
  resident_id UUID REFERENCES public.residents(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  filled_content TEXT NOT NULL DEFAULT '',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  signed_at TIMESTAMP WITH TIME ZONE,
  signature_data TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.generated_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users full access to generated_documents"
  ON public.generated_documents FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE INDEX idx_generated_documents_resident_id ON public.generated_documents(resident_id);
CREATE INDEX idx_generated_documents_template_id ON public.generated_documents(template_id);

-- ---------------------------------------------------------------
-- EMERGENCY PROTOCOLS
-- ---------------------------------------------------------------
CREATE TABLE public.emergency_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resident_id UUID NOT NULL REFERENCES public.residents(id) ON DELETE CASCADE,
  contact_name TEXT NOT NULL,
  relationship TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  priority_order INTEGER NOT NULL DEFAULT 1,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.emergency_contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users full access to emergency_contacts"
  ON public.emergency_contacts FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE INDEX idx_emergency_contacts_resident_id ON public.emergency_contacts(resident_id);

CREATE TRIGGER update_emergency_contacts_updated_at
  BEFORE UPDATE ON public.emergency_contacts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.emergency_protocols (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  protocol_type TEXT NOT NULL CHECK (protocol_type IN ('overdose', 'fire', 'medical', 'missing_person', 'natural_disaster', 'violence', 'general')),
  title TEXT NOT NULL,
  steps_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  last_reviewed DATE,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (protocol_type)
);

ALTER TABLE public.emergency_protocols ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users full access to emergency_protocols"
  ON public.emergency_protocols FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Seed core protocols
INSERT INTO public.emergency_protocols (protocol_type, title, steps_json) VALUES
('overdose', 'Overdose Response Protocol', '[
  "Call 911 immediately. State address clearly.",
  "Administer Narcan (naloxone) if available — one spray in one nostril.",
  "Place person in recovery position (on their side) to prevent choking.",
  "Stay on the line with 911 and follow their instructions.",
  "Send someone outside to flag down paramedics.",
  "Clear the area of other residents.",
  "After EMS arrives, complete incident report within 2 hours.",
  "Notify house manager and owner immediately."
]'::jsonb),
('fire', 'Fire Emergency Protocol', '[
  "Activate the nearest fire alarm pull station.",
  "Call 911.",
  "Evacuate all residents immediately via nearest exit — do NOT use elevators.",
  "Account for all residents at the designated meeting point.",
  "Do NOT re-enter the building for any reason.",
  "Notify house manager and owner immediately.",
  "Complete incident report after the all-clear."
]'::jsonb),
('medical', 'Medical Emergency Protocol', '[
  "Assess the situation — is the person conscious and breathing?",
  "Call 911 if there is any doubt about severity.",
  "Administer first aid if trained to do so.",
  "Stay with the person until EMS arrives.",
  "Gather resident medication list if possible to give to paramedics.",
  "Notify emergency contacts.",
  "Complete incident report within 2 hours."
]'::jsonb);

CREATE TRIGGER update_emergency_protocols_updated_at
  BEFORE UPDATE ON public.emergency_protocols
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.emergency_supplies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  house_id UUID NOT NULL REFERENCES public.houses(id) ON DELETE CASCADE,
  supply_type TEXT NOT NULL CHECK (supply_type IN ('narcan', 'first_aid_kit', 'fire_extinguisher', 'aed', 'gloves', 'other')),
  quantity INTEGER NOT NULL DEFAULT 1,
  expiration_date DATE,
  location TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.emergency_supplies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users full access to emergency_supplies"
  ON public.emergency_supplies FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE INDEX idx_emergency_supplies_house_id ON public.emergency_supplies(house_id);

CREATE TRIGGER update_emergency_supplies_updated_at
  BEFORE UPDATE ON public.emergency_supplies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.emergency_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  house_id UUID NOT NULL REFERENCES public.houses(id) ON DELETE CASCADE,
  resident_id UUID REFERENCES public.residents(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  description TEXT NOT NULL,
  actions_taken TEXT,
  responders TEXT[],
  outcome TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.emergency_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users full access to emergency_events"
  ON public.emergency_events FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE INDEX idx_emergency_events_house_id ON public.emergency_events(house_id);
CREATE INDEX idx_emergency_events_created_at ON public.emergency_events(created_at DESC);
