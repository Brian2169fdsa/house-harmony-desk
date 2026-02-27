-- ============================================================
-- Drop old payments table (simple schema) and replace with
-- proper invoices + payment_events schema
-- ============================================================
DROP TABLE IF EXISTS public.payments;

-- ============================================================
-- invoices: billing records per resident
-- ============================================================
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resident_id UUID REFERENCES public.residents(id) ON DELETE SET NULL,
  house_id UUID REFERENCES public.houses(id) ON DELETE SET NULL,
  amount_cents INTEGER NOT NULL,
  due_date DATE NOT NULL,
  paid_date DATE,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'paid', 'overdue', 'partial', 'void')),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users full access to invoices"
  ON public.invoices FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE INDEX idx_invoices_resident_id ON public.invoices(resident_id);
CREATE INDEX idx_invoices_house_id ON public.invoices(house_id);
CREATE INDEX idx_invoices_status ON public.invoices(status);
CREATE INDEX idx_invoices_due_date ON public.invoices(due_date);

CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- payments: individual payment events tied to an invoice
-- ============================================================
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE,
  amount_cents INTEGER NOT NULL,
  payment_method TEXT,
  reference_number TEXT,
  paid_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users full access to payments"
  ON public.payments FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE INDEX idx_payments_invoice_id ON public.payments(invoice_id);

-- ============================================================
-- notices: formal notices served to residents
-- ============================================================
CREATE TABLE public.notices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resident_id UUID REFERENCES public.residents(id) ON DELETE SET NULL,
  house_id UUID REFERENCES public.houses(id) ON DELETE SET NULL,
  type TEXT NOT NULL
    CHECK (type IN ('rent_notice', 'violation', 'lease_termination', 'general')),
  subject TEXT NOT NULL,
  body TEXT,
  served_date DATE,
  serve_method TEXT
    CHECK (serve_method IN ('in_person', 'email', 'posted')),
  response_deadline DATE,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'served', 'acknowledged', 'expired')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users full access to notices"
  ON public.notices FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE INDEX idx_notices_resident_id ON public.notices(resident_id);
CREATE INDEX idx_notices_house_id ON public.notices(house_id);
CREATE INDEX idx_notices_status ON public.notices(status);
CREATE INDEX idx_notices_type ON public.notices(type);

CREATE TRIGGER update_notices_updated_at
  BEFORE UPDATE ON public.notices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
