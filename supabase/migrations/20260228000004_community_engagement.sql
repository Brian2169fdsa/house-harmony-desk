-- Community Engagement Log
-- Tracks neighbor outreach, complaints, reasonable accommodation requests,
-- and community meetings per property. Required for Phoenix/Maricopa County
-- NIMBY mitigation strategy (pages 11-15, Arizona Startup Guide).

CREATE TABLE IF NOT EXISTS community_engagement_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  house_id UUID REFERENCES houses(id) ON DELETE SET NULL,

  contact_type TEXT NOT NULL,
  -- 'neighbor_outreach' | 'complaint' | 'reasonable_accommodation' | 'community_meeting' | 'city_contact' | 'other'

  -- Who was contacted / who contacted us
  contact_name TEXT,
  contact_address TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  contact_role TEXT, -- 'neighbor' | 'city_official' | 'hoa' | 'community_org' | 'planning_dept' | 'other'

  -- Event details
  contact_date DATE NOT NULL,
  description TEXT NOT NULL,
  outcome TEXT,
  follow_up_date DATE,
  follow_up_notes TEXT,

  -- Status
  status TEXT NOT NULL DEFAULT 'open',
  -- 'open' | 'in_progress' | 'resolved' | 'escalated' | 'closed'

  -- For reasonable accommodation requests (FHA)
  accommodation_requested TEXT,
  accommodation_granted BOOLEAN,
  accommodation_denied_reason TEXT,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE community_engagement_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "community_engagement_user" ON community_engagement_log
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
