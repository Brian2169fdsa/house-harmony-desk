-- Create vendors table
CREATE TABLE public.vendors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  website TEXT,
  discount_pct INTEGER DEFAULT 0,
  notes TEXT,
  is_trusted BOOLEAN DEFAULT true,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create services table
CREATE TABLE public.services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('plumbing','electrical','hvac','appliance','pest','cleaning','landscaping','locksmith','networking','painting','general')),
  default_sla_hours INTEGER DEFAULT 72,
  description TEXT
);

-- Create vendor_services junction table
CREATE TABLE public.vendor_services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  preferred BOOLEAN DEFAULT true,
  coverage_city TEXT DEFAULT 'Phoenix',
  coverage_zip TEXT
);

-- Create maintenance_requests table
CREATE TABLE public.maintenance_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  house_id UUID NOT NULL REFERENCES public.houses(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id),
  vendor_id UUID REFERENCES public.vendors(id),
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','complete','canceled')),
  requested_for_at TIMESTAMP WITH TIME ZONE,
  submitted_by_user_id UUID,
  contact_phone TEXT,
  attachments JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  cost_estimate_cents INTEGER
);

-- Add indexes
CREATE INDEX idx_maintenance_requests_status_house ON public.maintenance_requests(status, house_id);
CREATE INDEX idx_maintenance_requests_house_id ON public.maintenance_requests(house_id);
CREATE INDEX idx_vendor_services_vendor ON public.vendor_services(vendor_id);
CREATE INDEX idx_vendor_services_service ON public.vendor_services(service_id);

-- Enable RLS
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow authenticated users full access to vendors" ON public.vendors FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated users full access to services" ON public.services FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated users full access to vendor_services" ON public.vendor_services FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated users full access to maintenance_requests" ON public.maintenance_requests FOR ALL USING (true) WITH CHECK (true);

-- Add trigger for updated_at on vendors
CREATE TRIGGER update_vendors_updated_at
  BEFORE UPDATE ON public.vendors
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add trigger for updated_at on maintenance_requests
CREATE TRIGGER update_maintenance_requests_updated_at
  BEFORE UPDATE ON public.maintenance_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();