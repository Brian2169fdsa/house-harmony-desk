-- Goal A: Intake & Waitlist Tables

-- Create intake_leads table
CREATE TABLE public.intake_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  referral_source TEXT,
  status TEXT NOT NULL DEFAULT 'lead',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create applications table
CREATE TABLE public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.intake_leads(id) ON DELETE CASCADE,
  answers_json JSONB,
  status TEXT NOT NULL DEFAULT 'submitted',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create offers table
CREATE TABLE public.offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.intake_leads(id) ON DELETE CASCADE,
  bed_id UUID REFERENCES public.beds(id) ON DELETE SET NULL,
  deposit_amount NUMERIC,
  expires_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add columns to residents table
ALTER TABLE public.residents ADD COLUMN IF NOT EXISTS program_phase TEXT;

-- Enable RLS
ALTER TABLE public.intake_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for intake_leads
CREATE POLICY "Allow authenticated users full access to intake_leads"
ON public.intake_leads FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- RLS Policies for applications
CREATE POLICY "Allow authenticated users full access to applications"
ON public.applications FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- RLS Policies for offers
CREATE POLICY "Allow authenticated users full access to offers"
ON public.offers FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Indexes
CREATE INDEX idx_intake_leads_status ON public.intake_leads(status);
CREATE INDEX idx_applications_lead_id ON public.applications(lead_id);
CREATE INDEX idx_offers_lead_id ON public.offers(lead_id);
CREATE INDEX idx_offers_bed_id ON public.offers(bed_id);

-- Goal B: CRM Tables

-- Create crm_organizations first (no dependencies)
CREATE TABLE public.crm_organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'other',
  phone TEXT,
  email TEXT,
  website TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create crm_contacts
CREATE TABLE public.crm_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  role TEXT,
  segment TEXT NOT NULL DEFAULT 'other',
  status TEXT NOT NULL DEFAULT 'active',
  resident_id UUID REFERENCES public.residents(id) ON DELETE SET NULL,
  org_id UUID REFERENCES public.crm_organizations(id) ON DELETE SET NULL,
  source TEXT,
  owner_user_id UUID,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create crm_activities
CREATE TABLE public.crm_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID REFERENCES public.crm_contacts(id) ON DELETE CASCADE,
  org_id UUID REFERENCES public.crm_organizations(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT,
  due_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create crm_referrals
CREATE TABLE public.crm_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES public.crm_contacts(id) ON DELETE CASCADE,
  referred_person_name TEXT NOT NULL,
  referred_phone TEXT,
  referred_email TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  intake_lead_id UUID REFERENCES public.intake_leads(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create crm_lists
CREATE TABLE public.crm_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  filter_json JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for CRM tables
ALTER TABLE public.crm_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_lists ENABLE ROW LEVEL SECURITY;

-- RLS Policies for crm_organizations
CREATE POLICY "Allow authenticated users full access to crm_organizations"
ON public.crm_organizations FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- RLS Policies for crm_contacts
CREATE POLICY "Allow authenticated users full access to crm_contacts"
ON public.crm_contacts FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- RLS Policies for crm_activities
CREATE POLICY "Allow authenticated users full access to crm_activities"
ON public.crm_activities FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- RLS Policies for crm_referrals
CREATE POLICY "Allow authenticated users full access to crm_referrals"
ON public.crm_referrals FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- RLS Policies for crm_lists
CREATE POLICY "Allow authenticated users full access to crm_lists"
ON public.crm_lists FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Indexes for CRM tables
CREATE INDEX idx_crm_contacts_segment ON public.crm_contacts(segment);
CREATE INDEX idx_crm_contacts_status ON public.crm_contacts(status);
CREATE INDEX idx_crm_contacts_owner_user_id ON public.crm_contacts(owner_user_id);
CREATE INDEX idx_crm_contacts_org_id ON public.crm_contacts(org_id);
CREATE INDEX idx_crm_contacts_resident_id ON public.crm_contacts(resident_id);
CREATE INDEX idx_crm_activities_contact_id ON public.crm_activities(contact_id);
CREATE INDEX idx_crm_activities_org_id ON public.crm_activities(org_id);
CREATE INDEX idx_crm_referrals_contact_id ON public.crm_referrals(contact_id);
CREATE INDEX idx_crm_referrals_status ON public.crm_referrals(status);

-- Trigger function for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to all tables with updated_at
CREATE TRIGGER update_intake_leads_updated_at BEFORE UPDATE ON public.intake_leads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_offers_updated_at BEFORE UPDATE ON public.offers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_crm_organizations_updated_at BEFORE UPDATE ON public.crm_organizations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_crm_contacts_updated_at BEFORE UPDATE ON public.crm_contacts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_crm_activities_updated_at BEFORE UPDATE ON public.crm_activities
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_crm_referrals_updated_at BEFORE UPDATE ON public.crm_referrals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_crm_lists_updated_at BEFORE UPDATE ON public.crm_lists
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();