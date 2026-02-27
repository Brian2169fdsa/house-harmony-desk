-- Expense Tracking
-- Tracks operating expenses per house for P&L, ROI, and QuickBooks sync.

CREATE TABLE IF NOT EXISTS expense_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  house_id UUID REFERENCES houses(id) ON DELETE SET NULL,

  category TEXT NOT NULL,
  -- 'mortgage_rent' | 'utilities' | 'insurance' | 'supplies' | 'staff_payroll'
  -- | 'maintenance_repair' | 'drug_testing' | 'marketing' | 'legal_compliance'
  -- | 'licensing_fees' | 'training' | 'food_household' | 'transportation' | 'other'

  vendor TEXT,
  description TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  expense_date DATE NOT NULL,
  payment_method TEXT, -- 'check' | 'ach' | 'credit_card' | 'cash' | 'other'
  reference_number TEXT,
  receipt_url TEXT,
  is_recurring BOOLEAN DEFAULT false,
  recurring_frequency TEXT, -- 'monthly' | 'quarterly' | 'annual'
  notes TEXT,

  -- QuickBooks sync
  qb_expense_id TEXT,
  qb_synced_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE expense_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "expense_records_user" ON expense_records
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Index for date-range queries
CREATE INDEX IF NOT EXISTS expense_records_date_idx ON expense_records(user_id, expense_date DESC);
CREATE INDEX IF NOT EXISTS expense_records_house_idx ON expense_records(house_id, expense_date DESC);
