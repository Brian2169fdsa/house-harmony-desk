-- Create chores table
CREATE TABLE public.chores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  house_id UUID REFERENCES public.houses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  assigned_to UUID REFERENCES public.residents(id) ON DELETE SET NULL,
  due_date DATE,
  frequency TEXT NOT NULL DEFAULT 'once' CHECK (frequency IN ('once', 'daily', 'weekly', 'monthly')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'overdue')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.chores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users full access to chores"
ON public.chores FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE INDEX idx_chores_house_id ON public.chores(house_id);
CREATE INDEX idx_chores_assigned_to ON public.chores(assigned_to);
CREATE INDEX idx_chores_status ON public.chores(status);
CREATE INDEX idx_chores_due_date ON public.chores(due_date);

CREATE TRIGGER update_chores_updated_at
  BEFORE UPDATE ON public.chores
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
