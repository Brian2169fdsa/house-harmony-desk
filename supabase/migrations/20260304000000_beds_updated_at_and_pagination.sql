-- Add updated_at to beds table for vacancy duration tracking
ALTER TABLE public.beds
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Trigger to auto-update updated_at on beds status change
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_beds_updated_at'
  ) THEN
    CREATE TRIGGER update_beds_updated_at
      BEFORE UPDATE ON public.beds
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END
$$;

-- Back-fill existing available beds: set updated_at to created_at
-- so they don't all show 0 days vacant
UPDATE public.beds
  SET updated_at = created_at
  WHERE status = 'available' AND updated_at = now();
