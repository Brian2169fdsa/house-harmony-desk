-- ============================================================
-- facility_settings: single-row config for the facility
-- ============================================================
CREATE TABLE public.facility_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_name TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  total_beds INTEGER DEFAULT 0,
  default_rent_amount NUMERIC(10,2) DEFAULT 0,
  deposit_cap NUMERIC(10,2) DEFAULT 0,
  auto_monthly_invoices BOOLEAN DEFAULT false,
  notification_payment_reminders BOOLEAN DEFAULT true,
  notification_incident_alerts BOOLEAN DEFAULT true,
  notification_daily_summary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Seed the single config row
INSERT INTO public.facility_settings (id, facility_name, address, total_beds)
VALUES ('00000000-0000-0000-0000-000000000001', '', '', 0);

ALTER TABLE public.facility_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users full access to facility_settings"
  ON public.facility_settings FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE TRIGGER update_facility_settings_updated_at
  BEFORE UPDATE ON public.facility_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- payments table
-- ============================================================
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resident_id UUID REFERENCES public.residents(id) ON DELETE SET NULL,
  resident_name TEXT,
  amount NUMERIC(10,2) NOT NULL,
  due_date DATE,
  paid_date DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users full access to payments"
  ON public.payments FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE INDEX idx_payments_resident_id ON public.payments(resident_id);
CREATE INDEX idx_payments_status ON public.payments(status);

CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- resident_documents table
-- ============================================================
CREATE TABLE public.resident_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resident_id UUID NOT NULL REFERENCES public.residents(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.resident_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users full access to resident_documents"
  ON public.resident_documents FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE INDEX idx_resident_documents_resident_id ON public.resident_documents(resident_id);
