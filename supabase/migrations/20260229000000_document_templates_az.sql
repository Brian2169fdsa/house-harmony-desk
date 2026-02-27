-- ============================================================
-- SYSTEM 2: Arizona-Specific Policy Document Templates
-- Expands category CHECK constraint + adds 8 new templates
-- ============================================================

-- 1. Drop existing category CHECK constraint so we can add new categories
ALTER TABLE public.document_templates DROP CONSTRAINT IF EXISTS document_templates_category_check;

-- 2. Add expanded CHECK constraint with all Arizona policy categories
ALTER TABLE public.document_templates
  ADD CONSTRAINT document_templates_category_check
  CHECK (category IN (
    'lease','house_rules','intake_form','incident_report','consent',
    'drug_testing_policy','medication_policy','emergency_procedures',
    'confidentiality_policy','anti_discrimination','code_of_ethics',
    'abuse_reporting','record_retention','discharge_procedures','other'
  ));

-- ============================================================
-- Template 6: Drug Testing Policy
-- ============================================================
INSERT INTO public.document_templates (id, name, category, template_content, variables_json)
VALUES (
  '20000000-0000-0000-0000-000000000006',
  'Drug Testing Policy',
  'drug_testing_policy',
  '<div class="document">
<h1 style="text-align:center;">DRUG AND ALCOHOL TESTING POLICY</h1>
<h2 style="text-align:center;">{{facility_name}}</h2>
<p style="text-align:center;">{{facility_address}}</p>
<p style="text-align:center;">Effective Date: {{effective_date}}</p>
<hr/>

<h3>1. PURPOSE AND SCOPE</h3>
<p>{{facility_name}} ("Facility") maintains a drug- and alcohol-free environment as required by Arizona Revised Statutes and as a condition of certification by the Arizona Behavioral Health Recovery Alliance (AzRHA) and licensure by the Arizona Department of Health Services (ADHS). This policy applies to all residents and governs all aspects of drug and alcohol testing conducted at the Facility.</p>

<h3>2. LEGAL FRAMEWORK</h3>
<p>This policy is established pursuant to:</p>
<ul>
<li>Arizona Revised Statutes § 36-2061 et seq. (Sober Living Homes)</li>
<li>9 A.A.C. 12 (ADHS Sober Living Home Rules)</li>
<li>AzRHA Ethical Standards for Drug Testing</li>
<li>42 C.F.R. Part 2 (Confidentiality of Substance Use Disorder Records)</li>
</ul>

<h3>3. CONSENT TO TESTING</h3>
<p>As a condition of residency, all residents must consent in writing to drug and alcohol testing at any time during their stay. Refusal to consent to or cooperate with testing shall be treated as a positive result and may result in immediate termination of residency.</p>

<h3>4. TESTING SCHEDULE AND FREQUENCY</h3>
<table style="width:100%;border-collapse:collapse;margin:10px 0;">
<tr><th style="border:1px solid #ccc;padding:8px;background:#f5f5f5;">Program Phase</th><th style="border:1px solid #ccc;padding:8px;background:#f5f5f5;">Frequency</th><th style="border:1px solid #ccc;padding:8px;background:#f5f5f5;">Type</th></tr>
<tr><td style="border:1px solid #ccc;padding:8px;">Phase 1 (Days 1–30)</td><td style="border:1px solid #ccc;padding:8px;">3x per week</td><td style="border:1px solid #ccc;padding:8px;">Urine (observed)</td></tr>
<tr><td style="border:1px solid #ccc;padding:8px;">Phase 2 (Days 31–90)</td><td style="border:1px solid #ccc;padding:8px;">2x per week</td><td style="border:1px solid #ccc;padding:8px;">Urine or oral fluid</td></tr>
<tr><td style="border:1px solid #ccc;padding:8px;">Phase 3 (Days 91+)</td><td style="border:1px solid #ccc;padding:8px;">1x per week</td><td style="border:1px solid #ccc;padding:8px;">Urine or oral fluid</td></tr>
<tr><td style="border:1px solid #ccc;padding:8px;">For-Cause / Post-Incident</td><td style="border:1px solid #ccc;padding:8px;">Immediately upon request</td><td style="border:1px solid #ccc;padding:8px;">Urine (observed)</td></tr>
</table>
<p>In addition to scheduled testing, the Facility reserves the right to conduct random testing at any time without prior notice.</p>

<h3>5. TESTING METHODS</h3>
<p>The Facility uses the following testing methods approved by AzRHA:</p>
<ul>
<li><strong>Urine Drug Screens (UDS):</strong> 10-panel or 12-panel immunoassay test strips administered on-site. Positive results sent to certified laboratory for confirmation (GC/MS or LC/MS/MS) at Facility cost.</li>
<li><strong>Oral Fluid (Saliva) Tests:</strong> Used for random screening. Detect recent use within 24–48 hours.</li>
<li><strong>Breathalyzer:</strong> Used to detect alcohol. Readings at or above 0.01 BAC constitute a violation.</li>
</ul>

<h3>6. CHAIN OF CUSTODY</h3>
<p>All positive results subject to confirmation shall follow chain-of-custody documentation procedures. Chain of custody forms shall be maintained in the resident file for a minimum of 7 years.</p>

<h3>7. SUBSTANCES TESTED</h3>
<p>Standard testing panel includes: Amphetamines, Methamphetamine, Cocaine, Opiates, Oxycodone, Fentanyl, Benzodiazepines, THC (Marijuana), Buprenorphine, Methadone, Barbiturates, PCP.</p>

<h3>8. MEDICATION-ASSISTED TREATMENT (MAT)</h3>
<p>Residents prescribed MAT medications (buprenorphine/naloxone, methadone, naltrexone) must disclose their prescription at intake. Undisclosed MAT medication detected in a screen does not constitute a violation if disclosed within 24 hours. The Facility does not discriminate against residents receiving lawfully prescribed MAT in accordance with the Fair Housing Act and ADA.</p>

<h3>9. CONSEQUENCES OF POSITIVE RESULTS</h3>
<ul>
<li><strong>First positive:</strong> Immediate clinical review; mandatory clinical consultation within 24 hours; safety plan required.</li>
<li><strong>Second positive within 90 days:</strong> Termination of residency per discharge procedures with minimum 7-day notice.</li>
<li><strong>Any positive involving methamphetamine, fentanyl, or heroin:</strong> May result in immediate termination at management discretion.</li>
<li><strong>Dilute specimen:</strong> Treated as inconclusive; resident required to retest within 2 hours under direct observation.</li>
<li><strong>Refused test:</strong> Treated as positive result.</li>
</ul>

<h3>10. PRIVACY AND CONFIDENTIALITY</h3>
<p>All test results are confidential and maintained in accordance with 42 C.F.R. Part 2. Results shall not be disclosed to any third party without the resident's written consent except as required by law (court order, mandatory reporting).</p>

<h3>11. APPEALS</h3>
<p>Residents may request a confirmation test of any positive result at their own expense within 24 hours of notification. The Facility will provide the chain-of-custody documentation upon request.</p>

<div style="margin-top:40px;">
<p>Facility Representative: ____________________________ Date: ______________</p>
<p>Name: {{facility_rep_name}} | Title: {{facility_rep_title}}</p>
<br/>
<p>Resident Acknowledgment: I have read and understand this Drug Testing Policy.</p>
<p>Resident Signature: ____________________________ Date: ______________</p>
<p>Printed Name: {{resident_name}}</p>
</div>
</div>',
  '[
    {"name":"facility_name","label":"Facility Name","type":"text","required":true,"default_value":""},
    {"name":"facility_address","label":"Facility Address","type":"text","required":true,"default_value":""},
    {"name":"effective_date","label":"Effective Date","type":"date","required":true,"default_value":""},
    {"name":"resident_name","label":"Resident Full Name","type":"text","required":true,"default_value":""},
    {"name":"facility_rep_name","label":"Facility Representative Name","type":"text","required":true,"default_value":""},
    {"name":"facility_rep_title","label":"Facility Representative Title","type":"text","required":true,"default_value":"House Manager"}
  ]'::jsonb
) ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Template 7: Medication Policy
-- ============================================================
INSERT INTO public.document_templates (id, name, category, template_content, variables_json)
VALUES (
  '20000000-0000-0000-0000-000000000007',
  'Medication Management Policy',
  'medication_policy',
  '<div class="document">
<h1 style="text-align:center;">MEDICATION MANAGEMENT POLICY</h1>
<h2 style="text-align:center;">{{facility_name}}</h2>
<p style="text-align:center;">Effective Date: {{effective_date}}</p>
<hr/>

<h3>1. PURPOSE</h3>
<p>This policy establishes procedures for the safe management of medications at {{facility_name}}. The Facility is a supportive housing program, not a medical facility. Staff do not administer medications and are not licensed to provide medical advice. This policy ensures resident safety, regulatory compliance, and prevention of medication misuse.</p>

<h3>2. MEDICATION DISCLOSURE AT INTAKE</h3>
<p>All residents must disclose all prescription and over-the-counter medications at intake, including:</p>
<ul>
<li>Prescription medications with valid, current prescription documentation</li>
<li>Vitamins and supplements</li>
<li>Over-the-counter medications (Tylenol, Benadryl, etc.)</li>
<li>Medication-Assisted Treatment (MAT) medications: buprenorphine/Suboxone, methadone, naltrexone/Vivitrol</li>
<li>Psychiatric medications prescribed by a licensed provider</li>
</ul>
<p>Failure to disclose medications at intake may result in termination of residency.</p>

<h3>3. STORAGE REQUIREMENTS</h3>
<ul>
<li>All medications must be stored in the resident''s assigned lockbox at all times when not in use.</li>
<li>Lockboxes are provided by the Facility and remain secured to the resident''s furniture or assigned storage location.</li>
<li>Residents are responsible for maintaining the lockbox key or combination.</li>
<li>Controlled substances requiring refrigeration will be stored in a locked section of the designated house refrigerator.</li>
<li>Medications shall not be stored in bathrooms due to humidity and temperature concerns.</li>
</ul>

<h3>4. SELF-ADMINISTRATION</h3>
<p>Residents are solely responsible for self-administering their own medications. Staff will not:</p>
<ul>
<li>Administer, dispense, or handle any resident''s medication</li>
<li>Remind residents to take medications (except in limited emergency situations)</li>
<li>Verify dosage or provide medical guidance</li>
</ul>

<h3>5. MEDICATION-ASSISTED TREATMENT (MAT)</h3>
<p>The Facility supports residents receiving MAT in accordance with the Americans with Disabilities Act (ADA) and Fair Housing Act. Residents on MAT must:</p>
<ul>
<li>Provide documentation of their prescription from a licensed provider</li>
<li>Adhere to all medication administration requirements set by their prescribing provider</li>
<li>Store MAT medications in their assigned lockbox</li>
<li>Not share MAT medications with any other person (felony offense under A.R.S. § 13-3406)</li>
</ul>

<h3>6. NEW PRESCRIPTIONS DURING RESIDENCY</h3>
<p>Residents who receive new prescriptions during their stay must:</p>
<ul>
<li>Notify house management within 24 hours</li>
<li>Update their medication inventory record</li>
<li>Provide prescription documentation to be filed in their resident record</li>
</ul>

<h3>7. PROHIBITED MEDICATIONS</h3>
<p>The following are prohibited unless prescribed by a licensed provider with documentation:</p>
<ul>
<li>Any benzodiazepine (Xanax, Valium, Klonopin, Ativan)</li>
<li>Any opioid pain medication (Vicodin, Percocet, OxyContin)</li>
<li>Stimulants (Adderall, Ritalin) without verified ADHD diagnosis and prescription</li>
<li>Muscle relaxants (Flexeril, Soma)</li>
<li>Pseudoephedrine-containing cold medications in quantities exceeding 30-day personal use</li>
</ul>

<h3>8. MEDICATION INVENTORY</h3>
<p>A medication inventory shall be completed at intake and updated upon any change. The inventory is maintained in the resident file and treated as confidential per 42 C.F.R. Part 2.</p>

<h3>9. EXPIRED OR UNUSED MEDICATIONS</h3>
<p>Residents must properly dispose of expired or unused medications. The Facility will facilitate take-back to a licensed DEA collection site if requested.</p>

<div style="margin-top:40px;">
<p>I, <strong>{{resident_name}}</strong>, acknowledge that I have read and understood this Medication Management Policy.</p>
<br/>
<p>Resident Signature: ____________________________ Date: ______________</p>
<p>House Manager Signature: ____________________________ Date: ______________</p>
<p>House Manager Name: {{facility_rep_name}}</p>
</div>
</div>',
  '[
    {"name":"facility_name","label":"Facility Name","type":"text","required":true,"default_value":""},
    {"name":"effective_date","label":"Effective Date","type":"date","required":true,"default_value":""},
    {"name":"resident_name","label":"Resident Full Name","type":"text","required":true,"default_value":""},
    {"name":"facility_rep_name","label":"House Manager Name","type":"text","required":true,"default_value":""}
  ]'::jsonb
) ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Template 8: Emergency Procedures
-- ============================================================
INSERT INTO public.document_templates (id, name, category, template_content, variables_json)
VALUES (
  '20000000-0000-0000-0000-000000000008',
  'Emergency Procedures Manual',
  'emergency_procedures',
  '<div class="document">
<h1 style="text-align:center;">EMERGENCY PROCEDURES MANUAL</h1>
<h2 style="text-align:center;">{{facility_name}}</h2>
<p style="text-align:center;">{{facility_address}} | House Phone: {{house_phone}}</p>
<p style="text-align:center;">Effective Date: {{effective_date}}</p>
<p style="text-align:center;background:#fee2e2;padding:10px;border-radius:4px;"><strong>IN ALL EMERGENCIES: CALL 911 FIRST</strong></p>
<hr/>

<h2>EMERGENCY CONTACT TREE</h2>
<table style="width:100%;border-collapse:collapse;">
<tr><td style="border:1px solid #ccc;padding:6px;font-weight:bold;">Emergency Services</td><td style="border:1px solid #ccc;padding:6px;">911</td></tr>
<tr><td style="border:1px solid #ccc;padding:6px;font-weight:bold;">Poison Control</td><td style="border:1px solid #ccc;padding:6px;">1-800-222-1222</td></tr>
<tr><td style="border:1px solid #ccc;padding:6px;font-weight:bold;">House Manager</td><td style="border:1px solid #ccc;padding:6px;">{{house_manager_phone}}</td></tr>
<tr><td style="border:1px solid #ccc;padding:6px;font-weight:bold;">Owner/Director</td><td style="border:1px solid #ccc;padding:6px;">{{owner_phone}}</td></tr>
<tr><td style="border:1px solid #ccc;padding:6px;font-weight:bold;">Crisis Line (AZ)</td><td style="border:1px solid #ccc;padding:6px;">602-222-9444</td></tr>
<tr><td style="border:1px solid #ccc;padding:6px;font-weight:bold;">AHCCCS Crisis Line</td><td style="border:1px solid #ccc;padding:6px;">1-844-534-4673</td></tr>
</table>

<h2>PROTOCOL 1: SUSPECTED OVERDOSE / DRUG EMERGENCY</h2>
<div style="background:#fee2e2;border:2px solid #dc2626;border-radius:4px;padding:12px;margin:10px 0;">
<p><strong>CRITICAL — FOLLOW IN ORDER:</strong></p>
<ol>
<li><strong>CALL 911 IMMEDIATELY.</strong> Say: "I have someone who may have overdosed at [address]. They are unconscious/not breathing."</li>
<li><strong>Retrieve Narcan (naloxone)</strong> from designated location: {{narcan_location}}</li>
<li><strong>Administer Narcan:</strong> Spray one dose into one nostril. Repeat in 2–3 minutes if no response with second dose in other nostril.</li>
<li><strong>Perform rescue breathing</strong> if person is not breathing and you are trained. Give 1 breath every 5 seconds.</li>
<li><strong>Place in recovery position</strong> (on their side) once breathing resumes to prevent choking.</li>
<li><strong>Stay with the person</strong> until EMS arrives. Do not leave them alone.</li>
<li><strong>Arizona Good Samaritan Law (A.R.S. § 13-3423)</strong> protects you from drug-related criminal prosecution when calling 911 for an overdose.</li>
<li><strong>Call House Manager</strong> immediately after EMS is contacted.</li>
<li><strong>Do not move</strong> or disturb any potential evidence if law enforcement may be involved.</li>
<li><strong>Complete Emergency Event Report</strong> within 24 hours.</li>
</ol>
</div>

<h2>PROTOCOL 2: FIRE EMERGENCY</h2>
<ol>
<li><strong>Alert all occupants immediately.</strong> Yell "FIRE!" and activate the nearest fire alarm pull station.</li>
<li><strong>Call 911.</strong></li>
<li><strong>DO NOT use elevators</strong> (if applicable). Use designated exit routes posted on each floor.</li>
<li><strong>Assist residents</strong> with mobility limitations to evacuate.</li>
<li><strong>Close all doors</strong> behind you as you exit to slow fire spread.</li>
<li><strong>Proceed to designated assembly point:</strong> {{assembly_point}}</li>
<li><strong>Account for all residents.</strong> Report any missing persons to fire department immediately.</li>
<li><strong>Do not re-enter</strong> the building until cleared by fire department.</li>
<li><strong>Contact House Manager and Owner</strong> immediately.</li>
</ol>
<p>Fire extinguisher locations: {{fire_extinguisher_locations}}</p>
<p>Fire extinguishers are inspected: Monthly by staff. Annually by certified technician.</p>

<h2>PROTOCOL 3: MEDICAL EMERGENCY</h2>
<ol>
<li><strong>Call 911</strong> if person is unconscious, having difficulty breathing, experiencing chest pain, or in severe distress.</li>
<li><strong>Do not move</strong> the person unless they are in immediate danger.</li>
<li><strong>Stay on the line</strong> with 911 dispatcher and follow their instructions.</li>
<li><strong>Send someone to the front</strong> to flag down EMS upon arrival.</li>
<li><strong>Retrieve the First Aid Kit</strong> from: {{first_aid_location}}</li>
<li><strong>Do not administer any medication</strong> unless you are licensed to do so.</li>
<li><strong>Notify House Manager</strong> and document the event.</li>
</ol>

<h2>PROTOCOL 4: MENTAL HEALTH CRISIS</h2>
<ol>
<li><strong>Stay calm</strong> and speak in a slow, gentle voice.</li>
<li><strong>Do not leave the person alone</strong> if they may be a danger to themselves or others.</li>
<li><strong>Remove potential hazards</strong> from the immediate environment if safe to do so.</li>
<li><strong>Call 911</strong> if there is immediate danger of harm. Request a "mental health crisis team" or CIT officer.</li>
<li><strong>Arizona Crisis Line: 602-222-9444</strong> (24/7). Call for guidance before escalating to 911 if appropriate.</li>
<li><strong>Do not physically restrain</strong> the person unless you are trained and there is imminent danger.</li>
<li><strong>Contact House Manager and Owner.</strong></li>
</ol>

<h2>PROTOCOL 5: VIOLENCE OR PHYSICAL ALTERCATION</h2>
<ol>
<li><strong>Call 911 immediately</strong> if violence is occurring or weapons are involved.</li>
<li><strong>Do not physically intervene</strong> unless you are trained in de-escalation and can do so safely.</li>
<li><strong>Separate parties</strong> if possible without endangering yourself.</li>
<li><strong>Escort uninvolved residents</strong> to a safe area away from the incident.</li>
<li><strong>Preserve any evidence</strong> until law enforcement arrives.</li>
<li><strong>Document the incident</strong> with names, statements, and timestamps.</li>
<li>Any resident who engages in physical violence is subject to <strong>immediate termination of residency</strong>.</li>
</ol>

<h2>POST-INCIDENT REQUIREMENTS</h2>
<ul>
<li>Complete Emergency Event Report in the House Harmony Desk system within 24 hours</li>
<li>Notify ADHS per reporting requirements (A.A.C. R9-12-218 — serious incidents within 24 hours)</li>
<li>Provide incident summary to AzRHA if certified</li>
<li>Conduct post-incident staff debrief within 48 hours</li>
<li>Update emergency protocols if any gaps identified</li>
</ul>

<p style="margin-top:20px;font-size:0.9em;">This manual was last reviewed: {{review_date}} by {{reviewer_name}}</p>
</div>',
  '[
    {"name":"facility_name","label":"Facility Name","type":"text","required":true,"default_value":""},
    {"name":"facility_address","label":"Facility Address","type":"text","required":true,"default_value":""},
    {"name":"house_phone","label":"House Phone Number","type":"text","required":true,"default_value":""},
    {"name":"house_manager_phone","label":"House Manager Cell Phone","type":"text","required":true,"default_value":""},
    {"name":"owner_phone","label":"Owner/Director Phone","type":"text","required":true,"default_value":""},
    {"name":"narcan_location","label":"Narcan Storage Location","type":"text","required":true,"default_value":"Kitchen cabinet above refrigerator"},
    {"name":"assembly_point","label":"Fire Assembly Point","type":"text","required":true,"default_value":"Front sidewalk at end of driveway"},
    {"name":"fire_extinguisher_locations","label":"Fire Extinguisher Locations","type":"text","required":true,"default_value":"Kitchen, each floor hallway"},
    {"name":"first_aid_location","label":"First Aid Kit Location","type":"text","required":true,"default_value":"Manager office"},
    {"name":"effective_date","label":"Effective Date","type":"date","required":true,"default_value":""},
    {"name":"review_date","label":"Last Review Date","type":"date","required":false,"default_value":""},
    {"name":"reviewer_name","label":"Reviewed By","type":"text","required":false,"default_value":""}
  ]'::jsonb
) ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Template 9: Confidentiality Policy (42 CFR Part 2 + HIPAA)
-- ============================================================
INSERT INTO public.document_templates (id, name, category, template_content, variables_json)
VALUES (
  '20000000-0000-0000-0000-000000000009',
  'Confidentiality Policy',
  'confidentiality_policy',
  '<div class="document">
<h1 style="text-align:center;">CONFIDENTIALITY AND PRIVACY POLICY</h1>
<h2 style="text-align:center;">{{facility_name}}</h2>
<p style="text-align:center;">Effective Date: {{effective_date}}</p>
<hr/>

<h3>1. PURPOSE</h3>
<p>{{facility_name}} is committed to protecting the privacy and confidentiality of all resident information. This policy describes our obligations under federal law, including 42 C.F.R. Part 2 (Confidentiality of Substance Use Disorder Records), and applicable state law.</p>

<h3>2. FEDERAL LAW — 42 C.F.R. PART 2</h3>
<p>Federal law and regulations protect the confidentiality of substance use disorder patient records. The Facility may not say to a person outside the Facility that a resident attends the program, or disclose any information identifying a resident as having or having had a substance use disorder, unless:</p>
<ul>
<li>The resident consents in writing using a specific consent form that complies with 42 C.F.R. Part 2;</li>
<li>The disclosure is allowed by a court order; or</li>
<li>The disclosure is made to medical personnel in a medical emergency or to qualified personnel for research, audit, or program evaluation.</li>
</ul>
<p>Violation of the federal law is a crime. Suspected violations may be reported to the United States Attorney in the district where the violation occurred.</p>

<h3>3. INFORMATION WE COLLECT</h3>
<p>The Facility collects and maintains the following information about residents:</p>
<ul>
<li>Personal identifying information (name, date of birth, address, contact information)</li>
<li>Intake and assessment records</li>
<li>Drug testing records and results</li>
<li>Emergency contact information</li>
<li>Incident reports involving the resident</li>
<li>Employment, meeting attendance, and court requirement records</li>
<li>Payment and financial records</li>
</ul>

<h3>4. INFORMATION WE DO NOT SHARE WITHOUT CONSENT</h3>
<p>Without resident written consent, the Facility will NOT disclose:</p>
<ul>
<li>Whether an individual is or was a resident</li>
<li>Drug test results</li>
<li>Details of any incident involving the resident</li>
<li>Any information that could directly or indirectly identify the resident as having a substance use disorder</li>
</ul>

<h3>5. PERMITTED DISCLOSURES WITHOUT CONSENT</h3>
<p>The Facility may disclose resident information without written consent in the following circumstances:</p>
<ul>
<li><strong>Medical Emergency:</strong> To medical personnel treating the resident</li>
<li><strong>Mandatory Reporting:</strong> As required by A.R.S. § 46-454 (child abuse/neglect reporting) or A.R.S. § 46-456 (vulnerable adult abuse)</li>
<li><strong>Court Order:</strong> When required by a court order meeting the requirements of 42 C.F.R. § 2.61-2.67</li>
<li><strong>Audit and Oversight:</strong> To ADHS or AzRHA for program evaluation and compliance review</li>
<li><strong>Crime on Premises:</strong> Applicable information to law enforcement in cases of crimes occurring on Facility premises</li>
</ul>

<h3>6. STAFF OBLIGATIONS</h3>
<p>All staff and volunteers must:</p>
<ul>
<li>Complete confidentiality training before interacting with residents</li>
<li>Sign a Confidentiality Agreement as part of their employment</li>
<li>Never discuss resident information in public areas or with unauthorized persons</li>
<li>Secure all physical resident files and ensure digital records require password access</li>
<li>Report any suspected confidentiality breach immediately to management</li>
</ul>

<h3>7. RESIDENT RIGHTS</h3>
<p>Residents have the right to:</p>
<ul>
<li>Review their own records upon written request</li>
<li>Request correction of inaccurate information</li>
<li>Provide or revoke consent to share information at any time</li>
<li>File a complaint with ADHS or the U.S. Department of Health and Human Services if they believe their privacy rights have been violated</li>
</ul>

<h3>8. RECORD RETENTION</h3>
<p>Resident records are retained for a minimum of 7 years following discharge, or 3 years after a minor reaches the age of majority, whichever is longer, pursuant to ADHS requirements.</p>

<div style="margin-top:40px;">
<p>I, <strong>{{resident_name}}</strong>, acknowledge receipt of this Confidentiality Policy and understand my rights.</p>
<br/>
<p>Resident Signature: ____________________________ Date: ______________</p>
<p>Staff Signature: ____________________________ Date: ______________</p>
</div>
</div>',
  '[
    {"name":"facility_name","label":"Facility Name","type":"text","required":true,"default_value":""},
    {"name":"effective_date","label":"Effective Date","type":"date","required":true,"default_value":""},
    {"name":"resident_name","label":"Resident Full Name","type":"text","required":true,"default_value":""}
  ]'::jsonb
) ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Template 10: Anti-Discrimination Policy
-- ============================================================
INSERT INTO public.document_templates (id, name, category, template_content, variables_json)
VALUES (
  '20000000-0000-0000-0000-000000000010',
  'Anti-Discrimination Policy',
  'anti_discrimination',
  '<div class="document">
<h1 style="text-align:center;">ANTI-DISCRIMINATION AND FAIR HOUSING POLICY</h1>
<h2 style="text-align:center;">{{facility_name}}</h2>
<p style="text-align:center;">Effective Date: {{effective_date}}</p>
<hr/>

<h3>1. STATEMENT OF NON-DISCRIMINATION</h3>
<p>{{facility_name}} is committed to providing equal access to its services without discrimination. In accordance with the Fair Housing Act (42 U.S.C. § 3604), the Americans with Disabilities Act (42 U.S.C. § 12101 et seq.), Section 504 of the Rehabilitation Act, and Arizona law (A.R.S. § 41-1491 et seq.), the Facility does not discriminate on the basis of:</p>
<ul>
<li>Race, color, or national origin</li>
<li>Religion</li>
<li>Sex (including gender identity and sexual orientation)</li>
<li>Disability (including those in recovery from substance use disorder)</li>
<li>Familial status</li>
<li>Age (40 and older)</li>
<li>Veteran or military status</li>
<li>Source of income (including housing vouchers, AHCCCS)</li>
</ul>

<h3>2. FAIR HOUSING ACT PROTECTIONS</h3>
<p>Individuals with a history of substance use disorder who are currently in recovery (not currently using) are protected under the Fair Housing Act as persons with a disability. The Facility will not:</p>
<ul>
<li>Refuse residency based solely on past substance use history</li>
<li>Apply different terms or conditions based on a protected class</li>
<li>Provide different services or privileges to residents based on protected characteristics</li>
<li>Make any statement that indicates a preference, limitation, or discrimination based on a protected class</li>
</ul>

<h3>3. REASONABLE ACCOMMODATIONS AND MODIFICATIONS</h3>
<p>The Facility will make reasonable accommodations in rules, policies, practices, or services when necessary to give residents with disabilities an equal opportunity to use and enjoy the housing. Residents requesting a reasonable accommodation must submit a written request to the House Manager. The Facility will respond within 10 business days.</p>
<p>Examples of reasonable accommodations include:</p>
<ul>
<li>Permission for an assistance animal despite a no-pets policy</li>
<li>Modified drug testing procedures for residents with medical conditions affecting test results</li>
<li>Accessible parking or modified facilities for physical disabilities</li>
<li>Continuation of MAT (Medication-Assisted Treatment) as permitted by the ADA</li>
</ul>

<h3>4. MEDICATION-ASSISTED TREATMENT (MAT) NON-DISCRIMINATION</h3>
<p>Consistent with the ADA and Fair Housing Act, the Facility does not exclude residents solely on the basis of lawfully prescribed Medication-Assisted Treatment (MAT), including buprenorphine/naloxone (Suboxone), naltrexone (Vivitrol), or methadone. Residents must comply with MAT documentation requirements per the Facility Medication Policy.</p>

<h3>5. COMPLAINT PROCEDURE</h3>
<p>Any resident, applicant, or visitor who believes they have been subjected to discrimination may:</p>
<ol>
<li>File a written complaint with the Facility Director at {{complaint_address}}</li>
<li>Contact the Arizona Attorney General Fair Housing Unit at (602) 542-5763 or azag.gov</li>
<li>File a complaint with the U.S. Department of Housing and Urban Development (HUD) at (800) 669-9777 or hud.gov/fairhousing</li>
<li>Contact the Arizona Civil Rights Division at (602) 771-7000</li>
</ol>
<p>Complaints will be investigated within 30 days. No retaliation will be taken against any person who in good faith files a complaint or participates in an investigation.</p>

<h3>6. STAFF TRAINING</h3>
<p>All staff receive anti-discrimination and Fair Housing training upon hire and annually thereafter. Documentation of training is maintained in staff records.</p>

<div style="margin-top:40px;">
<p>Acknowledged by: <strong>{{resident_name}}</strong></p>
<p>Resident Signature: ____________________________ Date: ______________</p>
<p>Staff Signature: ____________________________ Date: ______________</p>
</div>
</div>',
  '[
    {"name":"facility_name","label":"Facility Name","type":"text","required":true,"default_value":""},
    {"name":"effective_date","label":"Effective Date","type":"date","required":true,"default_value":""},
    {"name":"resident_name","label":"Resident Full Name","type":"text","required":true,"default_value":""},
    {"name":"complaint_address","label":"Director Contact Address/Email","type":"text","required":true,"default_value":""}
  ]'::jsonb
) ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Template 11: Code of Ethics
-- ============================================================
INSERT INTO public.document_templates (id, name, category, template_content, variables_json)
VALUES (
  '20000000-0000-0000-0000-000000000011',
  'Code of Ethics (NARR Adapted)',
  'code_of_ethics',
  '<div class="document">
<h1 style="text-align:center;">CODE OF ETHICS</h1>
<h2 style="text-align:center;">{{facility_name}}</h2>
<p style="text-align:center;">Adapted from NARR (National Alliance for Recovery Residences) Standards 3.0</p>
<p style="text-align:center;">Effective Date: {{effective_date}}</p>
<hr/>

<h3>PREAMBLE</h3>
<p>{{facility_name}} operates as a recovery home committed to supporting individuals in sustained recovery from substance use disorders. We hold ourselves, our staff, and our residents to the highest ethical standards, grounded in respect for human dignity, autonomy, and the recovery community. This Code of Ethics is adapted from the NARR National Standards and applies to all owners, operators, employees, contractors, and volunteers.</p>

<h3>PRINCIPLE 1 — COMMITMENT TO RECOVERY</h3>
<p>We believe that recovery from substance use disorder is possible for every person. We support diverse pathways to recovery including abstinence-based, medication-assisted, and faith-based approaches. We will never exploit residents'' vulnerability or take advantage of the power differential inherent in the provider-resident relationship.</p>

<h3>PRINCIPLE 2 — HONESTY AND INTEGRITY</h3>
<p>We conduct all activities with honesty and transparency. We do not misrepresent our services, qualifications, fees, or outcomes to residents, referral sources, or regulators. We maintain accurate records and report honestly to ADHS and AzRHA.</p>

<h3>PRINCIPLE 3 — RESIDENT DIGNITY AND RIGHTS</h3>
<p>We treat all residents with dignity and respect regardless of their history. We uphold residents'' rights to:</p>
<ul>
<li>Privacy and confidentiality per 42 C.F.R. Part 2</li>
<li>Freedom from physical, emotional, sexual, and financial abuse</li>
<li>File grievances without fear of retaliation</li>
<li>Receive services without discrimination based on race, sex, religion, disability, or other protected class</li>
<li>Adequate food, shelter, and a safe living environment</li>
</ul>

<h3>PRINCIPLE 4 — FINANCIAL TRANSPARENCY AND FAIR PRICING</h3>
<p>We charge only fees that are disclosed in the Resident Agreement. We will never:</p>
<ul>
<li>Charge fees not disclosed in the signed agreement</li>
<li>Receive kickbacks or referral fees from treatment programs, labs, or other vendors</li>
<li>Condition residency or services on referral to specific treatment providers</li>
<li>Charge for drug testing beyond the actual cost of the test</li>
</ul>
<p><strong>Per AzRHA Ethical Standards:</strong> Operators shall not receive compensation (financial or in-kind) from drug testing laboratories, transportation services, or treatment programs as a condition of referral. This practice is prohibited and may result in decertification.</p>

<h3>PRINCIPLE 5 — DRUG TESTING ETHICS</h3>
<p>Drug testing shall be conducted solely for safety and program integrity purposes. The Facility will:</p>
<ul>
<li>Never profit from drug testing</li>
<li>Use only state-approved testing methods</li>
<li>Maintain chain of custody for all confirmed positive results</li>
<li>Protect all test result information per 42 C.F.R. Part 2</li>
</ul>

<h3>PRINCIPLE 6 — STAFF CONDUCT</h3>
<p>All staff shall:</p>
<ul>
<li>Maintain appropriate professional boundaries with residents at all times</li>
<li>Not engage in personal, romantic, or financial relationships with residents</li>
<li>Report any abuse, neglect, or exploitation they witness or suspect</li>
<li>Complete required training and certifications</li>
<li>Disclose any conflict of interest to management immediately</li>
<li>Support the recovery of residents without enabling addictive behaviors</li>
</ul>

<h3>PRINCIPLE 7 — PROGRAM OPERATIONS</h3>
<p>We operate our program with the best interests of residents as our primary obligation. We will not accept more residents than our facility can safely and adequately serve. We will maintain compliance with all applicable ADHS regulations, AzRHA standards, and local zoning laws.</p>

<h3>PRINCIPLE 8 — COMMUNITY RESPONSIBILITY</h3>
<p>We are responsible members of our neighborhood and community. We will address concerns raised by neighbors, work cooperatively with local authorities, and ensure our residents'' conduct reflects positively on the recovery community.</p>

<h3>VIOLATIONS AND REPORTING</h3>
<p>Suspected violations of this Code of Ethics by staff may be reported to the Facility Director at {{complaint_contact}}. Violations may also be reported to:</p>
<ul>
<li>AzRHA: myazrha.org/report-a-concern</li>
<li>ADHS: azdhs.gov (complaint form)</li>
<li>Arizona Attorney General: azag.gov</li>
</ul>

<div style="margin-top:40px;">
<p><strong>Staff Acknowledgment:</strong> I have read, understood, and agree to uphold this Code of Ethics.</p>
<p>Staff Name: {{staff_name}}</p>
<p>Staff Signature: ____________________________ Date: ______________</p>
<p>Supervisor Signature: ____________________________ Date: ______________</p>
</div>
</div>',
  '[
    {"name":"facility_name","label":"Facility Name","type":"text","required":true,"default_value":""},
    {"name":"effective_date","label":"Effective Date","type":"date","required":true,"default_value":""},
    {"name":"staff_name","label":"Staff Member Name","type":"text","required":true,"default_value":""},
    {"name":"complaint_contact","label":"Director Contact Info","type":"text","required":true,"default_value":""}
  ]'::jsonb
) ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Template 12: Abuse Reporting Policy (A.R.S. 46-454)
-- ============================================================
INSERT INTO public.document_templates (id, name, category, template_content, variables_json)
VALUES (
  '20000000-0000-0000-0000-000000000012',
  'Mandatory Abuse Reporting Policy',
  'abuse_reporting',
  '<div class="document">
<h1 style="text-align:center;">MANDATORY ABUSE REPORTING POLICY</h1>
<h2 style="text-align:center;">{{facility_name}}</h2>
<p style="text-align:center;">Pursuant to A.R.S. § 46-454, A.R.S. § 13-3620, and Related Arizona Statutes</p>
<p style="text-align:center;">Effective Date: {{effective_date}}</p>
<hr/>

<h3>1. LEGAL BASIS</h3>
<p>Arizona law requires certain individuals to report known or suspected abuse, neglect, or exploitation. As operators of a residential facility serving vulnerable adults and persons in recovery, staff of {{facility_name}} are mandatory reporters under the following statutes:</p>
<ul>
<li><strong>A.R.S. § 46-454:</strong> Mandatory reporting of vulnerable adult abuse, neglect, and exploitation</li>
<li><strong>A.R.S. § 13-3620:</strong> Mandatory reporting of child abuse and neglect</li>
<li><strong>A.R.S. § 36-2221:</strong> Reporting requirements for behavioral health facilities</li>
</ul>

<h3>2. WHO MUST REPORT</h3>
<p>All employees, contractors, and volunteers of {{facility_name}} who in the course of their work reasonably believe they have seen or have reasonable cause to believe that a vulnerable adult or child has been abused, neglected, or exploited are <strong>mandatory reporters</strong>. This is a personal obligation — you cannot delegate your reporting obligation to a supervisor.</p>

<h3>3. WHAT MUST BE REPORTED</h3>
<p><strong>Vulnerable Adult (A.R.S. § 46-454):</strong></p>
<ul>
<li>Physical abuse: inflicting or allowing the infliction of physical injury</li>
<li>Emotional abuse: causing psychological harm through verbal or non-verbal acts</li>
<li>Neglect: failure to provide basic necessities (food, water, shelter, medical care, supervision)</li>
<li>Sexual abuse or exploitation</li>
<li>Financial exploitation: taking or misusing a vulnerable adult''s funds or property without consent</li>
<li>Abandonment</li>
</ul>
<p><strong>A "vulnerable adult"</strong> is a person 18 or older who has a physical or mental impairment (including those in early recovery) that substantially impairs their capacity to protect themselves.</p>

<h3>4. HOW AND WHEN TO REPORT</h3>
<p><strong>Report within 24 hours of gaining knowledge of suspected abuse.</strong></p>
<table style="width:100%;border-collapse:collapse;margin:10px 0;">
<tr><th style="border:1px solid #ccc;padding:8px;background:#f5f5f5;">Type of Abuse</th><th style="border:1px solid #ccc;padding:8px;background:#f5f5f5;">Report To</th><th style="border:1px solid #ccc;padding:8px;background:#f5f5f5;">Phone</th></tr>
<tr><td style="border:1px solid #ccc;padding:8px;">Vulnerable Adult Abuse/Neglect</td><td style="border:1px solid #ccc;padding:8px;">APS (Adult Protective Services)</td><td style="border:1px solid #ccc;padding:8px;">877-767-2385 (24/7)</td></tr>
<tr><td style="border:1px solid #ccc;padding:8px;">Child Abuse/Neglect</td><td style="border:1px solid #ccc;padding:8px;">Arizona DCS</td><td style="border:1px solid #ccc;padding:8px;">888-767-2445 (24/7)</td></tr>
<tr><td style="border:1px solid #ccc;padding:8px;">Immediate Danger</td><td style="border:1px solid #ccc;padding:8px;">911 (Law Enforcement)</td><td style="border:1px solid #ccc;padding:8px;">911</td></tr>
</table>
<p>Oral reports should be followed by written reports within 72 hours as required by the receiving agency.</p>

<h3>5. WHAT TO INCLUDE IN YOUR REPORT</h3>
<ul>
<li>Your name and contact information (you may request confidentiality)</li>
<li>Name, address, and description of the victim</li>
<li>Nature and extent of the abuse or suspected abuse</li>
<li>Any observable evidence</li>
<li>Identity of the alleged perpetrator if known</li>
</ul>

<h3>6. CONFIDENTIALITY AND ANTI-RETALIATION</h3>
<p>The identity of a mandatory reporter is confidential by law (A.R.S. § 46-454(G)) and shall not be disclosed without the reporter''s consent. <strong>{{facility_name}} strictly prohibits retaliation against any employee who makes a good-faith report of suspected abuse.</strong> Retaliation is a violation of Arizona law and may result in immediate termination and civil or criminal liability.</p>

<h3>7. DOCUMENTATION</h3>
<p>Staff must document all reports made in the House Harmony Desk incident tracking system within 24 hours. Documentation must include: date and time of report, name of receiving agency, confirmation number if provided, and any immediate protective actions taken.</p>

<h3>8. FAILURE TO REPORT</h3>
<p>Failure by a mandatory reporter to report suspected abuse is a Class 1 misdemeanor under A.R.S. § 46-454(L) and may result in:</p>
<ul>
<li>Criminal prosecution</li>
<li>Immediate termination of employment</li>
<li>Revocation of professional licenses</li>
<li>Civil liability</li>
</ul>

<div style="margin-top:40px;">
<p>I, <strong>{{staff_name}}</strong>, acknowledge that I have read and understand this Mandatory Abuse Reporting Policy and my obligations as a mandatory reporter under Arizona law.</p>
<br/>
<p>Staff Signature: ____________________________ Date: ______________</p>
<p>Supervisor: ____________________________ Date: ______________</p>
</div>
</div>',
  '[
    {"name":"facility_name","label":"Facility Name","type":"text","required":true,"default_value":""},
    {"name":"effective_date","label":"Effective Date","type":"date","required":true,"default_value":""},
    {"name":"staff_name","label":"Staff Member Name","type":"text","required":true,"default_value":""}
  ]'::jsonb
) ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Template 13: Record Retention Policy
-- ============================================================
INSERT INTO public.document_templates (id, name, category, template_content, variables_json)
VALUES (
  '20000000-0000-0000-0000-000000000013',
  'Record Retention Policy',
  'record_retention',
  '<div class="document">
<h1 style="text-align:center;">RECORD RETENTION AND DESTRUCTION POLICY</h1>
<h2 style="text-align:center;">{{facility_name}}</h2>
<p style="text-align:center;">Pursuant to ADHS 9 A.A.C. 12 and A.R.S. § 12-541</p>
<p style="text-align:center;">Effective Date: {{effective_date}}</p>
<hr/>

<h3>1. PURPOSE</h3>
<p>This policy establishes minimum record retention periods for all records maintained by {{facility_name}}, consistent with Arizona Department of Health Services (ADHS) regulations, federal requirements under 42 C.F.R. Part 2, and generally accepted standards for sober living home operations.</p>

<h3>2. RESIDENT RECORDS</h3>
<table style="width:100%;border-collapse:collapse;margin:10px 0;">
<tr><th style="border:1px solid #ccc;padding:8px;background:#f5f5f5;">Record Type</th><th style="border:1px solid #ccc;padding:8px;background:#f5f5f5;">Minimum Retention</th><th style="border:1px solid #ccc;padding:8px;background:#f5f5f5;">Statutory Basis</th></tr>
<tr><td style="border:1px solid #ccc;padding:8px;">Resident Agreement / Lease</td><td style="border:1px solid #ccc;padding:8px;">7 years post-discharge</td><td style="border:1px solid #ccc;padding:8px;">A.R.S. § 12-550</td></tr>
<tr><td style="border:1px solid #ccc;padding:8px;">Intake and assessment forms</td><td style="border:1px solid #ccc;padding:8px;">7 years post-discharge</td><td style="border:1px solid #ccc;padding:8px;">ADHS; 42 C.F.R. § 2.16</td></tr>
<tr><td style="border:1px solid #ccc;padding:8px;">Drug test records</td><td style="border:1px solid #ccc;padding:8px;">7 years post-discharge</td><td style="border:1px solid #ccc;padding:8px;">ADHS; chain of custody requirements</td></tr>
<tr><td style="border:1px solid #ccc;padding:8px;">Incident reports</td><td style="border:1px solid #ccc;padding:8px;">7 years from date of incident</td><td style="border:1px solid #ccc;padding:8px;">A.R.S. § 12-550</td></tr>
<tr><td style="border:1px solid #ccc;padding:8px;">Discharge summary</td><td style="border:1px solid #ccc;padding:8px;">7 years post-discharge</td><td style="border:1px solid #ccc;padding:8px;">ADHS</td></tr>
<tr><td style="border:1px solid #ccc;padding:8px;">Emergency contact records</td><td style="border:1px solid #ccc;padding:8px;">3 years post-discharge</td><td style="border:1px solid #ccc;padding:8px;">Best practice</td></tr>
<tr><td style="border:1px solid #ccc;padding:8px;">Signed consent and acknowledgment forms</td><td style="border:1px solid #ccc;padding:8px;">7 years post-discharge</td><td style="border:1px solid #ccc;padding:8px;">ADHS</td></tr>
<tr><td style="border:1px solid #ccc;padding:8px;">Medication records</td><td style="border:1px solid #ccc;padding:8px;">7 years post-discharge</td><td style="border:1px solid #ccc;padding:8px;">ADHS; 42 C.F.R. § 2.16</td></tr>
</table>

<h3>3. FINANCIAL RECORDS</h3>
<table style="width:100%;border-collapse:collapse;margin:10px 0;">
<tr><th style="border:1px solid #ccc;padding:8px;background:#f5f5f5;">Record Type</th><th style="border:1px solid #ccc;padding:8px;background:#f5f5f5;">Minimum Retention</th></tr>
<tr><td style="border:1px solid #ccc;padding:8px;">Rent receipts and payment records</td><td style="border:1px solid #ccc;padding:8px;">7 years</td></tr>
<tr><td style="border:1px solid #ccc;padding:8px;">Bank statements</td><td style="border:1px solid #ccc;padding:8px;">7 years</td></tr>
<tr><td style="border:1px solid #ccc;padding:8px;">Tax returns and supporting documents</td><td style="border:1px solid #ccc;padding:8px;">7 years (IRS requirement)</td></tr>
<tr><td style="border:1px solid #ccc;padding:8px;">Accounts payable/receivable</td><td style="border:1px solid #ccc;padding:8px;">7 years</td></tr>
<tr><td style="border:1px solid #ccc;padding:8px;">Payroll records</td><td style="border:1px solid #ccc;padding:8px;">4 years (FLSA/IRS)</td></tr>
</table>

<h3>4. STAFF AND EMPLOYMENT RECORDS</h3>
<table style="width:100%;border-collapse:collapse;margin:10px 0;">
<tr><th style="border:1px solid #ccc;padding:8px;background:#f5f5f5;">Record Type</th><th style="border:1px solid #ccc;padding:8px;background:#f5f5f5;">Minimum Retention</th></tr>
<tr><td style="border:1px solid #ccc;padding:8px;">Background check records</td><td style="border:1px solid #ccc;padding:8px;">5 years or duration of employment + 3 years</td></tr>
<tr><td style="border:1px solid #ccc;padding:8px;">Training and certification records</td><td style="border:1px solid #ccc;padding:8px;">5 years post-employment</td></tr>
<tr><td style="border:1px solid #ccc;padding:8px;">Performance reviews</td><td style="border:1px solid #ccc;padding:8px;">3 years post-employment</td></tr>
<tr><td style="border:1px solid #ccc;padding:8px;">I-9 forms</td><td style="border:1px solid #ccc;padding:8px;">3 years after hire or 1 year after termination (whichever is later)</td></tr>
</table>

<h3>5. FACILITY AND COMPLIANCE RECORDS</h3>
<table style="width:100%;border-collapse:collapse;margin:10px 0;">
<tr><th style="border:1px solid #ccc;padding:8px;background:#f5f5f5;">Record Type</th><th style="border:1px solid #ccc;padding:8px;background:#f5f5f5;">Minimum Retention</th></tr>
<tr><td style="border:1px solid #ccc;padding:8px;">ADHS license and inspection records</td><td style="border:1px solid #ccc;padding:8px;">10 years</td></tr>
<tr><td style="border:1px solid #ccc;padding:8px;">AzRHA certification records</td><td style="border:1px solid #ccc;padding:8px;">10 years</td></tr>
<tr><td style="border:1px solid #ccc;padding:8px;">Insurance policies and claims</td><td style="border:1px solid #ccc;padding:8px;">10 years</td></tr>
<tr><td style="border:1px solid #ccc;padding:8px;">Policies and procedures (all versions)</td><td style="border:1px solid #ccc;padding:8px;">Permanent</td></tr>
<tr><td style="border:1px solid #ccc;padding:8px;">Lease or property documents</td><td style="border:1px solid #ccc;padding:8px;">Duration + 7 years</td></tr>
</table>

<h3>6. STORAGE AND SECURITY</h3>
<p>All physical records are stored in locked cabinets at {{facility_address}}. Electronic records are stored in password-protected systems with role-based access controls. Backup copies are maintained per our data security policy.</p>
<p>Records containing substance use disorder information (42 C.F.R. Part 2) are stored separately from general records and accessible only to authorized staff.</p>

<h3>7. RECORD DESTRUCTION</h3>
<p>Upon expiration of the retention period, records are destroyed using the following methods:</p>
<ul>
<li>Paper records: Cross-cut shredding by a certified destruction service</li>
<li>Electronic records: Secure deletion using DOD 5220.22-M standard or equivalent</li>
<li>A Certificate of Destruction is maintained for all 42 C.F.R. Part 2 records</li>
</ul>
<p><strong>Records may not be destroyed if subject to ongoing litigation, investigation, or regulatory hold.</strong></p>

<h3>8. POLICY REVIEW</h3>
<p>This policy is reviewed annually or when there are changes to applicable law. Questions regarding record retention should be directed to {{records_contact}}.</p>

<div style="margin-top:40px;">
<p>Approved by: <strong>{{approver_name}}</strong> | Title: {{approver_title}}</p>
<p>Signature: ____________________________ Date: ______________</p>
</div>
</div>',
  '[
    {"name":"facility_name","label":"Facility Name","type":"text","required":true,"default_value":""},
    {"name":"facility_address","label":"Facility Address","type":"text","required":true,"default_value":""},
    {"name":"effective_date","label":"Effective Date","type":"date","required":true,"default_value":""},
    {"name":"records_contact","label":"Records Officer Contact","type":"text","required":true,"default_value":""},
    {"name":"approver_name","label":"Approver Name","type":"text","required":true,"default_value":""},
    {"name":"approver_title","label":"Approver Title","type":"text","required":true,"default_value":"Director"}
  ]'::jsonb
) ON CONFLICT (id) DO NOTHING;
