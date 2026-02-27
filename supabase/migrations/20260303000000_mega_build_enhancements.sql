-- ============================================================
-- MEGA BUILD ENHANCEMENTS
-- Adds missing columns, seed data, and enhancements for
-- Systems 1-5: Checklists, Documents, Drug Testing,
-- Recovery Tracking, Emergency & Audit Trail
-- ============================================================

-- System 3: Add missing columns to drug_tests if not present
ALTER TABLE public.drug_tests
  ADD COLUMN IF NOT EXISTS chain_of_custody BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS lab_name TEXT,
  ADD COLUMN IF NOT EXISTS cost DECIMAL(8,2);

-- System 3: Add missing columns to drug_test_schedules
ALTER TABLE public.drug_test_schedules
  ADD COLUMN IF NOT EXISTS test_type TEXT DEFAULT 'urine',
  ADD COLUMN IF NOT EXISTS phase_based BOOLEAN DEFAULT false;

-- System 4: Add missing columns to residents for sobriety tracking
ALTER TABLE public.residents
  ADD COLUMN IF NOT EXISTS sobriety_date DATE,
  ADD COLUMN IF NOT EXISTS program_phase INTEGER DEFAULT 1;

-- System 4: Add employment_required and privileges to program_phase_rules
ALTER TABLE public.program_phase_rules
  ADD COLUMN IF NOT EXISTS employment_required BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS privileges TEXT;

-- System 5: Add severity to emergency_events if not present
ALTER TABLE public.emergency_events
  ADD COLUMN IF NOT EXISTS severity TEXT DEFAULT 'medium'
    CHECK (severity IS NULL OR severity IN ('low','medium','high','critical'));

-- System 5: Add is_sponsor to emergency_contacts
ALTER TABLE public.emergency_contacts
  ADD COLUMN IF NOT EXISTS is_sponsor BOOLEAN DEFAULT false;

-- System 5: Add last_checked to emergency_supplies
ALTER TABLE public.emergency_supplies
  ADD COLUMN IF NOT EXISTS last_checked TIMESTAMPTZ;

-- ============================================================
-- SEED: Program Phase Rules (if not already present)
-- ============================================================
INSERT INTO public.program_phase_rules (phase_number, phase_name, min_days_required, required_meetings_per_week, required_tests_per_week, curfew_time, description, employment_required, privileges)
VALUES
  (1, 'Orientation', 30, 7, 3, '22:00', 'New residents. 90-in-90 meeting requirement. Must attend all house meetings. Job search required within first week.', false, 'Basic house access. Must be accompanied for outings first 7 days.'),
  (2, 'Stabilization', 60, 5, 2, '23:00', 'Established routine. Active employment or vocational program required. Building recovery network.', true, 'Extended curfew. Weekend passes available with approval. Can host visitors during designated hours.'),
  (3, 'Transition', 90, 3, 1, '00:00', 'Preparing for independent living. Saving money, building credit. Mentoring Phase 1 residents.', true, 'Midnight curfew. Overnight passes with 48-hour notice. Can serve as house peer leader.')
ON CONFLICT DO NOTHING;

-- ============================================================
-- SEED: Emergency Protocols (comprehensive step-by-step)
-- ============================================================
INSERT INTO public.emergency_protocols (protocol_type, title, steps_json, last_reviewed, reviewed_by)
VALUES
  ('overdose', 'Overdose Response Protocol', '[
    {"step_number": 1, "instruction": "CALL 911 IMMEDIATELY. Arizona Good Samaritan Law (A.R.S. 36-2228) protects callers from prosecution.", "critical": true},
    {"step_number": 2, "instruction": "Administer Narcan (naloxone) nasal spray: insert nozzle into one nostril, press plunger firmly. If no response in 2-3 minutes, administer second dose in other nostril.", "critical": true},
    {"step_number": 3, "instruction": "Place person in recovery position (on their side) to prevent choking. Clear airway if needed.", "critical": true},
    {"step_number": 4, "instruction": "Begin rescue breathing if person is not breathing: tilt head back, lift chin, give 1 breath every 5 seconds.", "critical": true},
    {"step_number": 5, "instruction": "Stay with the person until EMS arrives. Monitor breathing continuously.", "critical": false},
    {"step_number": 6, "instruction": "DO NOT leave the person alone. DO NOT put them in cold water. DO NOT try to make them vomit.", "critical": false},
    {"step_number": 7, "instruction": "Notify House Manager and Program Director immediately.", "critical": false},
    {"step_number": 8, "instruction": "Document everything: time of discovery, symptoms observed, Narcan doses given, EMS arrival time.", "critical": false},
    {"step_number": 9, "instruction": "Notify emergency contacts listed for the resident.", "critical": false},
    {"step_number": 10, "instruction": "Complete incident report within 24 hours. Schedule post-incident debrief with all staff within 48 hours.", "critical": false}
  ]'::jsonb, CURRENT_DATE::text, 'System'),

  ('fire', 'Fire Evacuation Protocol', '[
    {"step_number": 1, "instruction": "Pull the nearest fire alarm. CALL 911.", "critical": true},
    {"step_number": 2, "instruction": "Alert all residents by shouting FIRE and knocking on every door.", "critical": true},
    {"step_number": 3, "instruction": "Evacuate using the nearest safe exit. Do NOT use elevators.", "critical": true},
    {"step_number": 4, "instruction": "Close doors behind you as you evacuate to slow fire spread.", "critical": false},
    {"step_number": 5, "instruction": "Meet at the designated assembly point (front of property, across the street).", "critical": false},
    {"step_number": 6, "instruction": "Account for ALL residents using the resident roster. Report anyone missing to fire department.", "critical": true},
    {"step_number": 7, "instruction": "DO NOT re-enter the building until fire department declares it safe.", "critical": true},
    {"step_number": 8, "instruction": "Notify House Manager, Program Director, and property owner.", "critical": false},
    {"step_number": 9, "instruction": "If evacuation is not possible, close door, seal gaps with towels, go to window and signal for help.", "critical": false},
    {"step_number": 10, "instruction": "Complete incident report and schedule building safety reassessment.", "critical": false}
  ]'::jsonb, CURRENT_DATE::text, 'System'),

  ('medical', 'Medical Emergency Protocol', '[
    {"step_number": 1, "instruction": "Assess the situation. If life-threatening, CALL 911 immediately.", "critical": true},
    {"step_number": 2, "instruction": "Provide first aid within your training level (CPR, bleeding control, etc.).", "critical": true},
    {"step_number": 3, "instruction": "Do NOT move the person unless they are in immediate danger.", "critical": false},
    {"step_number": 4, "instruction": "Stay calm and reassure the person. Monitor vital signs.", "critical": false},
    {"step_number": 5, "instruction": "Gather medication list and allergies for EMS from resident file.", "critical": false},
    {"step_number": 6, "instruction": "Notify emergency contacts and House Manager.", "critical": false},
    {"step_number": 7, "instruction": "Document all observations, actions taken, and timeline.", "critical": false},
    {"step_number": 8, "instruction": "Follow up with hospital/treating facility for discharge instructions.", "critical": false}
  ]'::jsonb, CURRENT_DATE::text, 'System'),

  ('mental_health_crisis', 'Mental Health Crisis Protocol', '[
    {"step_number": 1, "instruction": "Stay calm. Speak in a low, non-threatening tone. Do not argue or challenge.", "critical": true},
    {"step_number": 2, "instruction": "If person is danger to self or others, CALL 911 or Crisis Line (988 Suicide & Crisis Lifeline).", "critical": true},
    {"step_number": 3, "instruction": "Remove any potential weapons or harmful objects from the area.", "critical": true},
    {"step_number": 4, "instruction": "Do NOT physically restrain unless absolutely necessary for safety.", "critical": false},
    {"step_number": 5, "instruction": "Give the person space but maintain visual contact.", "critical": false},
    {"step_number": 6, "instruction": "Contact their therapist/counselor if known.", "critical": false},
    {"step_number": 7, "instruction": "Notify House Manager and document the incident.", "critical": false},
    {"step_number": 8, "instruction": "Follow up within 24 hours. Consider safety plan update.", "critical": false}
  ]'::jsonb, CURRENT_DATE::text, 'System'),

  ('violence', 'Violence / Altercation Protocol', '[
    {"step_number": 1, "instruction": "Do NOT physically intervene. Prioritize your safety and other residents'' safety.", "critical": true},
    {"step_number": 2, "instruction": "Call 911 if weapons are involved or someone is injured.", "critical": true},
    {"step_number": 3, "instruction": "Verbally instruct parties to separate. Use de-escalation techniques.", "critical": false},
    {"step_number": 4, "instruction": "Move other residents away from the area.", "critical": false},
    {"step_number": 5, "instruction": "Once safe, separate involved parties to different rooms/areas.", "critical": false},
    {"step_number": 6, "instruction": "Collect statements from witnesses separately.", "critical": false},
    {"step_number": 7, "instruction": "Per house rules: zero tolerance for violence results in immediate discharge.", "critical": true},
    {"step_number": 8, "instruction": "Complete incident report. Notify Program Director within 1 hour.", "critical": false}
  ]'::jsonb, CURRENT_DATE::text, 'System'),

  ('missing_resident', 'Missing Resident Protocol', '[
    {"step_number": 1, "instruction": "Verify the resident is not in another part of the house or property.", "critical": false},
    {"step_number": 2, "instruction": "Check with other residents for last known whereabouts.", "critical": false},
    {"step_number": 3, "instruction": "Attempt to contact the resident by phone and text.", "critical": false},
    {"step_number": 4, "instruction": "Contact the resident''s emergency contacts and sponsor.", "critical": false},
    {"step_number": 5, "instruction": "If resident is court-mandated, notify probation/parole officer within 4 hours.", "critical": true},
    {"step_number": 6, "instruction": "If under 24 hours and no welfare concern, document and monitor.", "critical": false},
    {"step_number": 7, "instruction": "If over 24 hours or welfare concern exists, file a missing persons report with local police.", "critical": true},
    {"step_number": 8, "instruction": "Document all attempts to locate and notify Program Director.", "critical": false}
  ]'::jsonb, CURRENT_DATE::text, 'System')
ON CONFLICT DO NOTHING;
