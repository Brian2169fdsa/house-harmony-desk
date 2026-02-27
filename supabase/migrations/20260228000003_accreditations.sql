-- Accreditation Tracker
-- Tracks certification status for Joint Commission, CARF, CARF ASAM LOC, NARR/AzRHA
-- and any other voluntary or required accreditations.

CREATE TABLE IF NOT EXISTS accreditations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  house_id UUID REFERENCES houses(id) ON DELETE SET NULL,

  -- Accreditation identity
  accreditation_type TEXT NOT NULL,
  -- 'narr_azrha' | 'carf' | 'carf_asam' | 'joint_commission' | 'adhs_slh' | 'adhs_bhrf' | 'other'
  accreditation_name TEXT NOT NULL,
  issuing_body TEXT NOT NULL,

  -- Status lifecycle
  status TEXT NOT NULL DEFAULT 'planning',
  -- 'planning' | 'applied' | 'in_review' | 'inspection_scheduled' | 'active' | 'expired' | 'denied' | 'withdrawn'

  -- Key dates
  applied_at DATE,
  issued_at DATE,
  expires_at DATE,
  renewal_due_at DATE,
  next_inspection_at DATE,

  -- Fees
  application_fee NUMERIC(10,2),
  annual_fee NUMERIC(10,2),
  fee_notes TEXT,

  -- Notes & evidence
  notes TEXT,
  certificate_url TEXT,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Accreditation prep checklist items
CREATE TABLE IF NOT EXISTS accreditation_prep_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  accreditation_id UUID REFERENCES accreditations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  -- 'pending' | 'in_progress' | 'completed' | 'na'
  due_date DATE,
  completed_at TIMESTAMPTZ,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE accreditations ENABLE ROW LEVEL SECURITY;
ALTER TABLE accreditation_prep_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "accreditations_user" ON accreditations
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "accreditation_prep_items_user" ON accreditation_prep_items
  USING (
    accreditation_id IN (
      SELECT id FROM accreditations WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    accreditation_id IN (
      SELECT id FROM accreditations WHERE user_id = auth.uid()
    )
  );
