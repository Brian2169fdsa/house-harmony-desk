-- ============================================================
-- LMS (Learning Management System) - Full Schema + Seed Data
-- Covers ROADMAP.md Phase 1 (Startup & Staff Training Module)
-- ============================================================

-- ── Schema ────────────────────────────────────────────────────

CREATE TABLE public.lms_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  cover_color TEXT NOT NULL DEFAULT '#6366f1',
  estimated_minutes INTEGER NOT NULL DEFAULT 30,
  passing_score INTEGER NOT NULL DEFAULT 80,
  is_required BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.lms_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.lms_courses(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  title TEXT NOT NULL,
  content_type TEXT NOT NULL DEFAULT 'text',  -- 'text' | 'video' | 'pdf'
  content_url TEXT,                           -- for video/pdf
  content_body TEXT,                          -- for text/markdown
  duration_minutes INTEGER NOT NULL DEFAULT 10,
  has_quiz BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.lms_quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES public.lms_lessons(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  question TEXT NOT NULL,
  options_json JSONB NOT NULL,   -- ["Option A","Option B","Option C","Option D"]
  correct_index INTEGER NOT NULL, -- 0-based index into options_json
  explanation TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.lms_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.lms_courses(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'enrolled', -- 'enrolled' | 'in_progress' | 'completed'
  progress_pct INTEGER NOT NULL DEFAULT 0,
  enrolled_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE (user_id, course_id)
);

CREATE TABLE public.lms_lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES public.lms_lessons(id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, lesson_id)
);

CREATE TABLE public.lms_quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES public.lms_lessons(id) ON DELETE CASCADE,
  answers_json JSONB NOT NULL,   -- [0, 2, 1, 3] selected indices
  score INTEGER NOT NULL,         -- percentage 0-100
  passed BOOLEAN NOT NULL DEFAULT false,
  attempted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.lms_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.lms_courses(id) ON DELETE CASCADE,
  certificate_number TEXT NOT NULL UNIQUE,
  issued_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  UNIQUE (user_id, course_id)
);

-- ── Indexes ───────────────────────────────────────────────────

CREATE INDEX idx_lms_lessons_course_id ON public.lms_lessons(course_id);
CREATE INDEX idx_lms_quiz_questions_lesson_id ON public.lms_quiz_questions(lesson_id);
CREATE INDEX idx_lms_enrollments_user_id ON public.lms_enrollments(user_id);
CREATE INDEX idx_lms_enrollments_course_id ON public.lms_enrollments(course_id);
CREATE INDEX idx_lms_lesson_progress_user_id ON public.lms_lesson_progress(user_id);
CREATE INDEX idx_lms_quiz_attempts_user_lesson ON public.lms_quiz_attempts(user_id, lesson_id);
CREATE INDEX idx_lms_certificates_user_id ON public.lms_certificates(user_id);

-- ── RLS ───────────────────────────────────────────────────────

ALTER TABLE public.lms_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lms_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lms_quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lms_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lms_lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lms_quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lms_certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read courses"
  ON public.lms_courses FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated read lessons"
  ON public.lms_lessons FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated read quiz questions"
  ON public.lms_quiz_questions FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated full access enrollments"
  ON public.lms_enrollments FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated full access lesson progress"
  ON public.lms_lesson_progress FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated full access quiz attempts"
  ON public.lms_quiz_attempts FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated full access certificates"
  ON public.lms_certificates FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── Seed: 5 Built-in Courses ──────────────────────────────────
-- Using stable UUIDs so re-runs are idempotent


-- ── Seed: 5 Built-in Courses (inline SQL) ──────────────────────

-- ── Course 1: De-escalation Techniques ────────────────────────
INSERT INTO public.lms_courses (id, title, description, category, cover_color, estimated_minutes, passing_score, is_required, sort_order)
VALUES ('c0000001-0000-0000-0000-000000000001',
  'De-escalation Techniques for Recovery Housing',
  'Learn proven verbal and non-verbal strategies to defuse conflict before it escalates. This course prepares house managers and staff to handle high-stress situations safely and professionally.',
  'de-escalation', '#7c3aed', 35, 80, true, 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.lms_lessons (id, course_id, sort_order, title, content_type, content_body, duration_minutes, has_quiz)
VALUES
('a0010100-0000-0000-0000-000000000001', 'c0000001-0000-0000-0000-000000000001', 1, 'Understanding Conflict in Recovery Settings', 'text', E'## Understanding Conflict in Recovery Settings\n\nConflict is a normal part of human interaction, and in a recovery residence it is especially common. Residents come from backgrounds of trauma, substance use, and instability — and many have not yet developed healthy coping mechanisms for frustration or disappointment.\n\n### Why Conflict Happens\n\n- **Emotional dysregulation** – Early recovery affects mood stability. Small frustrations can feel overwhelming.\n- **Shared living stress** – Privacy is limited. Chores, guests, noise, and finances create friction.\n- **Triggers** – Recovery-related stress (cravings, court dates, family conflict) spills into house dynamics.\n- **Rule enforcement** – Residents may resist or resent house rules, especially around curfew, guests, and drug testing.\n\n### The De-escalation Mindset\n\nBefore any technique, adopt these principles:\n\n1. **Safety first** — Your safety and the resident''s safety come before resolution.\n2. **Curiosity over judgment** — Ask yourself: *What is this person experiencing right now?*\n3. **You are not the enemy** — Even if a resident is directing anger at you, they are usually fighting something internal.\n4. **Slow down** — Conflict thrives on speed. Slowing the interaction gives everyone room to think.\n\n### Warning Signs to Watch For\n\n| Physical Cues | Verbal Cues |\n|---|---|\n| Raised voice | Threats or ultimatums |\n| Clenched fists | Profanity escalation |\n| Pacing or agitation | Accusations |\n| Invading personal space | "I don''t care anymore" statements |\n\n### Key Takeaway\n\nYour job in a conflict is not to "win" — it is to create enough calm that both parties can think clearly. Understanding the source of conflict is the first step.',
  12, false),

('a0010200-0000-0000-0000-000000000001', 'c0000001-0000-0000-0000-000000000001', 2, 'Verbal De-escalation Strategies', 'text', E'## Verbal De-escalation Strategies\n\nVerbal de-escalation is the most powerful tool you have in a conflict. Done correctly, it can transform a potentially dangerous situation into a productive conversation.\n\n### The LEAP Framework\n\n**L — Listen**\nActively listen without interrupting. Let the person feel heard. Nodding, maintaining eye contact, and brief affirmations ("I hear you," "Go on") signal that you are engaged.\n\n**E — Empathize**\nAcknowledge their feelings, even if you disagree with their actions.\n> *"I understand you''re frustrated. That makes sense."*\nEmpathy does not mean agreement — it means recognition.\n\n**A — Agree**\nFind any point of agreement to build rapport.\n> *"You''re right that communication here has been inconsistent. Let''s work on that."*\n\n**P — Partner**\nPosition yourself as working with them, not against them.\n> *"I want to help you figure this out. Can we sit down and talk through it?"*\n\n### Practical Techniques\n\n**1. Lower your voice**\nIf someone raises theirs, lower yours. People unconsciously mirror vocal tone. A calm, measured voice is contagious.\n\n**2. Use open body language**\nUnfolded arms, neutral stance, slight turn (not square-on, which reads as confrontational). Keep hands visible.\n\n**3. Slow your speech**\nDeliberate, unhurried speech signals you are in control and not threatened.\n\n**4. Offer choices**\nPeople in crisis feel out of control. Giving small choices restores a sense of agency.\n> *"Would you prefer we talk here or step into the office?"*\n\n**5. Avoid trigger phrases**\nNever say:\n- "Calm down" (invalidates their experience)\n- "That''s not my problem" (dismissive)\n- "I''m calling the police" (escalation threat before it''s warranted)\n- "You always do this" (accusatory)\n\n**6. Give space and time**\nAfter speaking, allow silence. Resist the urge to fill it. The person needs time to process.\n\n### When the Situation Is Escalating Despite Your Efforts\n\n- Do not match their energy.\n- Create physical distance if needed.\n- Calmly set a boundary: *"I want to continue this conversation. I need you to step back so I can focus on what you''re saying."*\n- If physical aggression appears imminent, remove yourself and call for backup.\n\n### Documentation\n\nAfter any de-escalation incident, document:\n- Date, time, location\n- Residents involved\n- What triggered the conflict\n- What techniques you used\n- Outcome and any follow-up needed',
  15, true),

('a0010300-0000-0000-0000-000000000001', 'c0000001-0000-0000-0000-000000000001', 3, 'Documenting Incidents and Post-Crisis Follow-Up', 'text', E'## Documenting Incidents and Post-Crisis Follow-Up\n\nProper documentation protects residents, staff, and your organization. It also provides the data needed to identify patterns and prevent future incidents.\n\n### When to Write an Incident Report\n\nDocument any situation involving:\n- Physical altercation or threat of violence\n- Self-harm or suicidal ideation\n- Significant property damage\n- Violations requiring potential discharge\n- Police contact\n- Medical emergencies\n- Harassment or discrimination allegations\n- Suspected drug/alcohol use on premises\n\n### The WHAT-WHO-HOW Framework\n\n**WHAT** — Factual description of what occurred\n- Use objective language. Say *"Resident A raised his voice and pointed at Resident B"* not *"Resident A was aggressive."*\n- Avoid interpretation or judgment.\n\n**WHO** — All parties involved\n- Full names, roles (resident, staff, visitor)\n- Witnesses\n- Anyone contacted (family, supervisor, police)\n\n**HOW** — Your response\n- What actions you took, in chronological order\n- What was said (direct quotes where possible)\n- How it was resolved (or not)\n\n### Post-Crisis Steps\n\n1. **Check in with the resident** — Once things are calm (usually 24-48 hours later), have a brief, non-confrontational conversation. Acknowledge that things got difficult. Affirm your commitment to supporting them.\n\n2. **Check in with yourself** — De-escalation is emotionally taxing. Talk to your supervisor or a colleague if you need to debrief.\n\n3. **Review what worked** — What de-escalation techniques were effective? What would you do differently?\n\n4. **Update the care team** — If the resident has a case manager, counselor, or sponsor, inform them appropriately (following confidentiality guidelines).\n\n5. **Look for patterns** — If the same resident has repeated incidents, that is important clinical information. Bring it to house leadership.\n\n### Confidentiality Reminder\n\nIncident reports are internal documents. Do not share them with other residents. Maintain privacy standards consistent with your organization''s policies.',
  10, true)
ON CONFLICT (id) DO NOTHING;

-- Quiz: Lesson 1-2 (Verbal De-escalation)
INSERT INTO public.lms_quiz_questions (lesson_id, sort_order, question, options_json, correct_index, explanation)
VALUES
('a0010200-0000-0000-0000-000000000001', 1,
  'A resident is shouting and pacing. Your first priority should be:',
  '["Match their energy to show you understand","Immediately threaten to call police","Ensure your own safety and the resident''s safety","Tell them to calm down"]',
  2,
  'Safety always comes first. Before any de-escalation technique, assess the situation for immediate physical danger.'),

('a0010200-0000-0000-0000-000000000001', 2,
  'Which phrase should you AVOID during de-escalation?',
  '["I hear you and want to understand","Can we talk this through together?","Calm down, this isn''t a big deal","I''d like to help figure this out"]',
  2,
  '"Calm down" invalidates the resident''s experience and often makes escalation worse. Empathetic, partnering language is more effective.'),

('a0010200-0000-0000-0000-000000000001', 3,
  'The LEAP framework stands for:',
  '["Listen, Escalate, Assess, Prevent","Listen, Empathize, Agree, Partner","Look, Evaluate, Act, Pause","Lead, Engage, Assert, Protect"]',
  1,
  'LEAP (Listen, Empathize, Agree, Partner) is a structured approach to verbal de-escalation that builds rapport and reduces defensiveness.'),

('a0010200-0000-0000-0000-000000000001', 4,
  'If a resident is escalating despite your efforts, the best immediate action is:',
  '["Continue pressing for resolution","Create physical distance and avoid matching their energy","Raise your voice to regain control","Leave the building entirely"]',
  1,
  'When de-escalation attempts are not working, the key is to maintain calm and create distance. Do not match their energy or abandon your position entirely unless safety requires it.')
ON CONFLICT DO NOTHING;

-- Quiz: Lesson 1-3 (Documentation)
INSERT INTO public.lms_quiz_questions (lesson_id, sort_order, question, options_json, correct_index, explanation)
VALUES
('a0010300-0000-0000-0000-000000000001', 1,
  'In an incident report, how should you describe a resident''s behavior?',
  '["He was aggressive and out of control","He raised his voice and pointed at the other resident","He was clearly having a bad day","He acted violently as usual"]',
  1,
  'Incident reports should use objective, factual language. Describe observable behaviors, not interpretations or judgments.'),

('a0010300-0000-0000-0000-000000000001', 2,
  'When should post-crisis follow-up with a resident typically occur?',
  '["Immediately while emotions are still high","Never — the incident is over","24-48 hours later when everyone is calmer","Only if the resident asks"]',
  2,
  'Waiting 24-48 hours gives everyone time to calm down. A non-confrontational follow-up conversation shows support and helps prevent future incidents.'),

('a0010300-0000-0000-0000-000000000001', 3,
  'Incident reports should be shared with:',
  '["All residents in the house for transparency","Only authorized staff and supervisors","Family members of the resident involved","Local media if it was serious"]',
  1,
  'Incident reports are confidential internal documents. Sharing them with unauthorized parties violates privacy standards.')
ON CONFLICT DO NOTHING;


-- ── Course 2: Drug Testing Procedures ─────────────────────────
INSERT INTO public.lms_courses (id, title, description, category, cover_color, estimated_minutes, passing_score, is_required, sort_order)
VALUES ('c0000002-0000-0000-0000-000000000002',
  'Drug Testing Procedures & Chain of Custody',
  'Master the protocols for administering, documenting, and storing drug test results. Learn chain of custody requirements that protect your organization''s legal standing and residents'' dignity.',
  'drug-testing', '#0891b2', 40, 80, true, 2)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.lms_lessons (id, course_id, sort_order, title, content_type, content_body, duration_minutes, has_quiz)
VALUES
('a0020100-0000-0000-0000-000000000001', 'c0000002-0000-0000-0000-000000000002', 1, 'Types of Drug Tests Used in Recovery Housing', 'text', E'## Types of Drug Tests Used in Recovery Housing\n\n### Why Drug Testing Matters\n\nDrug testing is one of the most important accountability tools in recovery housing. When done correctly, it:\n- Provides objective data to support resident accountability\n- Deters substance use on premises\n- Protects other residents in the house\n- Documents compliance for courts, parole officers, and funders\n- Gives residents a "reason to say no" to using\n\n### Types of Drug Tests\n\n#### 1. Urine Drug Screen (UDS) — Most Common\n- **How it works:** Immunoassay technology detects metabolites (breakdown products) of drugs in urine.\n- **Detection windows:**\n  | Substance | Typical Detection Window |\n  |---|---|\n  | Marijuana (occasional) | 3-4 days |\n  | Marijuana (heavy use) | Up to 30 days |\n  | Cocaine | 2-4 days |\n  | Heroin/Opioids | 1-3 days |\n  | Methamphetamine | 3-5 days |\n  | Benzodiazepines | 3-7 days |\n  | Alcohol (EtG test) | 24-80 hours |\n- **Standard panels:** 5-panel, 10-panel, 12-panel (more panels = more drugs tested)\n- **Considerations:** Most cost-effective; requires observed collection for accuracy\n\n#### 2. Breathalyzer / EtG Strip\n- Detects recent alcohol use\n- Breathalyzer: detects active intoxication (within hours)\n- EtG urine test: detects alcohol metabolites 24-80 hours after drinking\n\n#### 3. Saliva/Oral Fluid Test\n- Shorter detection window than urine (typically 24-48 hours)\n- Harder to adulterate; more useful for detecting recent use\n- Useful for roadside-style testing after an incident\n\n#### 4. Hair Follicle Test\n- Detects drug use over the past 90 days\n- Cannot be adulterated\n- Not practical for routine monitoring (cost, lab time)\n- Most useful for intake screening of long-term use history\n\n### Adulteration & Tampering\n\nResidents who want to cheat a drug test may try:\n- Diluting their sample (drinking excessive water)\n- Adding household chemicals to the sample\n- Substituting someone else''s urine\n\n**Indicators of adulteration:**\n- Temperature outside 90-100°F range\n- Unusual color or smell\n- Creatinine or specific gravity out of normal range\n- Nitrites or oxidants detected on validity strip\n\n**Prevention:** Always test sample temperature immediately (use a thermometer strip), conduct observed collections when policy allows, and use validity-testing strips.',
  13, false),

('a0020200-0000-0000-0000-000000000001', 'c0000002-0000-0000-0000-000000000002', 2, 'Conducting a Drug Test: Step-by-Step Protocol', 'text', E'## Conducting a Drug Test: Step-by-Step Protocol\n\nA standardized protocol ensures accuracy, dignity, and defensibility. Follow these steps every time.\n\n### Before the Test\n\n**Prepare your supplies:**\n- [ ] Test cup or dipstick (check expiration date)\n- [ ] Gloves\n- [ ] Temperature strip\n- [ ] Chain of custody form or digital log\n- [ ] Tamper-evident seal (if using lab confirmation)\n- [ ] Secure, private space\n\n**Inform the resident:**\n> *"As part of our house policy, I need to collect a drug test today. This is required for all residents. I''ll explain the process."*\n\nBe matter-of-fact, not accusatory. Testing is routine, not punitive.\n\n### Conducting the Collection\n\n1. **Verify identity** — Confirm you are testing the right person.\n\n2. **Ask about medications** — Note any prescription medications and OTC substances the resident takes. This affects interpretation of results.\n\n3. **Instruct the resident:**\n   - Empty pockets\n   - Turn off any water sources in the collection area if conducting observed testing\n   - Collect a minimum of 30mL of urine in the cup\n   - Hand the sealed cup directly to you\n\n4. **Check temperature immediately** — The sample should read 90-100°F within 4 minutes of collection. Outside this range is a potential adulteration indicator.\n\n5. **Check validity strips** — If using a validity-testing cup, read creatinine, pH, nitrite, and oxidant lines.\n\n6. **Read the test results:**\n   - A line (C = Control, T = Test) in each zone = NEGATIVE for that drug\n   - No T line = POSITIVE (drugs detected)\n   - No C line = INVALID TEST (retest required)\n   - Refer to your test kit''s instruction sheet for specific interpretation\n\n### Interpreting Results\n\n| Result | Meaning | Action |\n|---|---|---|\n| Negative (all lines present) | No drugs detected above threshold | Document; no further action |\n| Positive (T line absent) | Presumptive positive; confirmation may be needed | Follow incident protocol; do not discharge based solely on this result |\n| Invalid | Test is inconclusive | Retest immediately or within 24 hours |\n| Dilute (low creatinine) | Sample may have been diluted | Document; conduct follow-up test |\n\n### Important Notes\n\n- **A presumptive positive is not a confirmed positive.** For consequential decisions (discharge, legal reporting), send to a CLIA-certified lab for confirmation.\n- **False positives can occur.** Some medications can trigger false positives (e.g., ibuprofen for THC, some antidepressants for amphetamines).\n- **Give the resident an opportunity to explain** before taking action. Ask: *"The test shows a positive result for [substance]. Is there anything you''d like me to know before I document this?"*',
  15, true),

('a0020300-0000-0000-0000-000000000001', 'c0000002-0000-0000-0000-000000000002', 3, 'Chain of Custody & Documentation Requirements', 'text', E'## Chain of Custody & Documentation Requirements\n\n### What Is Chain of Custody?\n\nChain of custody (COC) is the documented, unbroken record of who collected, handled, and analyzed a drug test sample. A proper chain of custody:\n- Makes results legally defensible\n- Protects you and your organization from disputes\n- Is required by courts, parole/probation, and many funders\n\n### Why It Matters\n\nIf a resident disputes a positive test result in court or with a probation officer, a complete chain of custody demonstrates that:\n- The sample was collected properly\n- It was not tampered with after collection\n- The result accurately reflects the resident''s sample\n\nWithout a proper COC, even a legitimate positive result may be challenged and dismissed.\n\n### Chain of Custody Documentation (For Lab-Confirmed Tests)\n\nA standard COC form captures:\n1. **Specimen ID** — Unique barcode or number\n2. **Donor (Resident) information** — Name, date of birth, ID number\n3. **Collector information** — Your name, signature, date/time\n4. **Collection details** — Temperature check result, location, observed/unobserved\n5. **Specimen transfer** — Each person who handles the sample must sign and date\n6. **Seal intact confirmation** — Tamper-evident seal checked at each transfer\n7. **Lab receipt** — Lab confirms receipt and intact seal\n\n### Point-of-Care (On-Site) Testing Documentation\n\nFor rapid tests (urine cups or dipsticks used on-site without lab confirmation), document:\n\n| Field | What to Record |\n|---|---|\n| Date & Time | Exact collection time |\n| Resident Name | Full legal name |\n| Test Type/Panel | "12-panel urine screen" |\n| Lot Number & Expiration | From test packaging |\n| Temperature | Measured at collection |\n| Results | Line-by-line: Negative/Positive/Invalid per drug |\n| Medications Disclosed | Any medications resident reported |\n| Collector Signature | Your name and title |\n| Resident Signature | Optional but recommended |\n| Outcome | Action taken (if any) |\n\n### Storage & Retention\n\n- **Negative results:** Retain for minimum 1 year (or per your organization''s policy)\n- **Positive results:** Retain for minimum 3 years or the duration of any related legal proceedings\n- **Physical samples:** If positive and lab confirmation ordered, maintain chain of custody during transport; otherwise dispose per biohazard protocol\n- **Digital records:** Store securely with access limited to authorized staff\n\n### Confidentiality\n\nDrug test results are confidential health information. They should be:\n- Shared only with authorized personnel (supervisor, clinical staff, parole officer with consent)\n- Never discussed with other residents\n- Stored in a locked cabinet or secure digital system',
  12, true)
ON CONFLICT (id) DO NOTHING;

-- Quiz: Lesson 2-2
INSERT INTO public.lms_quiz_questions (lesson_id, sort_order, question, options_json, correct_index, explanation)
VALUES
('a0020200-0000-0000-0000-000000000001', 1,
  'What temperature range indicates a valid urine sample at collection?',
  '["70-85°F","90-100°F","100-110°F","Any temperature is acceptable"]',
  1,
  'Body temperature urine should read 90-100°F within 4 minutes of collection. Outside this range may indicate the sample was adulterated or substituted.'),

('a0020200-0000-0000-0000-000000000001', 2,
  'What does it mean if the T line is absent on a drug test?',
  '["The test is invalid","The result is negative","The result is presumptively positive","The sample was diluted"]',
  2,
  'In immunoassay tests, the presence of a line means negative. The absence of the T (test) line indicates a presumptive positive result for that drug.'),

('a0020200-0000-0000-0000-000000000001', 3,
  'Before taking action on a positive result, what should you do?',
  '["Immediately discharge the resident","Give the resident a chance to explain, including any medications they take","Share the result with all house residents","Nothing — a positive is a positive"]',
  1,
  'False positives can occur due to certain medications. Always give the resident an opportunity to explain before acting, especially for consequential decisions.'),

('a0020200-0000-0000-0000-000000000001', 4,
  'What should you do if a urine test result shows "Invalid"?',
  '["Count it as a positive","Retest immediately or within 24 hours","Dismiss it and move on","Discharge the resident for refusing"]',
  1,
  'An invalid result means the test is inconclusive, often due to adulteration or a testing error. The appropriate response is to retest, not to assume a positive or negative.')
ON CONFLICT DO NOTHING;

-- Quiz: Lesson 2-3
INSERT INTO public.lms_quiz_questions (lesson_id, sort_order, question, options_json, correct_index, explanation)
VALUES
('a0020300-0000-0000-0000-000000000001', 1,
  'Chain of custody documentation is most important when:',
  '["All test results, regardless of outcome","Only for positive results that may be legally contested","Only for court-ordered testing","Only when the resident requests it"]',
  1,
  'While good documentation is always important, chain of custody is critical for any positive result that may be contested legally or reported to courts/probation.'),

('a0020300-0000-0000-0000-000000000001', 2,
  'How long should positive drug test results be retained?',
  '["30 days","1 year","3 years or the duration of any legal proceedings","Until the resident moves out"]',
  2,
  'Positive results should be retained for a minimum of 3 years or the duration of any related legal proceedings, whichever is longer.'),

('a0020300-0000-0000-0000-000000000001', 3,
  'Drug test results should be shared with:',
  '["All house staff so everyone is informed","Other residents for accountability","Only authorized personnel such as supervisors and parole officers with consent","Posted publicly in the house"]',
  2,
  'Drug test results are confidential health information. They should only be shared with authorized individuals — supervisors, clinical staff, and law enforcement/parole officers with appropriate consent or legal authority.')
ON CONFLICT DO NOTHING;


-- ── Course 3: Emergency Protocols & Overdose Response ─────────
INSERT INTO public.lms_courses (id, title, description, category, cover_color, estimated_minutes, passing_score, is_required, sort_order)
VALUES ('c0000003-0000-0000-0000-000000000003',
  'Emergency Protocols & Overdose Response',
  'Life-saving knowledge every recovery housing staff member must have. Covers emergency response frameworks, opioid overdose recognition, Narcan (naloxone) administration, and post-emergency documentation.',
  'emergency', '#dc2626', 40, 90, true, 3)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.lms_lessons (id, course_id, sort_order, title, content_type, content_body, duration_minutes, has_quiz)
VALUES
('a0030100-0000-0000-0000-000000000001', 'c0000003-0000-0000-0000-000000000003', 1, 'Emergency Response Framework', 'text', E'## Emergency Response Framework\n\nIn a recovery residence, emergencies can range from a medical crisis to a behavioral escalation to a fire. Being prepared — knowing your role, your contacts, and your procedures — can save a life.\n\n### Types of Emergencies You May Encounter\n\n| Emergency Type | Examples |\n|---|---|\n| Medical | Overdose, heart attack, seizure, allergic reaction |\n| Behavioral | Suicide attempt, violent incident, acute psychosis |\n| Safety | Fire, gas leak, intruder |\n| Environmental | Flooding, power outage, extreme weather |\n\n### The Universal First Steps: PROTECT-CALL-CARE\n\n**PROTECT** — Ensure your safety and the safety of others\n- Is the scene safe to enter? (fire, fighting, chemical hazard)\n- Remove bystanders who are not helping\n- Never put yourself in danger to reach a victim if the scene is unsafe\n\n**CALL** — Contact emergency services\n- **Call 911 immediately** for any life-threatening emergency\n- Know your address and be ready to give it to the dispatcher\n- Stay on the line unless instructed otherwise\n- **Notify your supervisor** as soon as possible (911 takes priority)\n\n**CARE** — Provide assistance until help arrives\n- Follow dispatcher instructions\n- Administer first aid if trained\n- Administer Narcan if opioid overdose is suspected (covered in Lesson 2)\n- Stay with the person, reassure them, keep them calm\n\n### Emergency Contact List (Know These Cold)\n\nEvery house should have a posted emergency contact list including:\n- 911 (national emergency)\n- Poison Control: 1-800-222-1222\n- National Suicide & Crisis Lifeline: 988\n- House supervisor / Regional manager\n- On-call clinical staff (if applicable)\n- Nearest hospital (address and phone)\n- Your organization''s legal/risk contact\n\n### Arizona Good Samaritan Law\n\nArizona has a Good Samaritan law (A.R.S. § 36-2267) that provides limited legal protection to people who:\n- Call 911 for an overdose in good faith\n- Remain on scene and cooperate with responders\n\n**Important:** This law covers the person calling 911 and the person experiencing the overdose for possession charges related to the event. It does NOT cover all drug-related crimes. Always encourage residents (and staff) to call 911 immediately — the law is designed to remove barriers to calling for help.\n\n### Documentation After an Emergency\n\nWithin 24 hours of any emergency:\n1. Write a detailed incident report (see De-escalation course for documentation guidance)\n2. Notify your supervisor and complete any organizational reporting requirements\n3. Preserve any evidence if law enforcement may be involved\n4. Follow up with residents who were present and may be affected\n5. Document all contacts made (911, supervisor, family, etc.)',
  12, false),

('a0030200-0000-0000-0000-000000000001', 'c0000003-0000-0000-0000-000000000003', 2, 'Opioid Overdose Recognition & Narcan Administration', 'text', E'## Opioid Overdose Recognition & Narcan Administration\n\n### Why This Matters\n\nOpioid overdose is the most common life-threatening emergency in a recovery residence. Fentanyl and its analogs have made overdoses faster and more severe. Staff who recognize an overdose quickly and administer Narcan (naloxone) correctly save lives.\n\n**Narcan (naloxone) is:**\n- Safe — It has no effect on someone who has NOT taken opioids\n- Legal — Available without prescription in Arizona at most pharmacies and harm reduction programs\n- Effective — Reverses opioid overdose within 2-5 minutes\n\n### Recognizing an Opioid Overdose\n\n**The Opioid Overdose Triad:**\n1. **Unconsciousness / unresponsive** — Cannot be woken up by shouting or sternal rub\n2. **Slow/shallow or stopped breathing** — Fewer than 1 breath per 5 seconds, or none at all\n3. **Pinpoint pupils** — Very small, even in low light\n\n**Other signs:**\n- Blue or grayish lips, fingernails, or skin (cyanosis)\n- Gurgling or "death rattle" sound (airway obstruction)\n- Pale, clammy skin\n- Limp body\n- Snoring that is unusual or new\n\n**Distinguishing from sleep:**\n> *"If you cannot wake someone up by shouting their name, shaking their shoulder, or doing a sternal rub (knuckles pressed firmly on the breastbone), treat it as an overdose."*\n\n### Step-by-Step Narcan Administration\n\n#### Step 1: CALL 911 FIRST\nCall 911 before or simultaneously with administering Narcan. Narcan wears off in 30-90 minutes. The person may re-overdose. EMS is still required.\n\n#### Step 2: Try to Rouse the Person\n- Shout their name\n- Rub your knuckles firmly on the sternum (breastbone)\n- No response = proceed immediately\n\n#### Step 3: Rescue Breathing (if not breathing)\n- Tilt head back, lift chin to open airway\n- Give 1 breath every 5 seconds\n- Watch for chest rise\n- Continue until Narcan takes effect or EMS arrives\n\n#### Step 4: Administer Narcan Nasal Spray (Most Common in Houses)\n1. Remove device from packaging\n2. Hold the device with your thumb on the bottom and two fingers on the nozzle\n3. Tilt the person''s head back\n4. Insert the nozzle into one nostril\n5. Press the plunger firmly with your thumb\n6. If a second dose is available and no response after 2-3 minutes, administer in the other nostril\n\n#### Step 5: Recovery Position\nIf the person is breathing but unconscious:\n- Place them on their side (recovery position)\n- This prevents choking if they vomit\n- Stay with them until EMS arrives\n\n#### Step 6: Be Prepared for Withdrawal\nWhen Narcan reverses an opioid overdose, the person may wake up confused and in withdrawal. They may:\n- Be disoriented or combative\n- Demand more drugs\n- Try to leave\n\nStay calm. Reassure them. Do NOT give them more opioids "to help with withdrawal." Keep them calm and wait for EMS.\n\n### Narcan Storage and Replacement\n\n- Store at room temperature (59-77°F)\n- Check expiration dates quarterly\n- Replace immediately after use\n- Keep in an accessible, known location that all staff know\n- Some organizations post a red sticker where Narcan is kept\n\n### Arizona Narcan Access\n\nIn Arizona, Narcan is available without a prescription at:\n- Most pharmacies (CVS, Walgreens, Walmart)\n- AHCCCS (Arizona Medicaid) covers it for eligible individuals\n- Local harm reduction programs (often free)\n- Your organization''s medical liaison (if applicable)',
  16, true),

('a0030300-0000-0000-0000-000000000001', 'c0000003-0000-0000-0000-000000000003', 3, 'Post-Emergency Documentation & Follow-Up', 'text', E'## Post-Emergency Documentation & Follow-Up\n\n### Immediate Documentation (Within 2 Hours)\n\nAfter any emergency, complete an incident report while details are fresh:\n\n**Required information:**\n- Date, time, and exact location of incident\n- Name of person affected\n- Nature of emergency (overdose, medical, behavioral, safety)\n- Warning signs observed and when\n- Your response: who you called, what actions you took, in what order\n- Narcan administered: doses, times, response\n- EMS/police response: agency, badge numbers if available, actions taken\n- Witnesses present\n- Outcome: transported to hospital, refused transport, deceased (God forbid), stable\n\n### Notification Requirements\n\n| Who to Notify | When | Method |\n|---|---|---|\n| 911 | Immediately | Phone |\n| Supervisor | Immediately | Phone |\n| Organizational leadership | Within 1 hour | Phone/text |\n| Emergency contact (family) | Per resident consent | Phone |\n| Licensing/regulatory body | Per your license requirements | Per their process |\n\n### Follow-Up With Residents Present\n\nOther residents who witnessed an emergency may experience:\n- Trauma responses (anxiety, flashbacks, sleep disturbance)\n- Relapse risk (stress triggers)\n- Complicated emotions (guilt, anger, grief)\n\n**Within 24-48 hours:**\n- Check in individually with residents who were present\n- Offer connection to counseling or peer support\n- Hold an optional house meeting to process (with clinical guidance if available)\n- Watch for behavioral changes that may indicate relapse risk\n\n### After a Resident Is Hospitalized or Leaves\n\n- Follow your organization''s protocol for the bed (hold, release, make available)\n- Document all communications with hospital or treatment facility\n- Prepare for potential return with updated care plan\n\n### After a Fatality\n\nIf a resident dies:\n- Follow all law enforcement instructions (preserve the scene)\n- Contact your organization''s leadership and legal counsel immediately\n- Do NOT speak to media\n- Connect surviving residents with grief counseling\n- Complete all required governmental reporting\n- Review what happened and what could be improved — this is not to assign blame but to save lives in the future',
  12, true)
ON CONFLICT (id) DO NOTHING;

-- Quiz: Lesson 3-2
INSERT INTO public.lms_quiz_questions (lesson_id, sort_order, question, options_json, correct_index, explanation)
VALUES
('a0030200-0000-0000-0000-000000000001', 1,
  'What is the FIRST thing you should do when you suspect an opioid overdose?',
  '["Administer Narcan immediately","Call 911","Try to wake the person","Look for drugs in their room"]',
  1,
  'Always call 911 first or simultaneously with administering Narcan. Narcan wears off, and EMS may be needed for continued care.'),

('a0030200-0000-0000-0000-000000000001', 2,
  'Which THREE signs together indicate an opioid overdose?',
  '["Rapid pulse, dilated pupils, confusion","Unconsciousness, slow/stopped breathing, pinpoint pupils","High fever, sweating, talking rapidly","Vomiting, headache, and restlessness"]',
  1,
  'The opioid overdose triad is: unconsciousness/unresponsiveness, slow or stopped breathing, and pinpoint (very small) pupils.'),

('a0030200-0000-0000-0000-000000000001', 3,
  'Narcan (naloxone) is safe to administer because:',
  '["It works for any kind of drug overdose","It has no effect on someone who has not taken opioids","It is a stimulant that wakes people up","It prevents future overdoses"]',
  1,
  'Naloxone is an opioid antagonist that only works if opioids are present. It is safe to administer even if opioid use is only suspected — it will do nothing if opioids are not in the person''s system.'),

('a0030200-0000-0000-0000-000000000001', 4,
  'After administering Narcan, if there is no response within 2-3 minutes and a second dose is available:',
  '["Wait 10 more minutes before giving a second dose","Give the second dose in the other nostril","Do not give a second dose","Administer it in the same nostril"]',
  1,
  'If no response after 2-3 minutes, administer a second dose of Narcan in the other nostril. Fentanyl overdoses often require multiple doses.')
ON CONFLICT DO NOTHING;

-- Quiz: Lesson 3-3
INSERT INTO public.lms_quiz_questions (lesson_id, sort_order, question, options_json, correct_index, explanation)
VALUES
('a0030300-0000-0000-0000-000000000001', 1,
  'An incident report should be completed:',
  '["Within a week when you have time","Within 2 hours while details are fresh","Only if the person was hospitalized","Only if police were involved"]',
  1,
  'Incident reports should be completed as soon as possible — within 2 hours — to capture accurate details before memory fades.'),

('a0030300-0000-0000-0000-000000000001', 2,
  'After an overdose witnessed by other residents, you should:',
  '["Tell everyone it was not serious to avoid panic","Check in individually with witnesses within 24-48 hours","Move on without discussing it","Only talk to residents who ask about it"]',
  1,
  'Witnessing an overdose is traumatic. Residents need individual check-ins, and you should watch for increased relapse risk among those who witnessed the event.'),

('a0030300-0000-0000-0000-000000000001', 3,
  'Under Arizona''s Good Samaritan law, calling 911 for an overdose provides:',
  '["Complete immunity from all drug charges","No protection whatsoever","Limited protection for possession charges related to the overdose event","Protection only if the person survives"]',
  2,
  'Arizona''s Good Samaritan law provides limited protection for the caller and the overdose victim for possession charges related to that event. It is designed to encourage people to call 911 without fear of prosecution.')
ON CONFLICT DO NOTHING;


-- ── Course 4: Fair Housing Compliance ─────────────────────────
INSERT INTO public.lms_courses (id, title, description, category, cover_color, estimated_minutes, passing_score, is_required, sort_order)
VALUES ('c0000004-0000-0000-0000-000000000004',
  'Fair Housing Compliance for Recovery Residences',
  'Understand your legal obligations under the Fair Housing Act and ADA. Learn how to handle reasonable accommodation requests, avoid discriminatory practices, and protect your organization from liability.',
  'compliance', '#059669', 45, 80, true, 4)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.lms_lessons (id, course_id, sort_order, title, content_type, content_body, duration_minutes, has_quiz)
VALUES
('a0040100-0000-0000-0000-000000000001', 'c0000004-0000-0000-0000-000000000004', 1, 'Fair Housing Act Fundamentals', 'text', E'## Fair Housing Act Fundamentals\n\n### Why This Matters for Recovery Housing\n\nPeople in recovery are protected under federal law. Understanding the Fair Housing Act (FHA) and the Americans with Disabilities Act (ADA) is not just legally required — it is a fundamental part of operating ethically and avoiding serious liability.\n\nIn 2016, HUD issued guidance clarifying that **individuals in recovery from substance use disorder are protected under the FHA** as people with a disability.\n\n### The Fair Housing Act (FHA)\n\n**Protected Classes — Federal Law:**\n1. Race\n2. Color\n3. National Origin\n4. Religion\n5. Sex (including sexual orientation and gender identity)\n6. Familial Status\n7. **Disability** ← Most relevant to recovery housing\n\n**Arizona adds:** Ancestry, age (40+), marital status (state law)\n\n### How "Disability" Applies to Recovery Housing\n\nUnder the FHA, disability includes any physical or mental impairment that substantially limits a major life activity. This covers:\n- **Past substance use disorder** — Someone who used drugs in the past but is not currently using\n- **People in active recovery** who are not currently using\n- **People perceived as having** a substance use disorder\n\n**NOT covered:**\n- Current illegal drug users (people who are presently using illegal substances)\n\nThis distinction is critical. You can enforce house rules that prohibit active drug use, but you cannot discriminate against someone *because they have a history* of substance use disorder.\n\n### What FHA Protects Against\n\nThe FHA prohibits:\n- **Refusing to rent** based on a protected class\n- **Setting different terms and conditions** (e.g., higher rent, shorter leases) for protected class members\n- **Steering** — Directing people toward or away from certain rooms or houses based on protected characteristics\n- **Retaliation** against someone who exercises their fair housing rights\n- **Making discriminatory statements** in ads or during intake\n\n### Language That Can Get You in Trouble\n\nAvoid any language in ads, intake forms, or conversations that references protected classes:\n\n| Instead of... | Say... |\n|---|---|\n| "Males only" | "Single-gender residence" (then ensure consistent application) |\n| "We prefer a certain type" | [Don''t say this at all] |\n| "Are you a veteran?" [and using it to decide] | Don''t use protected characteristics to screen |\n\n### The Role of Zoning\n\nSome cities and counties have tried to use zoning laws to exclude recovery houses. Several protections exist:\n- Recovery houses with 6 or fewer residents in many states are treated as single-family homes\n- HUD has issued guidance that local zoning cannot be used to effectively prohibit recovery housing\n- Your legal counsel should advise on Arizona-specific zoning issues in your municipality',
  15, false),

('a0040200-0000-0000-0000-000000000001', 'c0000004-0000-0000-0000-000000000004', 2, 'Reasonable Accommodations & Modifications', 'text', E'## Reasonable Accommodations & Modifications\n\n### What Is a Reasonable Accommodation?\n\nA **reasonable accommodation** is a change in rules, policies, practices, or services that enables a person with a disability to have equal opportunity to use and enjoy a dwelling.\n\n**Examples in recovery housing context:**\n- A resident with mobility impairment requests a first-floor room → You must consider this\n- A resident in medication-assisted treatment (MAT) requests to store their medication → You must accommodate this\n- A resident with PTSD requests a single-occupancy room if available → You must engage in an interactive process\n\n### What Is a Reasonable Modification?\n\nA **reasonable modification** is a physical change to the dwelling that enables a person with a disability to use the facility.\n\n**Examples:**\n- Installing grab bars in a bathroom\n- Adding a handrail to stairs\n- Allowing a mobility-impaired resident to use a wheelchair\n\n### The Interactive Process\n\nWhen a resident requests an accommodation, you are required to engage in an **interactive process** — a good faith dialogue to find a workable solution.\n\n**Steps:**\n1. **Acknowledge the request** — Respond promptly (best practice: within 3-5 business days)\n2. **Verify the disability** (if not obvious) — You may ask for documentation from a healthcare provider that the person has a disability and that the accommodation is needed because of it. You may NOT ask for a specific diagnosis.\n3. **Evaluate the request** — Is it reasonable? Would it fundamentally alter your program or create an undue burden?\n4. **Respond in writing** — Approve, deny (with explanation), or offer an alternative\n\n### When Can You Deny a Request?\n\nYou may deny an accommodation request if it:\n- Would require a **fundamental alteration** of your program (e.g., you run a gender-specific house; accommodating a person of the opposite gender would fundamentally alter the program)\n- Would create an **undue financial or administrative burden**\n- Would pose a **direct threat** to the health or safety of others that cannot be eliminated or reduced to an acceptable level by the accommodation\n\n**Important:** You cannot deny based on speculation about what *might* happen. Denials must be based on individualized assessment of the specific person.\n\n### Medication-Assisted Treatment (MAT)\n\nThis is one of the most critical areas for recovery housing operators:\n\n- **You cannot ban residents from using prescribed MAT medications** (Suboxone, Methadone, Vivitrol) simply because of a "no medication" policy. That constitutes disability discrimination.\n- You may have operational rules around *how* medications are stored (e.g., locked box, directly administered by staff) to ensure house safety — but a blanket ban is illegal.\n- Organizations that receive federal funding have additional obligations under Section 504 of the Rehabilitation Act.\n\n### Documentation Best Practices\n\n- Keep a written log of all accommodation requests and your responses\n- Date every communication\n- Store in a confidential file separate from the general resident file\n- When in doubt, consult your legal counsel before denying',
  15, true),

('a0040300-0000-0000-0000-000000000001', 'c0000004-0000-0000-0000-000000000004', 3, 'Avoiding Common Violations', 'text', E'## Avoiding Common Fair Housing Violations\n\n### The Most Common Violations in Recovery Housing\n\n#### 1. Discriminatory Advertising and Intake Questions\n\nAny statement that expresses a preference, limitation, or discrimination based on a protected class is illegal — even if unintentional.\n\n**Problematic:**\n- "We prefer residents who have family support in the area"\n- Asking "Do you have children?" during intake to determine if someone can live there\n- Advertising "this is a sober home for [specific religious denomination]" in a way that excludes others\n\n**Safe approach:**\n- Describe your program: "gender-specific recovery residence," "12-step supportive environment," "minimum 30 days sobriety required at intake"\n- Intake questions should focus on program eligibility, not protected characteristics\n\n#### 2. MAT Bans (Medication-Assisted Treatment)\n\nAs covered in Lesson 2: blanket MAT bans violate the FHA. If your house currently prohibits MAT, you need legal counsel before enforcing that policy against a resident who has a prescription.\n\n#### 3. Retaliating Against Residents Who File Complaints\n\nIf a resident files a fair housing complaint — even if you believe it is unfounded — you cannot:\n- Evict or threaten to evict them\n- Change their room assignment\n- Reduce services provided\n- Treat them differently in any negative way\n\nRetaliation is a separate FHA violation that carries significant penalties.\n\n#### 4. Inconsistent Rule Enforcement\n\nEnforcing house rules differently based on protected characteristics is discrimination.\n\n**Example:** You evict resident A for missing curfew but give resident B (same rule violation) a second chance. If the difference between them is a protected characteristic, you have a problem.\n\n**Solution:** Apply rules consistently. Document every rule violation and every consequence. Use a graduated discipline policy applied uniformly.\n\n#### 5. Neighbor/Community Pressure\n\nNeighbor complaints about your recovery house ("not in my backyard") do not give you permission to take discriminatory action against residents. If you receive pressure from neighbors, local officials, or HOAs, consult legal counsel before acting.\n\n### Responding to a Fair Housing Complaint\n\n1. **Do not retaliate** — Immediately stop any action that could be seen as retaliation\n2. **Preserve records** — Do not destroy any documentation related to the complaint\n3. **Notify leadership** immediately\n4. **Consult legal counsel** before responding to HUD or state fair housing agencies\n5. **Cooperate** — HUD has broad investigative authority; non-cooperation creates additional problems\n\n### Training and Documentation Protect You\n\nOrganizations that can demonstrate:\n- Regular fair housing training for all staff\n- Written non-discrimination policies\n- Consistent, documented rule enforcement\n- Timely and good-faith responses to accommodation requests\n\n...are far better positioned to defend against complaints and demonstrate compliance.',
  10, true)
ON CONFLICT (id) DO NOTHING;

-- Quiz: Lesson 4-2
INSERT INTO public.lms_quiz_questions (lesson_id, sort_order, question, options_json, correct_index, explanation)
VALUES
('a0040200-0000-0000-0000-000000000001', 1,
  'Under the Fair Housing Act, people in recovery from substance use disorder are protected as:',
  '["A special class unique to recovery housing law","People with a disability","Preferred tenants with extra rights","Not protected — recovery is a choice"]',
  1,
  'HUD guidance clarifies that individuals in recovery from substance use disorder are protected under the Fair Housing Act''s disability provisions. This has been confirmed in multiple court decisions.'),

('a0040200-0000-0000-0000-000000000001', 2,
  'When a resident requests a reasonable accommodation, you must:',
  '["Automatically approve all requests","Engage in a good-faith interactive process to find a workable solution","Deny it if it costs any money","Only respond if it is in writing"]',
  1,
  'The FHA requires engaging in an interactive process — a good-faith dialogue — to find a reasonable solution. Automatic approval or denial without this process violates the law.'),

('a0040200-0000-0000-0000-000000000001', 3,
  'Can you maintain a blanket policy banning all Medication-Assisted Treatment (MAT) medications?',
  '["Yes, it is your house and your rules","No, this constitutes disability discrimination under the FHA","Yes, if you inform residents before move-in","Only if local zoning supports it"]',
  1,
  'A blanket ban on MAT medications violates the Fair Housing Act because it discriminates against people with substance use disorder who are using legally prescribed medications. You may have reasonable storage rules, but you cannot ban MAT outright.'),

('a0040200-0000-0000-0000-000000000001', 4,
  'When verifying disability for an accommodation request, you may ask for:',
  '["A complete medical history","The specific diagnosis","Documentation that the person has a disability and that the accommodation is related to it","Nothing — you must take their word for it"]',
  2,
  'You may request documentation from a healthcare provider verifying (1) the person has a disability and (2) the accommodation is needed because of the disability. You may NOT ask for a specific diagnosis or detailed medical records.')
ON CONFLICT DO NOTHING;

-- Quiz: Lesson 4-3
INSERT INTO public.lms_quiz_questions (lesson_id, sort_order, question, options_json, correct_index, explanation)
VALUES
('a0040300-0000-0000-0000-000000000001', 1,
  'If a resident files a fair housing complaint against your organization, you should:',
  '["Evict them before they can cause more trouble","Immediately stop any actions that could be seen as retaliation and consult legal counsel","Ignore it — unfounded complaints have no consequences","Tell other residents about the complaint"]',
  1,
  'Retaliation against someone who files a fair housing complaint is a separate FHA violation. Preserve records, stop any potentially retaliatory actions, and consult legal counsel immediately.'),

('a0040300-0000-0000-0000-000000000001', 2,
  'Which intake question is potentially problematic?',
  '["Have you been sober for 30+ days?","Do you have any criminal convictions for violent crimes?","Do you have children living with you?","Are you committed to maintaining sobriety?"]',
  2,
  'Asking about children could be used to screen out people based on familial status, which is a protected class under the FHA. Questions should focus on program eligibility, not protected characteristics.'),

('a0040300-0000-0000-0000-000000000001', 3,
  'Inconsistent rule enforcement becomes a fair housing issue when:',
  '["You give one resident a second chance but not another","The inconsistency appears to correlate with a protected characteristic","Only if a complaint is filed first","Only if the rule is written in the house agreement"]',
  1,
  'Enforcing rules differently based on protected characteristics is discrimination. Even if unintentional, patterns of inconsistent enforcement can create significant liability.')
ON CONFLICT DO NOTHING;


-- ── Course 5: NARR Standards & Ethics ─────────────────────────
INSERT INTO public.lms_courses (id, title, description, category, cover_color, estimated_minutes, passing_score, is_required, sort_order)
VALUES ('c0000005-0000-0000-0000-000000000005',
  'NARR Standards & Ethics in Recovery Housing',
  'Understand the National Alliance for Recovery Residences (NARR) standards and how they define quality recovery housing. Learn the ethical responsibilities of operators and staff, and how to apply NARR principles in daily operations.',
  'standards', '#d97706', 40, 80, false, 5)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.lms_lessons (id, course_id, sort_order, title, content_type, content_body, duration_minutes, has_quiz)
VALUES
('a0050100-0000-0000-0000-000000000001', 'c0000005-0000-0000-0000-000000000005', 1, 'Introduction to NARR & Recovery Residence Standards', 'text', E'## Introduction to NARR & Recovery Residence Standards\n\n### What Is NARR?\n\nThe **National Alliance for Recovery Residences (NARR)** is the leading national organization that sets quality standards for recovery residences across the United States. Founded in 2011, NARR''s mission is to expand the availability of high-quality, ethically-operated recovery housing.\n\nNARR has established a framework that:\n- Defines four levels of recovery residence support\n- Sets minimum quality standards for operators\n- Provides certification that distinguishes quality programs from problematic "sober home" operators\n- Advocates at the state and federal level for recovery housing\n\n### Why NARR Certification Matters\n\n**For your organization:**\n- Demonstrates commitment to quality and ethics\n- Provides protection against regulatory scrutiny\n- Required by some state agencies and funders\n- Distinguishes you from unethical operators who exploit residents\n\n**For residents:**\n- Assurance of minimum quality standards\n- Protection from exploitation\n- Access to a peer accountability network\n\n**For the broader community:**\n- Builds trust with neighbors, officials, and stakeholders\n- Shows recovery housing can be a positive community asset\n\n### The Four NARR Levels of Support\n\n| Level | Name | Description | Example |\n|---|---|---|---|\n| Level I | Peer-Run | Resident-managed, minimal supervision | Oxford Houses |\n| Level II | Monitored | House manager on site, structured rules | Typical sober home |\n| Level III | Supervised | Clinical supervision available, more structure | Transitional living with case management |\n| Level IV | Service Provider | Co-located with clinical services | Residential treatment step-down |\n\nMost independent sober living homes operate at Level II. Understanding which level you are operating at determines which standards apply to you.\n\n### Core NARR Domains\n\nNARR standards cover these key domains:\n\n1. **Administrative** — Organizational structure, policies, record-keeping\n2. **Physical Environment** — Safety, habitability, cleanliness\n3. **Recovery Support** — What recovery services/supports are provided\n4. **Rights and Responsibilities** — How residents are treated\n5. **Ethics and Accountability** — Financial practices, staff conduct, transparency\n\n### Arizona NARR Affiliate\n\nArizona''s NARR affiliate is **Arizona Recovery Housing Association (ARHA)**. Organizations seeking NARR certification in Arizona should contact ARHA for the certification process, which includes:\n- Application and organizational documentation review\n- Site inspection\n- Staff training verification (this course helps satisfy that requirement)\n- Ongoing compliance monitoring\n- Annual renewal\n\n### Outcomes That NARR Standards Support\n\nResearch consistently shows that residents in NARR-certified housing have:\n- Higher rates of continuous sobriety\n- Greater employment rates\n- Lower rates of criminal justice involvement\n- Better long-term recovery outcomes\n\nQuality standards are not red tape — they are the foundation of effective recovery support.',
  15, false),

('a0050200-0000-0000-0000-000000000001', 'c0000005-0000-0000-0000-000000000005', 2, 'Operator Responsibilities Under NARR', 'text', E'## Operator Responsibilities Under NARR\n\n### Physical Environment Standards\n\nNARR requires that recovery residences meet minimum habitability standards:\n\n**Safety:**\n- Working smoke and carbon monoxide detectors on every level\n- Fire extinguishers in kitchen and common areas (inspected annually)\n- Emergency egress clearly marked and unobstructed\n- First aid kit accessible and stocked\n- Narcan available on site and staff trained in use\n- Pest control and clean living conditions\n\n**Privacy and Space:**\n- Maximum occupancy per bedroom (typically 2-4 per room, depending on square footage)\n- Secure space for resident valuables\n- Residents have access to laundry facilities\n- Working kitchen with sufficient equipment\n\n**Maintenance:**\n- Responsive maintenance system\n- Written maintenance request process\n- Repairs addressed in reasonable timeframe\n\n### Administrative Standards\n\n**Required Policies and Documentation:**\n- Written house rules and resident agreement (signed at intake)\n- Non-discrimination policy\n- Grievance procedure for residents\n- Staff hiring criteria and background check policy\n- Emergency procedures posted in the house\n- Financial management policies (no commingling of resident funds)\n\n**Financial Ethics:**\n- Fees clearly disclosed before move-in (no hidden charges)\n- Security deposits handled per state law\n- Written receipts for all financial transactions\n- No fee charging for required services (e.g., drug tests should not be a profit center)\n- Residents not charged fees they did not agree to in writing\n\n### Staff Training Requirements (Level II+)\n\nNARR requires that all staff complete training in:\n- Recovery support principles\n- Substance use disorder basics\n- Trauma-informed care\n- Fair housing and civil rights\n- Emergency response (including Narcan administration)\n- Ethical boundaries in recovery settings\n\nThis course you are taking now fulfills part of these requirements.\n\n### Resident Rights Under NARR\n\nAll residents in NARR-certified housing have the right to:\n\n1. **Privacy** — Personal space and confidentiality of their recovery information\n2. **Grievance** — A fair process to raise concerns without fear of retaliation\n3. **Safe Environment** — Freedom from harassment, abuse, and exploitation by staff or other residents\n4. **Accurate Information** — Truthful representation of services, costs, and expectations before move-in\n5. **Voluntary Participation** — No involuntary detention; residents can leave at any time\n6. **Non-Discrimination** — Per fair housing law\n7. **Due Process** — Notice and an opportunity to respond before disciplinary action or discharge\n\n### The Problem Operator Pattern\n\nNARR certification exists in part to distinguish quality operators from those who exploit people in recovery. Warning signs of problematic operators:\n\n- Overcharging for poor conditions\n- "Patient brokering" — receiving kickbacks for referring residents to treatment\n- Requiring residents to attend specific treatment programs as a condition of housing\n- Creating financial dependency (controlling residents'' SNAP or SSI benefits)\n- Operating without any written agreements\n- Unsanitary or unsafe conditions\n\nIf you encounter these practices — whether in your own organization or another — you have an ethical obligation to report.',
  15, true),

('a0050300-0000-0000-0000-000000000001', 'c0000005-0000-0000-0000-000000000005', 3, 'Ethics & Professional Boundaries in Recovery Housing', 'text', E'## Ethics & Professional Boundaries in Recovery Housing\n\n### Why Boundaries Matter in Recovery Housing\n\nRecovery housing staff are in positions of significant power over residents who are often vulnerable, grateful, and seeking support. This dynamic creates real risks of boundary violations — some intentional, some not.\n\nBoundary violations harm residents, undermine the therapeutic value of the recovery residence, create legal and organizational liability, and damage the entire recovery housing sector''s reputation.\n\n### Core Ethical Principles\n\n**1. Role Clarity**\nYou are a house manager/staff member, not a therapist, sponsor, friend, or family member. Your role is to enforce house rules, create a safe environment, and support residents'' recovery — not to provide clinical treatment.\n\n**2. Confidentiality**\nInformation shared by residents in the context of their recovery (relapse history, mental health, medications, family issues) is confidential. Share only what is needed, with those who need it, for legitimate program purposes.\n\n**3. Non-exploitation**\nNever use your position of authority for personal gain — financial, emotional, or otherwise.\n\n### Common Boundary Violations\n\n| Violation | Example | Why It''s Harmful |\n|---|---|---|\n| Dual relationships | Hiring a resident to do personal errands for pay | Creates power imbalance; complicates professional relationship |\n| Financial boundary violations | Borrowing money from or lending money to residents | Creates dependency and resentment |\n| Over-sharing personal information | Telling residents about your own recovery in detail | Shifts focus from resident to staff; may create false peer relationship |\n| Romantic or sexual relationships | Any romantic involvement with a current resident | Exploitation of vulnerability; likely illegal depending on jurisdiction |\n| Favoritism | Enforcing rules differently for a resident you like | Unfair; creates house conflict; potential FHA issues |\n| Confidentiality violations | Sharing resident health info with unauthorized parties | HIPAA-adjacent; trust-destroying |\n\n### The Dual Relationship Challenge\n\nOne of the most complex ethical issues in recovery housing is that some staff members are themselves in recovery. This can be both a strength and a challenge:\n\n**Strengths:** Lived experience, genuine empathy, credibility with residents\n\n**Risks:** Over-identification with residents, sharing too much personal recovery story, relaxing rules out of empathy, blurring the line between peer and authority\n\n**Guidelines:**\n- Share your recovery experience sparingly and only when it directly serves the resident\n- Maintain role clarity at all times\n- Use clinical supervision or peer consultation if you find yourself overly involved with a resident''s situation\n\n### Recognizing and Responding to Your Own Warning Signs\n\nYou may be developing an inappropriate boundary issue if you find yourself:\n- Thinking about a specific resident outside of work regularly\n- Doing favors for one resident that you wouldn''t do for others\n- Keeping information about a resident secret from your supervisor\n- Feeling that your relationship with a resident is "special" or different\n- Feeling defensive when a supervisor raises concerns about your interactions with a resident\n\n**What to do:** Talk to your supervisor. Boundary issues that are caught early are manageable. They do not have to become career-ending or resident-harming events.\n\n### Reporting Unethical Conduct\n\nIf you observe a colleague violating ethical standards:\n\n1. Document what you observed (date, time, what you saw/heard)\n2. Report to your supervisor or, if the supervisor is involved, to the next level of leadership\n3. Contact ARHA or your state''s recovery housing regulatory body if internal reporting is inadequate\n\nYou have an obligation to report. Staying silent makes you complicit in harm to a vulnerable person.',
  10, true)
ON CONFLICT (id) DO NOTHING;

-- Quiz: Lesson 5-2
INSERT INTO public.lms_quiz_questions (lesson_id, sort_order, question, options_json, correct_index, explanation)
VALUES
('a0050200-0000-0000-0000-000000000001', 1,
  'A NARR Level II recovery residence is best described as:',
  '["Resident-managed with no professional oversight","Monitored with a house manager on site and structured rules","Co-located with full clinical treatment services","Supervised by licensed clinical staff"]',
  1,
  'NARR Level II is "Monitored" — typically a house manager is present on site with structured house rules. Most independent sober living homes operate at this level.'),

('a0050200-0000-0000-0000-000000000001', 2,
  'Under NARR standards, charging residents for drug tests is:',
  '["Required for accountability","Acceptable if disclosed in the house agreement","A conflict of interest and potential financial ethics violation","Standard practice in recovery housing"]',
  2,
  'NARR''s financial ethics standards state that required services should not be profit centers. Charging residents for mandatory drug tests is a red flag and may constitute exploitation.'),

('a0050200-0000-0000-0000-000000000001', 3,
  'A resident has the right to leave a recovery residence at any time. This reflects which NARR principle?',
  '["Non-discrimination","Voluntary participation","Grievance rights","Due process"]',
  1,
  'NARR standards require that participation be voluntary. Residents cannot be detained. If a resident wants to leave, they may do so — staff can express concern and document, but cannot prevent departure.'),

('a0050200-0000-0000-0000-000000000001', 4,
  '"Patient brokering" in recovery housing refers to:',
  '["Helping residents find clinical treatment","Receiving kickbacks for referring residents to specific treatment programs","Managing intake paperwork efficiently","Providing peer support services"]',
  1,
  'Patient brokering is an illegal and unethical practice where a recovery house receives financial kickbacks for steering residents to specific treatment facilities. It is a federal crime under the Anti-Kickback Statute.')
ON CONFLICT DO NOTHING;

-- Quiz: Lesson 5-3
INSERT INTO public.lms_quiz_questions (lesson_id, sort_order, question, options_json, correct_index, explanation)
VALUES
('a0050300-0000-0000-0000-000000000001', 1,
  'Which of the following is a boundary violation in recovery housing?',
  '["Enforcing house rules consistently for all residents","Sharing your own detailed recovery history with a resident regularly","Reporting a safety concern to your supervisor","Maintaining written documentation of resident agreements"]',
  1,
  'Regularly sharing detailed personal recovery history with residents blurs the professional boundary between staff and peer, shifts focus from the resident to the staff member, and can create inappropriate role confusion.'),

('a0050300-0000-0000-0000-000000000001', 2,
  'A staff member who is also in recovery should share their personal recovery story:',
  '["As often as possible to build rapport","Never — it is always inappropriate","Sparingly and only when it directly serves the resident","With all residents during the intake process"]',
  2,
  'Staff who are in recovery can draw on that experience, but personal disclosures should be limited to situations where they genuinely serve the resident. Over-sharing creates boundary confusion.'),

('a0050300-0000-0000-0000-000000000001', 3,
  'If you observe a colleague violating ethical standards, the first step is to:',
  '["Confront the colleague publicly in front of residents","Document what you observed and report to your supervisor","Stay silent to avoid conflict","Warn the resident involved"]',
  1,
  'Document and report. Internal reporting channels exist for this purpose. Staying silent makes you complicit in harm. If your supervisor is involved, escalate to the next level of leadership.'),

('a0050300-0000-0000-0000-000000000001', 4,
  'Which situation MOST clearly indicates a developing boundary problem?',
  '["You document all resident interactions","You enforce the same rules for all residents","You keep information about a specific resident secret from your supervisor because you feel protective","You refer a resident to their case manager"]',
  2,
  'Keeping resident information from your supervisor out of protectiveness is a clear warning sign of over-involvement. Transparency with your supervisor is a hallmark of appropriate professional boundaries.')
ON CONFLICT DO NOTHING;
