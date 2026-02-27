-- ============================================================
-- CHECKLISTS ENGINE
-- Tables: checklist_templates, checklists, checklist_items,
--         checklist_item_attachments, checklist_audit_log
-- Also: pre-seed 5 checklist templates and 5 document templates
-- ============================================================

-- ============================================================
-- checklist_templates: master templates with items JSONB
-- ============================================================
CREATE TABLE public.checklist_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN (
    'new_house_startup','staff_onboarding','resident_intake',
    'adhs_renewal','monthly_ops'
  )),
  estimated_days INTEGER,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.checklist_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users full access to checklist_templates"
  ON public.checklist_templates FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE INDEX idx_checklist_templates_category ON public.checklist_templates(category);

CREATE TRIGGER update_checklist_templates_updated_at
  BEFORE UPDATE ON public.checklist_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- checklists: instances of templates
-- ============================================================
CREATE TABLE public.checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES public.checklist_templates(id) ON DELETE SET NULL,
  house_id UUID REFERENCES public.houses(id) ON DELETE SET NULL,
  resident_id UUID REFERENCES public.residents(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'not_started'
    CHECK (status IN ('not_started','in_progress','completed','cancelled')),
  assignee TEXT,
  due_date DATE,
  start_date DATE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_by TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.checklists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users full access to checklists"
  ON public.checklists FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE INDEX idx_checklists_template_id ON public.checklists(template_id);
CREATE INDEX idx_checklists_status ON public.checklists(status);
CREATE INDEX idx_checklists_house_id ON public.checklists(house_id);
CREATE INDEX idx_checklists_due_date ON public.checklists(due_date);

CREATE TRIGGER update_checklists_updated_at
  BEFORE UPDATE ON public.checklists
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- checklist_items: individual items within a checklist instance
-- depends_on stores template_item_id strings from the same template
-- ============================================================
CREATE TABLE public.checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_id UUID NOT NULL REFERENCES public.checklists(id) ON DELETE CASCADE,
  template_item_id TEXT,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','in_progress','completed','skipped','blocked')),
  assignee TEXT,
  due_date DATE,
  completed_at TIMESTAMP WITH TIME ZONE,
  completed_by TEXT,
  depends_on TEXT[] DEFAULT '{}'::TEXT[],
  notes TEXT,
  is_required BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.checklist_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users full access to checklist_items"
  ON public.checklist_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE INDEX idx_checklist_items_checklist_id ON public.checklist_items(checklist_id);
CREATE INDEX idx_checklist_items_status ON public.checklist_items(status);
CREATE INDEX idx_checklist_items_order ON public.checklist_items(checklist_id, order_index);

CREATE TRIGGER update_checklist_items_updated_at
  BEFORE UPDATE ON public.checklist_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- checklist_item_attachments: file attachments on items
-- ============================================================
CREATE TABLE public.checklist_item_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_item_id UUID NOT NULL REFERENCES public.checklist_items(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  uploaded_by TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.checklist_item_attachments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users full access to checklist_item_attachments"
  ON public.checklist_item_attachments FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE INDEX idx_cia_item_id ON public.checklist_item_attachments(checklist_item_id);

-- ============================================================
-- checklist_audit_log: audit trail for checklist changes
-- ============================================================
CREATE TABLE public.checklist_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_id UUID NOT NULL REFERENCES public.checklists(id) ON DELETE CASCADE,
  checklist_item_id UUID REFERENCES public.checklist_items(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  old_value JSONB,
  new_value JSONB,
  performed_by TEXT,
  performed_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.checklist_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users full access to checklist_audit_log"
  ON public.checklist_audit_log FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE INDEX idx_cal_checklist_id ON public.checklist_audit_log(checklist_id);
CREATE INDEX idx_cal_performed_at ON public.checklist_audit_log(performed_at DESC);

-- ============================================================
-- Supabase Storage bucket for checklist attachments
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('checklist-attachments', 'checklist-attachments', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Allow authenticated users to manage checklist attachments"
  ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'checklist-attachments')
  WITH CHECK (bucket_id = 'checklist-attachments');

-- ============================================================
-- SEED: 5 Checklist Templates
-- ============================================================

-- ---------------------------------------------------------------
-- Template 1: New House Startup (83 items)
-- ---------------------------------------------------------------
INSERT INTO public.checklist_templates (id, name, description, category, estimated_days, items)
VALUES (
  '10000000-0000-0000-0000-000000000001',
  'New House Startup',
  'Complete startup checklist for opening a new sober living facility in Arizona. Covers licensing, physical setup, staffing, policies, financial setup, marketing, and resident-facing preparations.',
  'new_house_startup',
  90,
  '[
    {"id":"L01","title":"Register business with AZ Corporation Commission","description":"File Articles of Organization (LLC) or Articles of Incorporation. Takes 3-5 business days online at azcc.gov.","category":"Legal & Licensing","order_index":1,"estimated_days":5,"depends_on":[],"default_assignee_role":"director","is_required":true},
    {"id":"L02","title":"Obtain EIN from IRS","description":"Apply for Employer Identification Number at IRS.gov. Free and immediate online.","category":"Legal & Licensing","order_index":2,"estimated_days":1,"depends_on":["L01"],"default_assignee_role":"director","is_required":true},
    {"id":"L03","title":"Obtain Arizona business license","description":"Apply for state and local business license through AZ Dept of Revenue and city/county.","category":"Legal & Licensing","order_index":3,"estimated_days":5,"depends_on":["L01"],"default_assignee_role":"director","is_required":true},
    {"id":"L04","title":"Obtain zoning approval / conditional use permit","description":"Confirm property zoning allows sober living. Apply for conditional use permit if required by municipality.","category":"Legal & Licensing","order_index":4,"estimated_days":30,"depends_on":[],"default_assignee_role":"director","is_required":true},
    {"id":"L05","title":"Submit ADHS behavioral health license application","description":"Complete application at ADHS.gov. Required for certified sober living homes. Requires EIN, business license, floor plan, and policies.","category":"Legal & Licensing","order_index":5,"estimated_days":60,"depends_on":["L01","L02","L03","L04"],"default_assignee_role":"director","is_required":true},
    {"id":"L06","title":"Submit facility floor plan to ADHS","description":"Provide detailed floor plan showing room dimensions, exits, and fire safety equipment placement.","category":"Legal & Licensing","order_index":6,"estimated_days":2,"depends_on":["L04"],"default_assignee_role":"director","is_required":true},
    {"id":"L07","title":"Schedule ADHS pre-licensing inspection","description":"Contact ADHS to schedule the required pre-licensing site inspection.","category":"Legal & Licensing","order_index":7,"estimated_days":14,"depends_on":["L05","L06"],"default_assignee_role":"director","is_required":true},
    {"id":"L08","title":"Pass ADHS pre-licensing inspection","description":"ADHS inspector visits facility. Ensure all safety, staffing, and policy requirements are met.","category":"Legal & Licensing","order_index":8,"estimated_days":1,"depends_on":["L07"],"default_assignee_role":"director","is_required":true},
    {"id":"L09","title":"Receive ADHS license certificate","description":"After passing inspection, ADHS issues official license certificate. Post in visible location.","category":"Legal & Licensing","order_index":9,"estimated_days":14,"depends_on":["L08"],"default_assignee_role":"director","is_required":true},
    {"id":"L10","title":"Apply for NARR certification","description":"Submit application to National Alliance for Recovery Residences for Level 2 or Level 3 certification.","category":"Legal & Licensing","order_index":10,"estimated_days":30,"depends_on":["L09"],"default_assignee_role":"director","is_required":false},
    {"id":"L11","title":"NARR certification inspection","description":"Schedule and pass NARR peer recovery specialist inspection for certification.","category":"Legal & Licensing","order_index":11,"estimated_days":7,"depends_on":["L10"],"default_assignee_role":"director","is_required":false},
    {"id":"L12","title":"Register as AHCCCS behavioral health provider","description":"If billing Arizona Medicaid (AHCCCS), register as a behavioral health provider through AHCCCS provider portal.","category":"Legal & Licensing","order_index":12,"estimated_days":30,"depends_on":["L01","L02"],"default_assignee_role":"director","is_required":false},
    {"id":"L13","title":"Obtain NPI (National Provider Identifier)","description":"Apply for NPI number at NPPES.cms.hhs.gov. Required if billing insurance or Medicaid.","category":"Legal & Licensing","order_index":13,"estimated_days":5,"depends_on":["L01","L02"],"default_assignee_role":"director","is_required":false},
    {"id":"P01","title":"Complete purchase or lease agreement","description":"Execute purchase contract or residential lease agreement for the facility property.","category":"Physical Setup & Safety","order_index":14,"estimated_days":14,"depends_on":[],"default_assignee_role":"director","is_required":true},
    {"id":"P02","title":"Obtain property inspection report","description":"Hire licensed inspector to identify structural, plumbing, electrical, and safety issues.","category":"Physical Setup & Safety","order_index":15,"estimated_days":3,"depends_on":["P01"],"default_assignee_role":"director","is_required":true},
    {"id":"P03","title":"Complete required repairs from inspection","description":"Address all items flagged in property inspection report before occupancy.","category":"Physical Setup & Safety","order_index":16,"estimated_days":14,"depends_on":["P02"],"default_assignee_role":"director","is_required":true},
    {"id":"P04","title":"Install smoke detectors in all rooms","description":"Place smoke detectors in every bedroom, hallway, and common area per AZ fire code.","category":"Physical Setup & Safety","order_index":17,"estimated_days":1,"depends_on":["P01"],"default_assignee_role":"director","is_required":true},
    {"id":"P05","title":"Install carbon monoxide detectors","description":"Install CO detectors on each floor and near sleeping areas per ARS 36-1517.","category":"Physical Setup & Safety","order_index":18,"estimated_days":1,"depends_on":["P01"],"default_assignee_role":"director","is_required":true},
    {"id":"P06","title":"Install fire extinguishers (per floor + kitchen)","description":"Mount ABC-rated fire extinguishers on each floor and in the kitchen. Ensure they are inspected.","category":"Physical Setup & Safety","order_index":19,"estimated_days":1,"depends_on":["P01"],"default_assignee_role":"director","is_required":true},
    {"id":"P07","title":"Post emergency exit routes on each floor","description":"Create and laminate exit route maps for each floor showing emergency exits and assembly point.","category":"Physical Setup & Safety","order_index":20,"estimated_days":1,"depends_on":["P01"],"default_assignee_role":"director","is_required":true},
    {"id":"P08","title":"Set up first aid kits on all floors","description":"Stock OSHA-compliant first aid kits on each floor and in the kitchen area.","category":"Physical Setup & Safety","order_index":21,"estimated_days":1,"depends_on":["P01"],"default_assignee_role":"director","is_required":true},
    {"id":"P09","title":"Install exterior security cameras","description":"Install weatherproof cameras at all entry/exit points and perimeter. Ensure recording is functional.","category":"Physical Setup & Safety","order_index":22,"estimated_days":2,"depends_on":["P01"],"default_assignee_role":"director","is_required":true},
    {"id":"P10","title":"Install door locks and keypad entry system","description":"Install deadbolt locks on all exterior doors. Install keypad entry for main entrance.","category":"Physical Setup & Safety","order_index":23,"estimated_days":1,"depends_on":["P01"],"default_assignee_role":"director","is_required":true},
    {"id":"P11","title":"Obtain Certificate of Occupancy","description":"Schedule final inspection with local building department to obtain CO. Required before any residents move in.","category":"Physical Setup & Safety","order_index":24,"estimated_days":7,"depends_on":["L08","P03"],"default_assignee_role":"director","is_required":true},
    {"id":"P12","title":"Furnish all bedrooms (beds, dressers, linens)","description":"Purchase and install twin or full beds, dressers, and provide bedding for all resident rooms.","category":"Physical Setup & Safety","order_index":25,"estimated_days":3,"depends_on":["P01"],"default_assignee_role":"director","is_required":true},
    {"id":"P13","title":"Furnish common areas (living room, dining room)","description":"Set up seating, dining table, TV, and other furnishings in shared spaces.","category":"Physical Setup & Safety","order_index":26,"estimated_days":2,"depends_on":["P01"],"default_assignee_role":"director","is_required":true},
    {"id":"P14","title":"Set up kitchen appliances","description":"Ensure refrigerator, stove/oven, microwave, and dishwasher are functional. Stock basic cookware.","category":"Physical Setup & Safety","order_index":27,"estimated_days":2,"depends_on":["P01"],"default_assignee_role":"director","is_required":true},
    {"id":"P15","title":"Set up laundry facilities","description":"Ensure washer and dryer are functional and accessible to residents. Post laundry schedule.","category":"Physical Setup & Safety","order_index":28,"estimated_days":1,"depends_on":["P01"],"default_assignee_role":"director","is_required":true},
    {"id":"P16","title":"Conduct initial safety walkthrough","description":"Walk the entire facility to verify all safety equipment is installed and functional before opening.","category":"Physical Setup & Safety","order_index":29,"estimated_days":1,"depends_on":["P04","P05","P06","P07","P08","P09","P10"],"default_assignee_role":"house_manager","is_required":true},
    {"id":"P17","title":"Test all smoke and CO alarms","description":"Trigger test on every detector and replace any with dead batteries. Document test date.","category":"Physical Setup & Safety","order_index":30,"estimated_days":1,"depends_on":["P04","P05"],"default_assignee_role":"house_manager","is_required":true},
    {"id":"P18","title":"Post emergency evacuation plan","description":"Display laminated evacuation map at each floor exit and near the main entrance.","category":"Physical Setup & Safety","order_index":31,"estimated_days":1,"depends_on":["P16"],"default_assignee_role":"house_manager","is_required":true},
    {"id":"U01","title":"Set up electricity account","description":"Transfer or open utility account with local electric provider (APS or SRP in Phoenix metro).","category":"Utilities & Services","order_index":32,"estimated_days":2,"depends_on":["P01"],"default_assignee_role":"director","is_required":true},
    {"id":"U02","title":"Set up gas account","description":"Open account with Southwest Gas. Schedule meter activation if needed.","category":"Utilities & Services","order_index":33,"estimated_days":2,"depends_on":["P01"],"default_assignee_role":"director","is_required":true},
    {"id":"U03","title":"Set up water and sewer account","description":"Transfer water/sewer account with city or private provider.","category":"Utilities & Services","order_index":34,"estimated_days":2,"depends_on":["P01"],"default_assignee_role":"director","is_required":true},
    {"id":"U04","title":"Set up trash and recycling service","description":"Establish trash pickup service with city or private waste hauler.","category":"Utilities & Services","order_index":35,"estimated_days":2,"depends_on":["P01"],"default_assignee_role":"director","is_required":true},
    {"id":"U05","title":"Set up internet and WiFi","description":"Install high-speed internet. Configure WiFi with separate resident and staff networks.","category":"Utilities & Services","order_index":36,"estimated_days":5,"depends_on":["P01"],"default_assignee_role":"director","is_required":true},
    {"id":"U06","title":"Set up facility phone line","description":"Install landline or VoIP phone at main entrance or office for resident and staff use.","category":"Utilities & Services","order_index":37,"estimated_days":3,"depends_on":["P01"],"default_assignee_role":"director","is_required":false},
    {"id":"S01","title":"Post House Manager job listing","description":"Post position on Indeed, Idealist, and local behavioral health networks. Include certification requirements.","category":"Staffing & HR","order_index":38,"estimated_days":14,"depends_on":[],"default_assignee_role":"director","is_required":true},
    {"id":"S02","title":"Interview House Manager candidates","description":"Conduct structured interviews. Verify experience in recovery support, conflict resolution, and emergency response.","category":"Staffing & HR","order_index":39,"estimated_days":7,"depends_on":["S01"],"default_assignee_role":"director","is_required":true},
    {"id":"S03","title":"Hire House Manager","description":"Extend offer letter. Collect W-4, I-9, direct deposit form, and emergency contact.","category":"Staffing & HR","order_index":40,"estimated_days":3,"depends_on":["S02"],"default_assignee_role":"director","is_required":true},
    {"id":"S04","title":"Post Recovery Coach job listing","description":"Post position on relevant boards. Prefer candidates with CPRS certification and lived experience.","category":"Staffing & HR","order_index":41,"estimated_days":14,"depends_on":[],"default_assignee_role":"director","is_required":true},
    {"id":"S05","title":"Interview Recovery Coach candidates","description":"Conduct structured interviews verifying lived experience, certifications, and approach to peer support.","category":"Staffing & HR","order_index":42,"estimated_days":7,"depends_on":["S04"],"default_assignee_role":"director","is_required":true},
    {"id":"S06","title":"Hire Recovery Coach","description":"Extend offer letter. Collect all onboarding paperwork.","category":"Staffing & HR","order_index":43,"estimated_days":3,"depends_on":["S05"],"default_assignee_role":"director","is_required":true},
    {"id":"S07","title":"Complete background checks — all staff","description":"Run fingerprint-based background checks through ADHS-approved vendor. No violent or drug convictions.","category":"Staffing & HR","order_index":44,"estimated_days":7,"depends_on":["S03","S06"],"default_assignee_role":"director","is_required":true},
    {"id":"S08","title":"Verify CPR and First Aid certification — all staff","description":"Confirm current certification (Red Cross or AHA). Schedule training for any uncertified staff.","category":"Staffing & HR","order_index":45,"estimated_days":3,"depends_on":["S03","S06"],"default_assignee_role":"director","is_required":true},
    {"id":"S09","title":"Complete ADHS behavioral health training — all staff","description":"Enroll and complete required ADHS-mandated behavioral health training (BHT or equivalent).","category":"Staffing & HR","order_index":46,"estimated_days":14,"depends_on":["S07"],"default_assignee_role":"director","is_required":true},
    {"id":"S10","title":"Complete trauma-informed care training — all staff","description":"Schedule trauma-informed care certification training for all direct care staff.","category":"Staffing & HR","order_index":47,"estimated_days":7,"depends_on":["S07"],"default_assignee_role":"director","is_required":true},
    {"id":"S11","title":"Complete HIPAA training — all staff","description":"Complete HIPAA compliance training and have all staff sign HIPAA Business Associate Agreement.","category":"Staffing & HR","order_index":48,"estimated_days":3,"depends_on":["S07"],"default_assignee_role":"director","is_required":true},
    {"id":"S12","title":"Create staff schedule and shift coverage plan","description":"Build weekly schedule ensuring 24/7 coverage or on-call coverage. Define on-call protocol.","category":"Staffing & HR","order_index":49,"estimated_days":2,"depends_on":["S03","S06"],"default_assignee_role":"director","is_required":true},
    {"id":"S13","title":"Set up payroll","description":"Enroll all staff in payroll system. Confirm pay periods, direct deposit, and state withholding.","category":"Staffing & HR","order_index":50,"estimated_days":3,"depends_on":["S03","S06"],"default_assignee_role":"director","is_required":true},
    {"id":"PO01","title":"Draft House Rules document","description":"Create comprehensive house rules covering curfews, guests, chores, recovery meetings, sobriety requirements, and consequences.","category":"Policies & Documentation","order_index":51,"estimated_days":3,"depends_on":[],"default_assignee_role":"director","is_required":true},
    {"id":"PO02","title":"Draft Resident Agreement and Lease","description":"Create legally-reviewed resident agreement covering rent, term, termination conditions, and house rules acknowledgment.","category":"Policies & Documentation","order_index":52,"estimated_days":5,"depends_on":[],"default_assignee_role":"director","is_required":true},
    {"id":"PO03","title":"Create Grievance Procedure document","description":"Establish formal process for residents to raise concerns. Include timelines, escalation path, and non-retaliation policy.","category":"Policies & Documentation","order_index":53,"estimated_days":2,"depends_on":[],"default_assignee_role":"director","is_required":true},
    {"id":"PO04","title":"Create Emergency Response Protocol","description":"Document step-by-step procedures for overdose, fire, medical emergency, and violent incident. Include 911 guidance.","category":"Policies & Documentation","order_index":54,"estimated_days":2,"depends_on":[],"default_assignee_role":"director","is_required":true},
    {"id":"PO05","title":"Create Medication Management Policy","description":"Define how residents store, access, and self-administer medications. Include MAT (medication-assisted treatment) policy.","category":"Policies & Documentation","order_index":55,"estimated_days":2,"depends_on":[],"default_assignee_role":"director","is_required":true},
    {"id":"PO06","title":"Create Drug and Alcohol Testing Policy","description":"Specify testing frequency, methods, consequences for positive results, and chain of custody procedures.","category":"Policies & Documentation","order_index":56,"estimated_days":2,"depends_on":[],"default_assignee_role":"director","is_required":true},
    {"id":"PO07","title":"Create Visitor and Guest Policy","description":"Define approved visiting hours, ID requirements, prohibited items, and rules for overnight guests.","category":"Policies & Documentation","order_index":57,"estimated_days":1,"depends_on":[],"default_assignee_role":"director","is_required":true},
    {"id":"PO08","title":"Create Curfew Policy","description":"Set curfew hours by phase of residency. Define consequences and exceptions process.","category":"Policies & Documentation","order_index":58,"estimated_days":1,"depends_on":[],"default_assignee_role":"director","is_required":true},
    {"id":"PO09","title":"Create Chore Assignment System","description":"Create rotating chore schedule. Define expectations for cleanliness and inspection criteria.","category":"Policies & Documentation","order_index":59,"estimated_days":1,"depends_on":[],"default_assignee_role":"house_manager","is_required":true},
    {"id":"PO10","title":"Create Rent Collection Procedures","description":"Document rent due dates, accepted payment methods, late fees, and eviction timeline.","category":"Policies & Documentation","order_index":60,"estimated_days":1,"depends_on":[],"default_assignee_role":"director","is_required":true},
    {"id":"PO11","title":"Legal review of all policy documents","description":"Have an Arizona attorney specializing in behavioral health review all documents before use.","category":"Policies & Documentation","order_index":61,"estimated_days":7,"depends_on":["PO01","PO02","PO03","PO04","PO05","PO06","PO07","PO08","PO09","PO10"],"default_assignee_role":"director","is_required":true},
    {"id":"PO12","title":"Print and organize all policy documents","description":"Finalize, print, and organize resident handbooks and staff policy binders after legal review.","category":"Policies & Documentation","order_index":62,"estimated_days":1,"depends_on":["PO11"],"default_assignee_role":"director","is_required":true},
    {"id":"F01","title":"Open business bank account","description":"Open dedicated business checking account at a local bank or credit union. Get business debit card and checks.","category":"Financial Setup","order_index":63,"estimated_days":3,"depends_on":["L01","L02"],"default_assignee_role":"director","is_required":true},
    {"id":"F02","title":"Set up accounting software","description":"Install QuickBooks, Wave, or similar. Set up chart of accounts for rent income, utilities, payroll, supplies.","category":"Financial Setup","order_index":64,"estimated_days":3,"depends_on":["F01"],"default_assignee_role":"director","is_required":true},
    {"id":"F03","title":"Create operating budget","description":"Build 12-month budget projecting rent income vs. expenses (payroll, utilities, insurance, supplies, mortgage).","category":"Financial Setup","order_index":65,"estimated_days":3,"depends_on":["F01"],"default_assignee_role":"director","is_required":true},
    {"id":"F04","title":"Set up rent collection method","description":"Configure online payment portal (PaySimple, Zego) or establish check/cash deposit procedures.","category":"Financial Setup","order_index":66,"estimated_days":3,"depends_on":["F01"],"default_assignee_role":"director","is_required":true},
    {"id":"F05","title":"Obtain liability insurance","description":"Purchase commercial general liability insurance ($1M+/$2M aggregate). Required for ADHS license.","category":"Financial Setup","order_index":67,"estimated_days":5,"depends_on":[],"default_assignee_role":"director","is_required":true},
    {"id":"F06","title":"Obtain property insurance","description":"Ensure property is fully insured for replacement cost. Include contents and loss of income coverage.","category":"Financial Setup","order_index":68,"estimated_days":3,"depends_on":[],"default_assignee_role":"director","is_required":true},
    {"id":"F07","title":"Apply for SAMHSA or state grants","description":"Research SAMHSA SOBER Homes grant, AZ DHS grants, and local foundation grants. Submit applications.","category":"Financial Setup","order_index":69,"estimated_days":30,"depends_on":["L01","L02"],"default_assignee_role":"director","is_required":false},
    {"id":"M01","title":"Register on SAMHSA Treatment Locator","description":"Add facility to SAMHSA FINDTREATMENT.gov directory. Required to be findable by referrers nationwide.","category":"Marketing & Referrals","order_index":70,"estimated_days":2,"depends_on":["L09"],"default_assignee_role":"director","is_required":true},
    {"id":"M02","title":"Submit to AZ substance abuse referral networks","description":"Add listing to AZ DHS provider directory, AZTreats.org, and CODAC referral network.","category":"Marketing & Referrals","order_index":71,"estimated_days":3,"depends_on":["L09"],"default_assignee_role":"director","is_required":true},
    {"id":"M03","title":"Contact local courts and probation offices","description":"Reach out to Maricopa County Superior Court, adult probation, and drug court to introduce facility.","category":"Marketing & Referrals","order_index":72,"estimated_days":7,"depends_on":["L09"],"default_assignee_role":"director","is_required":false},
    {"id":"M04","title":"Contact local hospitals and treatment centers","description":"Visit nearby hospitals, detox centers, and residential treatment programs to introduce referral relationship.","category":"Marketing & Referrals","order_index":73,"estimated_days":7,"depends_on":["L09"],"default_assignee_role":"director","is_required":false},
    {"id":"M05","title":"Create referral packet for providers","description":"Design professional packet with facility overview, admission criteria, bed availability, contact info, and intake process.","category":"Marketing & Referrals","order_index":74,"estimated_days":3,"depends_on":["L09"],"default_assignee_role":"director","is_required":true},
    {"id":"M06","title":"Set up Google Business Profile","description":"Create and verify Google Business listing with address, phone, hours, photos, and description.","category":"Marketing & Referrals","order_index":75,"estimated_days":7,"depends_on":["L09"],"default_assignee_role":"director","is_required":false},
    {"id":"R01","title":"Create resident intake packet (all forms)","description":"Compile intake application, consent forms, house rules acknowledgment, medication form, and photo ID release.","category":"Resident-Facing Setup","order_index":76,"estimated_days":2,"depends_on":["PO02","PO05","PO06"],"default_assignee_role":"house_manager","is_required":true},
    {"id":"R02","title":"Develop resident orientation curriculum","description":"Create structured first-day and first-week orientation covering house rules, schedules, resources, and expectations.","category":"Resident-Facing Setup","order_index":77,"estimated_days":2,"depends_on":["PO01","PO02"],"default_assignee_role":"house_manager","is_required":true},
    {"id":"R03","title":"Set up house meeting schedule","description":"Post recurring weekly house meeting time. Assign facilitator and create meeting agenda template.","category":"Resident-Facing Setup","order_index":78,"estimated_days":1,"depends_on":["S12"],"default_assignee_role":"house_manager","is_required":true},
    {"id":"R04","title":"Post house rules in all common areas","description":"Print and laminate house rules in kitchen, living room, laundry room, and each bedroom door.","category":"Resident-Facing Setup","order_index":79,"estimated_days":1,"depends_on":["PO12"],"default_assignee_role":"house_manager","is_required":true},
    {"id":"R05","title":"Install medication lockboxes in each resident room","description":"Mount small combination lockboxes in each bedroom for resident medication storage per policy.","category":"Resident-Facing Setup","order_index":80,"estimated_days":1,"depends_on":["P12"],"default_assignee_role":"house_manager","is_required":true},
    {"id":"R06","title":"Create staff and emergency contact phone list","description":"Post laminated contact list with staff cell numbers, on-call line, 911, Poison Control, and crisis line.","category":"Resident-Facing Setup","order_index":81,"estimated_days":1,"depends_on":["S03","S06"],"default_assignee_role":"house_manager","is_required":true},
    {"id":"R07","title":"Set up UA testing station and supplies","description":"Designate bathroom for observed UA collection. Stock 90-day supply of test cups, chain of custody forms.","category":"Resident-Facing Setup","order_index":82,"estimated_days":1,"depends_on":["PO06"],"default_assignee_role":"house_manager","is_required":true},
    {"id":"R08","title":"Create monthly house inspection checklist","description":"Build standardized room-by-room inspection form for cleanliness, safety, and policy compliance review.","category":"Resident-Facing Setup","order_index":83,"estimated_days":1,"depends_on":["L09"],"default_assignee_role":"house_manager","is_required":true}
  ]'::jsonb
);

-- ---------------------------------------------------------------
-- Template 2: Staff Onboarding (21 items)
-- ---------------------------------------------------------------
INSERT INTO public.checklist_templates (id, name, description, category, estimated_days, items)
VALUES (
  '10000000-0000-0000-0000-000000000002',
  'Staff Onboarding',
  'Complete onboarding checklist for new house managers, recovery coaches, and support staff.',
  'staff_onboarding',
  30,
  '[
    {"id":"SO01","title":"Offer letter signed","description":"Ensure signed offer letter is on file with start date, compensation, and title confirmed.","category":"Pre-Start","order_index":1,"estimated_days":1,"depends_on":[],"default_assignee_role":"director","is_required":true},
    {"id":"SO02","title":"Background check submitted","description":"Submit fingerprint-based background check through ADHS-approved vendor. Retain consent form.","category":"Pre-Start","order_index":2,"estimated_days":1,"depends_on":["SO01"],"default_assignee_role":"director","is_required":true},
    {"id":"SO03","title":"Background check cleared","description":"Receive cleared background check report. File in employee record.","category":"Pre-Start","order_index":3,"estimated_days":7,"depends_on":["SO02"],"default_assignee_role":"director","is_required":true},
    {"id":"SO04","title":"W-4 and I-9 paperwork completed","description":"Complete federal and state tax withholding forms and employment eligibility verification (I-9) with required ID documents.","category":"Paperwork","order_index":4,"estimated_days":1,"depends_on":["SO03"],"default_assignee_role":"director","is_required":true},
    {"id":"SO05","title":"Direct deposit set up","description":"Collect completed direct deposit form and submit to payroll provider.","category":"Paperwork","order_index":5,"estimated_days":1,"depends_on":["SO04"],"default_assignee_role":"director","is_required":true},
    {"id":"SO06","title":"CPR and First Aid certification verified or scheduled","description":"Confirm current CPR/AED/First Aid certification (Red Cross or AHA). Schedule training if expired or missing.","category":"Certifications & Training","order_index":6,"estimated_days":1,"depends_on":["SO03"],"default_assignee_role":"director","is_required":true},
    {"id":"SO07","title":"CPR and First Aid certification completed","description":"Staff completes CPR/First Aid training. File certificate copy in personnel record.","category":"Certifications & Training","order_index":7,"estimated_days":1,"depends_on":["SO06"],"default_assignee_role":"staff","is_required":true},
    {"id":"SO08","title":"ADHS behavioral health training enrollment","description":"Enroll staff in required ADHS behavioral health training module per state requirements.","category":"Certifications & Training","order_index":8,"estimated_days":1,"depends_on":["SO03"],"default_assignee_role":"director","is_required":true},
    {"id":"SO09","title":"ADHS behavioral health training completed","description":"Staff completes required ADHS training. Save completion certificate to employee file.","category":"Certifications & Training","order_index":9,"estimated_days":14,"depends_on":["SO08"],"default_assignee_role":"staff","is_required":true},
    {"id":"SO10","title":"HIPAA training completed","description":"Complete HIPAA privacy and security training. Sign HIPAA Business Associate Agreement.","category":"Certifications & Training","order_index":10,"estimated_days":1,"depends_on":["SO03"],"default_assignee_role":"staff","is_required":true},
    {"id":"SO11","title":"Trauma-informed care training completed","description":"Complete TIC training course. Minimum 4-hour course accepted.","category":"Certifications & Training","order_index":11,"estimated_days":1,"depends_on":["SO03"],"default_assignee_role":"staff","is_required":true},
    {"id":"SO12","title":"Review and sign Staff Policy Handbook","description":"Staff reads and signs acknowledgment of all facility policies including conduct, confidentiality, and emergency procedures.","category":"Orientation","order_index":12,"estimated_days":1,"depends_on":["SO03"],"default_assignee_role":"staff","is_required":true},
    {"id":"SO13","title":"Tour of facility and introduction to house rules","description":"House manager conducts full facility tour covering all rooms, safety equipment locations, and house rules.","category":"Orientation","order_index":13,"estimated_days":1,"depends_on":["SO12"],"default_assignee_role":"house_manager","is_required":true},
    {"id":"SO14","title":"Review emergency procedures and evacuation plan","description":"Walk through overdose response, fire evacuation, medical emergency, and violent incident protocols.","category":"Orientation","order_index":14,"estimated_days":1,"depends_on":["SO12"],"default_assignee_role":"house_manager","is_required":true},
    {"id":"SO15","title":"Review medication management procedures","description":"Review policy for resident medication storage, self-administration, MAT support, and disposal.","category":"Orientation","order_index":15,"estimated_days":1,"depends_on":["SO09"],"default_assignee_role":"house_manager","is_required":true},
    {"id":"SO16","title":"Shadow experienced staff member — first 3 days","description":"New staff shadows existing staff member for 3 full shifts before working independently.","category":"Orientation","order_index":16,"estimated_days":3,"depends_on":["SO12","SO13","SO14"],"default_assignee_role":"staff","is_required":true},
    {"id":"SO17","title":"Set up staff email and system access","description":"Create staff email account, grant access to facility management software, and provide login credentials.","category":"Systems Access","order_index":17,"estimated_days":1,"depends_on":["SO03"],"default_assignee_role":"director","is_required":true},
    {"id":"SO18","title":"Add to staff scheduling software","description":"Add new staff to scheduling platform with availability and role assignments.","category":"Systems Access","order_index":18,"estimated_days":1,"depends_on":["SO17"],"default_assignee_role":"director","is_required":true},
    {"id":"SO19","title":"Issue keys and access codes","description":"Provide facility keys, keypad codes, and alarm codes. Log in key control register.","category":"Systems Access","order_index":19,"estimated_days":1,"depends_on":["SO03"],"default_assignee_role":"director","is_required":true},
    {"id":"SO20","title":"First week check-in with supervisor","description":"Schedule and complete formal check-in after first week to address questions and assess readiness.","category":"Follow-up","order_index":20,"estimated_days":7,"depends_on":["SO16"],"default_assignee_role":"director","is_required":true},
    {"id":"SO21","title":"30-day performance review scheduled","description":"Book 30-day review meeting. Collect self-evaluation from staff member before meeting.","category":"Follow-up","order_index":21,"estimated_days":30,"depends_on":["SO20"],"default_assignee_role":"director","is_required":true}
  ]'::jsonb
);

-- ---------------------------------------------------------------
-- Template 3: Resident Intake (18 items)
-- ---------------------------------------------------------------
INSERT INTO public.checklist_templates (id, name, description, category, estimated_days, items)
VALUES (
  '10000000-0000-0000-0000-000000000003',
  'Resident Intake',
  'Step-by-step intake process for admitting a new resident into the sober living facility.',
  'resident_intake',
  7,
  '[
    {"id":"RI01","title":"Initial inquiry or application received","description":"Log incoming inquiry in intake tracking system. Capture name, phone, referral source, and substance history.","category":"Pre-Admission","order_index":1,"estimated_days":1,"depends_on":[],"default_assignee_role":"house_manager","is_required":true},
    {"id":"RI02","title":"Eligibility screening completed","description":"Verify applicant meets admission criteria: sobriety period, no sex offender status, no active arson/violent charges.","category":"Pre-Admission","order_index":2,"estimated_days":1,"depends_on":["RI01"],"default_assignee_role":"house_manager","is_required":true},
    {"id":"RI03","title":"AHCCCS or insurance verification","description":"Verify AHCCCS eligibility or private insurance coverage. Contact payer if billing for recovery support services.","category":"Pre-Admission","order_index":3,"estimated_days":1,"depends_on":["RI02"],"default_assignee_role":"director","is_required":false},
    {"id":"RI04","title":"Intake interview scheduled","description":"Book intake interview with applicant. Inform them what to bring (ID, medications, insurance card, first month rent).","category":"Pre-Admission","order_index":4,"estimated_days":1,"depends_on":["RI02"],"default_assignee_role":"house_manager","is_required":true},
    {"id":"RI05","title":"Intake interview completed","description":"Conduct in-person intake interview. Review history, current medications, recovery plan, and goals.","category":"Admission","order_index":5,"estimated_days":1,"depends_on":["RI04"],"default_assignee_role":"house_manager","is_required":true},
    {"id":"RI06","title":"Clinical assessment completed (if applicable)","description":"Complete CIWA-Ar, ASAM criteria, or other standardized clinical assessment if required by license level.","category":"Admission","order_index":6,"estimated_days":1,"depends_on":["RI05"],"default_assignee_role":"house_manager","is_required":false},
    {"id":"RI07","title":"Bed assignment confirmed","description":"Assign specific bed/room. Note any roommate considerations or accessibility needs.","category":"Admission","order_index":7,"estimated_days":1,"depends_on":["RI05"],"default_assignee_role":"house_manager","is_required":true},
    {"id":"RI08","title":"Resident Agreement and Lease signed","description":"Review and execute resident agreement with new resident. Provide copy for their records.","category":"Documentation","order_index":8,"estimated_days":1,"depends_on":["RI07"],"default_assignee_role":"house_manager","is_required":true},
    {"id":"RI09","title":"House Rules signed and acknowledged","description":"Have resident read and sign house rules acknowledgment. Review key rules verbally.","category":"Documentation","order_index":9,"estimated_days":1,"depends_on":["RI07"],"default_assignee_role":"house_manager","is_required":true},
    {"id":"RI10","title":"Photo ID and documentation collected","description":"Collect copy of government-issued ID, Social Security card (if available), insurance card, and probation papers if applicable.","category":"Documentation","order_index":10,"estimated_days":1,"depends_on":["RI07"],"default_assignee_role":"house_manager","is_required":true},
    {"id":"RI11","title":"Medication list and management form completed","description":"Document all current medications, dosages, and prescribers. Assign medication lockbox. Review MAT policy.","category":"Documentation","order_index":11,"estimated_days":1,"depends_on":["RI07"],"default_assignee_role":"house_manager","is_required":true},
    {"id":"RI12","title":"Emergency contact form completed","description":"Collect name, relationship, and phone number for at least two emergency contacts.","category":"Documentation","order_index":12,"estimated_days":1,"depends_on":["RI07"],"default_assignee_role":"house_manager","is_required":true},
    {"id":"RI13","title":"First and last month rent and deposit collected","description":"Collect move-in costs per resident agreement. Issue receipt and enter payment in system.","category":"Financial","order_index":13,"estimated_days":1,"depends_on":["RI08"],"default_assignee_role":"house_manager","is_required":true},
    {"id":"RI14","title":"Drug screen administered on intake","description":"Conduct observed urine drug screen on day of move-in. Document results per chain of custody protocol.","category":"Move-In","order_index":14,"estimated_days":1,"depends_on":["RI08"],"default_assignee_role":"house_manager","is_required":true},
    {"id":"RI15","title":"Move-in room inspection completed","description":"Walk resident through room. Document any pre-existing damage on move-in inspection form. Both parties sign.","category":"Move-In","order_index":15,"estimated_days":1,"depends_on":["RI07"],"default_assignee_role":"house_manager","is_required":true},
    {"id":"RI16","title":"Orientation to house schedule and resources","description":"Walk resident through daily schedule, chore assignments, meeting requirements, curfew, and available community resources.","category":"Orientation","order_index":16,"estimated_days":1,"depends_on":["RI08","RI09"],"default_assignee_role":"house_manager","is_required":true},
    {"id":"RI17","title":"Introduction to house manager and peers","description":"Formally introduce new resident to house manager, current residents, and on-site staff.","category":"Orientation","order_index":17,"estimated_days":1,"depends_on":["RI16"],"default_assignee_role":"house_manager","is_required":true},
    {"id":"RI18","title":"7-day check-in scheduled","description":"Book follow-up check-in for one week after move-in to address concerns and assess adjustment.","category":"Follow-up","order_index":18,"estimated_days":7,"depends_on":["RI17"],"default_assignee_role":"house_manager","is_required":true}
  ]'::jsonb
);

-- ---------------------------------------------------------------
-- Template 4: ADHS License Renewal (16 items)
-- ---------------------------------------------------------------
INSERT INTO public.checklist_templates (id, name, description, category, estimated_days, items)
VALUES (
  '10000000-0000-0000-0000-000000000004',
  'ADHS License Renewal',
  'Annual renewal process for Arizona Department of Health Services behavioral health license for sober living facilities.',
  'adhs_renewal',
  60,
  '[
    {"id":"AR01","title":"Review current license expiration date","description":"Pull current license and confirm expiration date. Begin renewal process at least 90 days before expiration.","category":"Preparation","order_index":1,"estimated_days":1,"depends_on":[],"default_assignee_role":"director","is_required":true},
    {"id":"AR02","title":"Log in to ADHS provider portal","description":"Access ADHS online provider portal and locate renewal application for current license.","category":"Preparation","order_index":2,"estimated_days":1,"depends_on":["AR01"],"default_assignee_role":"director","is_required":true},
    {"id":"AR03","title":"Gather all required renewal documents","description":"Collect current certificate of insurance, updated floor plan, staff roster, and financial disclosure documents.","category":"Documentation","order_index":3,"estimated_days":5,"depends_on":["AR01"],"default_assignee_role":"director","is_required":true},
    {"id":"AR04","title":"Verify staff training compliance","description":"Pull training records for all staff. Confirm all required ADHS trainings are current and not expired.","category":"Compliance Audit","order_index":4,"estimated_days":3,"depends_on":["AR01"],"default_assignee_role":"director","is_required":true},
    {"id":"AR05","title":"Verify CPR and First Aid certifications","description":"Check expiration dates on all staff CPR/First Aid cards. Identify any needing renewal.","category":"Compliance Audit","order_index":5,"estimated_days":1,"depends_on":["AR01"],"default_assignee_role":"director","is_required":true},
    {"id":"AR06","title":"Complete staff training gap analysis","description":"Identify any gaps in required training across staff roster. Create remediation plan.","category":"Compliance Audit","order_index":6,"estimated_days":1,"depends_on":["AR04","AR05"],"default_assignee_role":"director","is_required":true},
    {"id":"AR07","title":"Complete any missing staff trainings","description":"Enroll and ensure completion of any training gaps identified before submitting renewal application.","category":"Compliance Audit","order_index":7,"estimated_days":14,"depends_on":["AR06"],"default_assignee_role":"director","is_required":true},
    {"id":"AR08","title":"Conduct internal compliance self-audit","description":"Walk through facility against ADHS inspection checklist. Identify and correct any deficiencies.","category":"Compliance Audit","order_index":8,"estimated_days":3,"depends_on":["AR01"],"default_assignee_role":"director","is_required":true},
    {"id":"AR09","title":"Update floor plan if facility has changed","description":"If rooms were added, removed, or reconfigured, prepare updated floor plan for submission.","category":"Documentation","order_index":9,"estimated_days":3,"depends_on":["AR08"],"default_assignee_role":"director","is_required":false},
    {"id":"AR10","title":"Update policies if required by new regulations","description":"Review any ADHS regulatory updates since last renewal. Update policies accordingly.","category":"Documentation","order_index":10,"estimated_days":5,"depends_on":["AR08"],"default_assignee_role":"director","is_required":true},
    {"id":"AR11","title":"Complete ADHS renewal application","description":"Fill out all sections of the online renewal application in the ADHS provider portal.","category":"Submission","order_index":11,"estimated_days":2,"depends_on":["AR03","AR07","AR09","AR10"],"default_assignee_role":"director","is_required":true},
    {"id":"AR12","title":"Pay renewal fee","description":"Submit renewal fee payment online through ADHS portal. Retain confirmation receipt.","category":"Submission","order_index":12,"estimated_days":1,"depends_on":["AR11"],"default_assignee_role":"director","is_required":true},
    {"id":"AR13","title":"Submit application to ADHS portal","description":"Final submission of renewal application with all attachments. Receive submission confirmation number.","category":"Submission","order_index":13,"estimated_days":1,"depends_on":["AR11","AR12"],"default_assignee_role":"director","is_required":true},
    {"id":"AR14","title":"Schedule ADHS renewal inspection","description":"After ADHS processes application, schedule renewal site inspection date with ADHS inspector.","category":"Inspection","order_index":14,"estimated_days":14,"depends_on":["AR13"],"default_assignee_role":"director","is_required":true},
    {"id":"AR15","title":"Pass ADHS renewal inspection","description":"ADHS inspector visits facility. Ensure facility, staff, records, and safety equipment meet all standards.","category":"Inspection","order_index":15,"estimated_days":1,"depends_on":["AR14"],"default_assignee_role":"director","is_required":true},
    {"id":"AR16","title":"Receive renewed license certificate","description":"Post new license certificate in visible location. Update expiration date in facility records.","category":"Post-Renewal","order_index":16,"estimated_days":14,"depends_on":["AR15"],"default_assignee_role":"director","is_required":true}
  ]'::jsonb
);

-- ---------------------------------------------------------------
-- Template 5: Monthly Operations (15 items)
-- ---------------------------------------------------------------
INSERT INTO public.checklist_templates (id, name, description, category, estimated_days, items)
VALUES (
  '10000000-0000-0000-0000-000000000005',
  'Monthly Operations',
  'Recurring monthly operational checklist for ongoing facility management and compliance.',
  'monthly_ops',
  30,
  '[
    {"id":"MO01","title":"Conduct monthly house inspection","description":"Walk all rooms and common areas. Document cleanliness, safety issues, maintenance needs, and policy violations.","category":"Facility","order_index":1,"estimated_days":1,"depends_on":[],"default_assignee_role":"house_manager","is_required":true},
    {"id":"MO02","title":"Update occupancy report","description":"Record current bed count, vacancies, resident names, lease end dates, and any pending move-outs.","category":"Facility","order_index":2,"estimated_days":1,"depends_on":[],"default_assignee_role":"house_manager","is_required":true},
    {"id":"MO03","title":"Test all smoke and CO detectors","description":"Press test button on every smoke and CO detector. Replace batteries as needed. Document test date.","category":"Safety","order_index":3,"estimated_days":1,"depends_on":[],"default_assignee_role":"house_manager","is_required":true},
    {"id":"MO04","title":"Check and restock first aid kits","description":"Inspect all first aid kits. Restock used or expired items. Document inspection.","category":"Safety","order_index":4,"estimated_days":1,"depends_on":[],"default_assignee_role":"house_manager","is_required":true},
    {"id":"MO05","title":"Review and reconcile all payments","description":"Reconcile rent received against expected rent roll. Match payments in system to bank deposits.","category":"Financial","order_index":5,"estimated_days":2,"depends_on":[],"default_assignee_role":"director","is_required":true},
    {"id":"MO06","title":"Follow up on outstanding invoices","description":"Contact residents with overdue balances. Document collection efforts and any payment arrangements.","category":"Financial","order_index":6,"estimated_days":2,"depends_on":["MO05"],"default_assignee_role":"director","is_required":true},
    {"id":"MO07","title":"Submit AHCCCS billing if applicable","description":"Compile and submit monthly AHCCCS claims for recovery support services. Retain remittance advice.","category":"Financial","order_index":7,"estimated_days":3,"depends_on":["MO05"],"default_assignee_role":"director","is_required":false},
    {"id":"MO08","title":"Create and update chore schedules","description":"Post updated chore rotation for the coming month. Confirm all residents have assignments.","category":"Resident Management","order_index":8,"estimated_days":1,"depends_on":[],"default_assignee_role":"house_manager","is_required":true},
    {"id":"MO09","title":"Conduct monthly house meeting","description":"Facilitate resident house meeting. Address upcoming issues, celebrate milestones, collect feedback.","category":"Resident Management","order_index":9,"estimated_days":1,"depends_on":["MO08"],"default_assignee_role":"house_manager","is_required":true},
    {"id":"MO10","title":"Update resident files","description":"Update any changes in resident status, insurance, medications, contact info, or court requirements.","category":"Resident Management","order_index":10,"estimated_days":2,"depends_on":[],"default_assignee_role":"house_manager","is_required":true},
    {"id":"MO11","title":"Review incident reports from past month","description":"Review all incident reports. Identify patterns, follow up on open items, and confirm all required notifications were made.","category":"Compliance","order_index":11,"estimated_days":1,"depends_on":[],"default_assignee_role":"director","is_required":true},
    {"id":"MO12","title":"Review maintenance requests status","description":"Review all open maintenance requests. Escalate overdue items. Close completed work orders.","category":"Compliance","order_index":12,"estimated_days":1,"depends_on":["MO11"],"default_assignee_role":"director","is_required":true},
    {"id":"MO13","title":"Order supplies for coming month","description":"Restock UA test cups, cleaning supplies, first aid kit items, and office supplies as needed.","category":"Operations","order_index":13,"estimated_days":1,"depends_on":["MO01","MO04"],"default_assignee_role":"house_manager","is_required":true},
    {"id":"MO14","title":"Staff supervision meeting","description":"Hold supervision meeting with all direct care staff. Review performance, address issues, and provide guidance.","category":"Staffing","order_index":14,"estimated_days":1,"depends_on":["MO11","MO12"],"default_assignee_role":"director","is_required":true},
    {"id":"MO15","title":"Back up all records and send monthly summary","description":"Back up all digital records to secure storage. Send monthly summary report to management and board.","category":"Operations","order_index":15,"estimated_days":1,"depends_on":["MO05","MO10","MO11"],"default_assignee_role":"director","is_required":true}
  ]'::jsonb
);

-- ============================================================
-- SEED: 5 Document Templates (conditional on table existence)
-- ============================================================
-- Note: document_templates is created by batch1_foundation.sql
-- These INSERTs are wrapped to be a no-op if the table doesn't exist yet

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='document_templates') THEN

INSERT INTO public.document_templates (id, name, category, template_content, variables_json)
VALUES (
  '20000000-0000-0000-0000-000000000001',
  'Resident Agreement / Lease',
  'lease',
  '<div class="document">
<h1 style="text-align:center;">RESIDENT AGREEMENT</h1>
<h2 style="text-align:center;">{{facility_name}}</h2>
<p style="text-align:center;">{{facility_address}}</p>
<hr/>
<p>This Resident Agreement ("Agreement") is entered into as of <strong>{{agreement_date}}</strong> between <strong>{{facility_name}}</strong> ("Facility") and <strong>{{resident_name}}</strong> ("Resident").</p>

<h3>1. RESIDENCY TERM</h3>
<p>Residency begins on <strong>{{move_in_date}}</strong>. This agreement is month-to-month unless otherwise noted.</p>

<h3>2. RENT AND FEES</h3>
<p>Resident agrees to pay <strong>${{monthly_rent}}</strong> per month, due on the <strong>{{rent_due_day}}</strong> of each month. A security deposit of <strong>${{deposit_amount}}</strong> is required at move-in.</p>

<h3>3. SOBRIETY REQUIREMENTS</h3>
<p>Resident must maintain complete abstinence from all alcohol, illegal drugs, and non-prescribed medications. Resident consents to random drug and alcohol testing.</p>

<h3>4. HOUSE RULES</h3>
<p>Resident agrees to abide by all facility House Rules as provided separately. Violations may result in immediate termination of residency.</p>

<h3>5. CURFEW</h3>
<p>Curfew is <strong>{{curfew_time}}</strong> Sunday through Thursday and <strong>{{weekend_curfew}}</strong> Friday and Saturday.</p>

<h3>6. RECOVERY MEETINGS</h3>
<p>Resident is required to attend a minimum of <strong>{{meetings_per_week}}</strong> recovery support meetings per week and provide verification.</p>

<h3>7. TERMINATION</h3>
<p>Either party may terminate this agreement with <strong>{{notice_days}}</strong> days written notice. Immediate termination applies in cases of relapse, violence, or serious rule violations.</p>

<h3>8. SIGNATURES</h3>
<table style="width:100%;margin-top:40px;">
<tr>
<td style="width:50%;padding-right:20px;">
<p>Resident Signature: ____________________________</p>
<p>Printed Name: {{resident_name}}</p>
<p>Date: ____________________________</p>
</td>
<td style="width:50%;padding-left:20px;">
<p>Facility Representative: ____________________________</p>
<p>Printed Name: {{facility_rep_name}}</p>
<p>Title: {{facility_rep_title}}</p>
<p>Date: ____________________________</p>
</td>
</tr>
</table>
</div>',
  '[
    {"name":"facility_name","label":"Facility Name","type":"text","required":true,"default_value":""},
    {"name":"facility_address","label":"Facility Address","type":"text","required":true,"default_value":""},
    {"name":"agreement_date","label":"Agreement Date","type":"date","required":true,"default_value":""},
    {"name":"resident_name","label":"Resident Full Name","type":"text","required":true,"default_value":""},
    {"name":"move_in_date","label":"Move-In Date","type":"date","required":true,"default_value":""},
    {"name":"monthly_rent","label":"Monthly Rent ($)","type":"number","required":true,"default_value":"800"},
    {"name":"rent_due_day","label":"Rent Due Day (e.g. 1st)","type":"text","required":true,"default_value":"1st"},
    {"name":"deposit_amount","label":"Security Deposit ($)","type":"number","required":true,"default_value":"800"},
    {"name":"curfew_time","label":"Weekday Curfew Time","type":"text","required":true,"default_value":"10:00 PM"},
    {"name":"weekend_curfew","label":"Weekend Curfew Time","type":"text","required":true,"default_value":"11:00 PM"},
    {"name":"meetings_per_week","label":"Required Meetings Per Week","type":"number","required":true,"default_value":"3"},
    {"name":"notice_days","label":"Notice Period (days)","type":"number","required":true,"default_value":"30"},
    {"name":"facility_rep_name","label":"Facility Rep Name","type":"text","required":true,"default_value":""},
    {"name":"facility_rep_title","label":"Facility Rep Title","type":"text","required":true,"default_value":"House Manager"}
  ]'::jsonb
);

INSERT INTO public.document_templates (id, name, category, template_content, variables_json)
VALUES (
  '20000000-0000-0000-0000-000000000002',
  'House Rules Acknowledgment',
  'house_rules',
  '<div class="document">
<h1 style="text-align:center;">HOUSE RULES ACKNOWLEDGMENT</h1>
<h2 style="text-align:center;">{{facility_name}}</h2>
<hr/>
<p>I, <strong>{{resident_name}}</strong>, acknowledge that I have received, read, and understood the House Rules of {{facility_name}}. I agree to abide by all rules as a condition of my residency.</p>

<h3>SUMMARY OF KEY RULES</h3>
<ul>
<li><strong>Sobriety:</strong> Zero tolerance for alcohol, illegal drugs, or non-prescribed medications on premises or in your system.</li>
<li><strong>Drug Testing:</strong> Submit to random drug and alcohol testing upon request at any time.</li>
<li><strong>Curfew:</strong> {{curfew_time}} weekdays, {{weekend_curfew}} weekends. Notify house manager if you will be late.</li>
<li><strong>Recovery Meetings:</strong> Attend minimum {{meetings_per_week}} meetings per week. Provide signed verification slips.</li>
<li><strong>Guests:</strong> All guests must be approved by house manager. No overnight guests without prior written approval.</li>
<li><strong>Chores:</strong> Complete your assigned chores daily. The house must be kept clean at all times.</li>
<li><strong>Rent:</strong> Rent is due on the {{rent_due_day}} of each month. Late fees apply after 3 days.</li>
<li><strong>Respect:</strong> Treat all housemates and staff with respect. Physical or verbal aggression results in immediate removal.</li>
<li><strong>Prohibited Items:</strong> No weapons, drug paraphernalia, pornography, or alcohol on premises.</li>
<li><strong>Medications:</strong> All medications must be stored in your assigned lockbox and self-administered per policy.</li>
</ul>

<p style="margin-top:20px;">I understand that violation of these rules may result in immediate termination of my residency without refund of deposit.</p>

<div style="margin-top:40px;">
<p>Resident Signature: ____________________________  Date: ______________</p>
<p>Printed Name: {{resident_name}}</p>
<p>House Manager Signature: ________________________  Date: ______________</p>
</div>
</div>',
  '[
    {"name":"facility_name","label":"Facility Name","type":"text","required":true,"default_value":""},
    {"name":"resident_name","label":"Resident Full Name","type":"text","required":true,"default_value":""},
    {"name":"curfew_time","label":"Weekday Curfew Time","type":"text","required":true,"default_value":"10:00 PM"},
    {"name":"weekend_curfew","label":"Weekend Curfew Time","type":"text","required":true,"default_value":"11:00 PM"},
    {"name":"meetings_per_week","label":"Required Meetings Per Week","type":"number","required":true,"default_value":"3"},
    {"name":"rent_due_day","label":"Rent Due Day","type":"text","required":true,"default_value":"1st"}
  ]'::jsonb
);

INSERT INTO public.document_templates (id, name, category, template_content, variables_json)
VALUES (
  '20000000-0000-0000-0000-000000000003',
  'Incident Report',
  'incident_report',
  '<div class="document">
<h1 style="text-align:center;">INCIDENT REPORT</h1>
<h2 style="text-align:center;">{{facility_name}}</h2>
<hr/>
<table style="width:100%;border-collapse:collapse;">
<tr><td style="width:50%;padding:4px;"><strong>Date of Incident:</strong> {{incident_date}}</td><td style="width:50%;padding:4px;"><strong>Time of Incident:</strong> {{incident_time}}</td></tr>
<tr><td style="padding:4px;"><strong>Location:</strong> {{incident_location}}</td><td style="padding:4px;"><strong>Report Date:</strong> {{report_date}}</td></tr>
<tr><td style="padding:4px;"><strong>Resident(s) Involved:</strong> {{residents_involved}}</td><td style="padding:4px;"><strong>Staff on Duty:</strong> {{staff_on_duty}}</td></tr>
<tr><td colspan="2" style="padding:4px;"><strong>Incident Type:</strong> {{incident_type}}</td></tr>
</table>

<h3>DESCRIPTION OF INCIDENT</h3>
<div style="border:1px solid #ccc;min-height:100px;padding:10px;">
<p>{{incident_description}}</p>
</div>

<h3>ACTIONS TAKEN</h3>
<div style="border:1px solid #ccc;min-height:80px;padding:10px;">
<p>{{actions_taken}}</p>
</div>

<h3>NOTIFICATIONS MADE</h3>
<ul>
<li>911/Emergency Services: {{notified_911}}</li>
<li>Management/Owner: {{notified_management}}</li>
<li>ADHS (if required): {{notified_adhs}}</li>
<li>Family/Guardian: {{notified_family}}</li>
</ul>

<h3>FOLLOW-UP REQUIRED</h3>
<div style="border:1px solid #ccc;min-height:60px;padding:10px;">
<p>{{follow_up}}</p>
</div>

<div style="margin-top:40px;">
<p>Reporting Staff Signature: ____________________________  Date: ______________</p>
<p>Printed Name: {{staff_on_duty}}</p>
<p>Supervisor Review Signature: ________________________  Date: ______________</p>
</div>
</div>',
  '[
    {"name":"facility_name","label":"Facility Name","type":"text","required":true,"default_value":""},
    {"name":"incident_date","label":"Date of Incident","type":"date","required":true,"default_value":""},
    {"name":"incident_time","label":"Time of Incident","type":"text","required":true,"default_value":""},
    {"name":"incident_location","label":"Location in Facility","type":"text","required":true,"default_value":""},
    {"name":"report_date","label":"Date of Report","type":"date","required":true,"default_value":""},
    {"name":"residents_involved","label":"Resident(s) Involved","type":"text","required":true,"default_value":""},
    {"name":"staff_on_duty","label":"Staff on Duty","type":"text","required":true,"default_value":""},
    {"name":"incident_type","label":"Type of Incident","type":"text","required":true,"default_value":""},
    {"name":"incident_description","label":"Description of Incident","type":"textarea","required":true,"default_value":""},
    {"name":"actions_taken","label":"Actions Taken","type":"textarea","required":true,"default_value":""},
    {"name":"notified_911","label":"911 Notified?","type":"text","required":true,"default_value":"No"},
    {"name":"notified_management","label":"Management Notified?","type":"text","required":true,"default_value":"Yes"},
    {"name":"notified_adhs","label":"ADHS Notified?","type":"text","required":true,"default_value":"No"},
    {"name":"notified_family","label":"Family Notified?","type":"text","required":true,"default_value":"No"},
    {"name":"follow_up","label":"Follow-Up Required","type":"textarea","required":false,"default_value":"None required at this time."}
  ]'::jsonb
);

INSERT INTO public.document_templates (id, name, category, template_content, variables_json)
VALUES (
  '20000000-0000-0000-0000-000000000004',
  '30-Day Notice to Vacate',
  'other',
  '<div class="document">
<h1 style="text-align:center;">30-DAY NOTICE TO VACATE</h1>
<h2 style="text-align:center;">{{facility_name}}</h2>
<p style="text-align:center;">{{facility_address}}</p>
<hr/>
<p><strong>Date:</strong> {{notice_date}}</p>
<p><strong>To:</strong> {{resident_name}}</p>
<p><strong>Re:</strong> Notice to Vacate Premises</p>

<p>Dear {{resident_name}},</p>

<p>This letter serves as formal written notice that your residency at <strong>{{facility_name}}</strong>, located at {{facility_address}}, will be terminated effective <strong>{{vacate_date}}</strong>, which is 30 days from the date of this notice.</p>

<p><strong>Reason for Notice:</strong></p>
<div style="border-left:4px solid #ccc;padding-left:16px;margin:16px 0;">
<p>{{reason_for_notice}}</p>
</div>

<p>You are required to:</p>
<ol>
<li>Remove all personal belongings from the premises by <strong>{{vacate_date}}</strong> at <strong>{{vacate_time}}</strong>.</li>
<li>Return all keys, access cards, and facility-issued items to the house manager.</li>
<li>Leave your room in clean condition for move-out inspection.</li>
<li>Settle any outstanding rent balance of <strong>${{balance_owed}}</strong> prior to departure.</li>
</ol>

<p>Your security deposit of <strong>${{deposit_amount}}</strong> will be returned within 14 days of your departure, less any deductions for damages or outstanding rent, per the terms of your Resident Agreement.</p>

<p>If you have questions regarding this notice, please contact <strong>{{contact_name}}</strong> at <strong>{{contact_phone}}</strong>.</p>

<div style="margin-top:40px;">
<p>Facility Representative: ____________________________  Date: ______________</p>
<p>Printed Name: {{contact_name}}</p>
<p>Title: {{contact_title}}</p>
<br/>
<p>Resident Acknowledgment: ___________________________  Date: ______________</p>
<p>Printed Name: {{resident_name}}</p>
</div>
</div>',
  '[
    {"name":"facility_name","label":"Facility Name","type":"text","required":true,"default_value":""},
    {"name":"facility_address","label":"Facility Address","type":"text","required":true,"default_value":""},
    {"name":"notice_date","label":"Date of Notice","type":"date","required":true,"default_value":""},
    {"name":"resident_name","label":"Resident Full Name","type":"text","required":true,"default_value":""},
    {"name":"vacate_date","label":"Required Vacate Date","type":"date","required":true,"default_value":""},
    {"name":"vacate_time","label":"Required Vacate Time","type":"text","required":true,"default_value":"12:00 PM"},
    {"name":"reason_for_notice","label":"Reason for Notice","type":"textarea","required":true,"default_value":""},
    {"name":"balance_owed","label":"Outstanding Balance ($)","type":"number","required":true,"default_value":"0"},
    {"name":"deposit_amount","label":"Security Deposit Amount ($)","type":"number","required":true,"default_value":"0"},
    {"name":"contact_name","label":"Contact Name","type":"text","required":true,"default_value":""},
    {"name":"contact_phone","label":"Contact Phone","type":"text","required":true,"default_value":""},
    {"name":"contact_title","label":"Contact Title","type":"text","required":true,"default_value":"House Manager"}
  ]'::jsonb
);

INSERT INTO public.document_templates (id, name, category, template_content, variables_json)
VALUES (
  '20000000-0000-0000-0000-000000000005',
  'Resident Grievance Form',
  'consent',
  '<div class="document">
<h1 style="text-align:center;">RESIDENT GRIEVANCE FORM</h1>
<h2 style="text-align:center;">{{facility_name}}</h2>
<hr/>
<p><strong>Date Submitted:</strong> {{submission_date}}</p>
<p><strong>Resident Name:</strong> {{resident_name}}</p>
<p><strong>Room Assignment:</strong> {{room_number}}</p>

<h3>NATURE OF GRIEVANCE</h3>
<p><em>Check all that apply:</em></p>
<ul>
<li>&#9633; Staff conduct or behavior</li>
<li>&#9633; House rule enforcement</li>
<li>&#9633; Maintenance or safety issue</li>
<li>&#9633; Conflict with another resident</li>
<li>&#9633; Financial dispute (rent, fees, deposit)</li>
<li>&#9633; Discrimination or harassment</li>
<li>&#9633; Other: {{grievance_type}}</li>
</ul>

<h3>DESCRIPTION OF GRIEVANCE</h3>
<div style="border:1px solid #ccc;min-height:120px;padding:10px;">
<p>{{grievance_description}}</p>
</div>

<h3>DESIRED RESOLUTION</h3>
<div style="border:1px solid #ccc;min-height:80px;padding:10px;">
<p>{{desired_resolution}}</p>
</div>

<h3>WITNESSES (if any)</h3>
<p>{{witnesses}}</p>

<p style="margin-top:20px;font-style:italic;">This grievance will be reviewed within 5 business days. You will receive a written response. Filing this grievance will not result in any retaliation.</p>

<div style="margin-top:40px;">
<p>Resident Signature: ____________________________  Date: ______________</p>
<p>Received By: ____________________________  Date: ______________</p>
<p>Resolution Date: ____________________________</p>
<p>Resolution Notes: ____________________________</p>
</div>
</div>',
  '[
    {"name":"facility_name","label":"Facility Name","type":"text","required":true,"default_value":""},
    {"name":"submission_date","label":"Date Submitted","type":"date","required":true,"default_value":""},
    {"name":"resident_name","label":"Resident Full Name","type":"text","required":true,"default_value":""},
    {"name":"room_number","label":"Room Assignment","type":"text","required":false,"default_value":""},
    {"name":"grievance_type","label":"Type of Grievance (if Other)","type":"text","required":false,"default_value":""},
    {"name":"grievance_description","label":"Description of Grievance","type":"textarea","required":true,"default_value":""},
    {"name":"desired_resolution","label":"Desired Resolution","type":"textarea","required":false,"default_value":""},
    {"name":"witnesses","label":"Witnesses (names)","type":"text","required":false,"default_value":"None"}
  ]'::jsonb
);

  END IF;
END $$;
