-- Create resources table
CREATE TABLE public.resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  url TEXT,
  phone TEXT,
  address TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users full access to resources"
ON public.resources FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE INDEX idx_resources_category ON public.resources(category);
CREATE INDEX idx_resources_is_active ON public.resources(is_active);

CREATE TRIGGER update_resources_updated_at
  BEFORE UPDATE ON public.resources
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed with existing hardcoded resources
INSERT INTO public.resources (title, description, category, url, is_active) VALUES
  ('Downtown Phoenix AA', 'Daily meetings at 7 PM, beginner-friendly', 'AA Meetings', 'https://example.com/aa-phoenix', true),
  ('Phoenix NA Group', 'Monday, Wednesday, Friday at 6 PM', 'NA Meetings', 'https://example.com/na-phoenix', true),
  ('SMART Recovery Phoenix', 'Tuesday evenings, science-based approach', 'SMART Recovery', 'https://example.com/smart-phoenix', true),
  ('Local Job Resources', 'Employment assistance and job listings', 'Employment', 'https://example.com/employment', true),
  ('Community Counseling', 'Affordable therapy and counseling services', 'Mental Health', 'https://example.com/counseling', true),
  ('Public Transit Guide', 'Bus routes and schedules', 'Transportation', 'https://example.com/transit', true);
