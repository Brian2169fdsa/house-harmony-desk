-- ============================================================
-- SYSTEM 3: Drug Test enhancements (chain_of_custody, lab_name, cost)
-- SYSTEM 4: Recovery enhancements (sobriety_date, program_phase on residents)
-- ============================================================

-- System 3: Add columns to drug_tests table
ALTER TABLE public.drug_tests
  ADD COLUMN IF NOT EXISTS chain_of_custody BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS lab_name TEXT,
  ADD COLUMN IF NOT EXISTS cost DECIMAL(8,2);

-- System 4: Add sobriety tracking columns to residents table
ALTER TABLE public.residents
  ADD COLUMN IF NOT EXISTS sobriety_date DATE,
  ADD COLUMN IF NOT EXISTS program_phase INTEGER DEFAULT 1
    CHECK (program_phase IS NULL OR program_phase IN (1, 2, 3));

CREATE INDEX IF NOT EXISTS idx_residents_sobriety_date ON public.residents(sobriety_date);
CREATE INDEX IF NOT EXISTS idx_residents_program_phase ON public.residents(program_phase);
