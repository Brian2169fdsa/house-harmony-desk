-- ============================================================
-- startup_wizards: track wizard sessions per user
-- startup_documents: generated policy documents
-- ============================================================

CREATE TABLE public.startup_wizards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  organization_name TEXT NOT NULL DEFAULT '',
  municipality TEXT NOT NULL DEFAULT 'phoenix',
  narr_level TEXT NOT NULL DEFAULT 'II'
    CHECK (narr_level IN ('I', 'II', 'III', 'IV')),
  current_step INTEGER NOT NULL DEFAULT 1,
  completed_steps INTEGER[] NOT NULL DEFAULT '{}',
  step_data JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'in_progress'
    CHECK (status IN ('in_progress', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.startup_wizards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own wizards"
  ON public.startup_wizards FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE INDEX idx_startup_wizards_user_id ON public.startup_wizards(user_id);
CREATE INDEX idx_startup_wizards_status ON public.startup_wizards(status);

CREATE TRIGGER update_startup_wizards_updated_at
  BEFORE UPDATE ON public.startup_wizards
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================

CREATE TABLE public.startup_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wizard_id UUID REFERENCES public.startup_wizards(id) ON DELETE CASCADE NOT NULL,
  document_type TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.startup_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage documents for their wizards"
  ON public.startup_documents FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.startup_wizards w
      WHERE w.id = wizard_id AND w.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.startup_wizards w
      WHERE w.id = wizard_id AND w.user_id = auth.uid()
    )
  );

CREATE INDEX idx_startup_documents_wizard_id ON public.startup_documents(wizard_id);
CREATE INDEX idx_startup_documents_type ON public.startup_documents(document_type);
