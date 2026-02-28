-- ============================================================
-- LMS Course 6: Arizona Sober Living Startup Guide (For Operators)
-- 8 lessons covering the complete startup journey for new operators.
-- This course is seeded with stable UUIDs for idempotent re-runs.
-- ============================================================

INSERT INTO public.lms_courses (id, title, description, category, cover_color, estimated_minutes, passing_score, is_required, is_active, sort_order)
VALUES ('c0000006-0000-0000-0000-000000000006',
  'Arizona Sober Living Startup Guide',
  'The complete operator roadmap for launching a certified sober living home in Arizona. Covers regulatory tracks, ADHS licensing, business formation, zoning, insurance, policies, referral networks, and financial planning — all sourced from Arizona law and ADHS requirements.',
  'operator-startup', '#2563eb', 90, 80, false, true, 6)
ON CONFLICT (id) DO NOTHING;

-- ── Lesson 1: SLH vs BHRF ─────────────────────────────────────
INSERT INTO public.lms_lessons (id, course_id, sort_order, title, content_type, content_body, duration_minutes, has_quiz)
VALUES (
  'a0060100-0000-0000-0000-000000000001',
  'c0000006-0000-0000-0000-000000000006',
  1,
  'SLH vs BHRF — Choosing Your Regulatory Track',
  'text',
  E'## SLH vs BHRF — Choosing Your Regulatory Track\n\nArizona has two distinct regulatory tracks for sober living and residential recovery programs. Choosing the right track on day one shapes everything: your licensing process, your insurance requirements, your revenue model, and your staffing obligations.\n\n### Track 1: Sober Living Home (SLH)\n\nRegulated under **A.R.S. §§ 36-2061 through 36-2065** and ADHS administrative rules.\n\n- **Model:** Peer-supported, structured recovery environment. No clinical services.\n- **ADHS License Fee:** $500 base + $100 per maximum resident capacity\n- **Staff Requirement:** House manager on site (no clinical license required)\n- **Insurance Minimum:** Commercial General Liability + Property\n- **Revenue Model:** Monthly program fees paid directly by residents\n- **Resident Status:** Leaseholders with tenancy protections under Arizona law\n- **Typical Stay:** 6 to 18 months\n- **NARR Level:** Typically Level I or II\n\n**Ideal for:** First-time operators, limited capital, peer-focused missions.\n\n### Track 2: Behavioral Health Residential Facility (BHRF)\n\nRegulated under **9 A.A.C. 10** (ADHS behavioral health licensing rules).\n\n- **Model:** Residential treatment with clinical services; can bill insurance and AHCCCS.\n- **Licensing:** More complex ADHS behavioral health license; separate AHCCCS enrollment if billing Medicaid\n- **Staff Requirements:** Licensed clinical staff (counselors, case managers)\n- **Insurance:** Higher minimums; professional liability required\n- **Revenue Model:** Fee-for-service, insurance billing, AHCCCS capitation\n- **Accreditation:** Often required for AHCCCS enrollment (JCAHO, CARF, or CARF ASAM LOC)\n- **Startup Cost:** $75,000 – $250,000+ (vs $35,000 – $80,000 for SLH)\n\n**Ideal for:** Operators with clinical background and strong capital.\n\n### Decision Matrix\n\n| Factor | SLH | BHRF |\n|---|---|---|\n| Regulatory complexity | Moderate | High |\n| Startup cost | $35K – $80K | $75K – $250K+ |\n| Clinical staff required | No | Yes |\n| Can bill Medicaid (AHCCCS) | No | Yes (with enrollment) |\n| Revenue certainty | Self-pay/resident fees | Insurance-dependent |\n| First-time operator friendly | Yes | Not recommended |\n| Time to first resident | 60 – 120 days | 6 – 18 months |\n\n### Recommendation for Most New Operators\n\n> **Start with SLH.** Build your operations, systems, and reputation. After 12-24 months of successful SLH operation, you will be in a much stronger position to pursue BHRF licensing if that is your long-term goal.\n\nThis course focuses on the **SLH track**. The BHRF track requires legal and clinical expertise that goes beyond the scope of this guide.',
  12,
  false
)
ON CONFLICT (id) DO NOTHING;

-- ── Lesson 2: ADHS Licensing ─────────────────────────────────
INSERT INTO public.lms_lessons (id, course_id, sort_order, title, content_type, content_body, duration_minutes, has_quiz)
VALUES (
  'a0060200-0000-0000-0000-000000000001',
  'c0000006-0000-0000-0000-000000000006',
  2,
  'ADHS SLH Licensing — The Step-by-Step Application',
  'text',
  E'## ADHS SLH Licensing — The Step-by-Step Application\n\nThe Arizona Department of Health Services (ADHS) certifies Sober Living Homes under **A.R.S. § 36-2061**. Certification is mandatory before accepting residents.\n\n### Step 1: Download the Application\n\nObtain the **ADHS Sober Living Home Complete Application** from:\n> azdhs.gov → Licensing → Sober Living Homes\n\nThis packet includes all required forms, checklists, and instructions.\n\n### Step 2: Calculate Your License Fee\n\n**Formula:** $500 (base fee) + $100 × maximum number of residents\n\n| Bed Count | Fee |\n|---|---|\n| 6 beds | $1,100 |\n| 8 beds | $1,300 |\n| 10 beds | $1,500 |\n| 12 beds | $1,700 |\n\nFees are paid by check or money order to ADHS.\n\n### Step 3: Assemble Required Documents\n\nYour application package must include:\n\n- [ ] Completed application forms (all sections)\n- [ ] Proof of property (signed lease or deed)\n- [ ] Floor plan with labeled rooms and dimensions\n- [ ] Certificate of Occupancy from local municipality\n- [ ] Staff roster with background check results for each staff member\n- [ ] Written resident agreement (signed template acceptable at application)\n- [ ] House rules document\n- [ ] Policy and Procedure Manual (see Lesson 6 for minimum content)\n- [ ] Emergency procedures (fire evacuation plan, posted in the home)\n- [ ] Resident rights statement\n- [ ] Drug testing policy\n\n### Step 4: Background Checks\n\nAll house managers and staff must complete a **Level 1 fingerprint clearance card** through the Arizona Department of Public Safety (DPS). This process takes 3-6 weeks.\n\n> Apply at: azfingerprint.com or in person at a DPS fingerprint location.\n\nDo NOT hire staff who have not cleared this check. Operating with unchecked staff is grounds for denial or revocation.\n\n### Step 5: Submit and Wait for Acknowledgment\n\nMail or deliver your complete packet to ADHS. Expect acknowledgment within 15-30 days. Incomplete applications are returned without review.\n\n### Step 6: ADHS Inspection\n\nOnce your application is accepted, ADHS will schedule an on-site inspection. Inspectors check:\n- Life-safety compliance (smoke detectors, CO detectors, fire extinguishers, egress)\n- Physical condition of the home\n- Documentation on file\n- Staff verification\n- Resident rights materials posted\n\n### Step 7: Certification Issued\n\nIf inspection passes: **Provisional certification** issued (valid 6-12 months), followed by full certification upon satisfactory compliance review.\n\n**Total timeline:** 60 to 120 days is typical. Can extend to 6 months if corrections are required.\n\n### Common Reasons for Denial or Delay\n\n1. **Incomplete policy manual** — Most common issue. ADHS wants detailed written policies.\n2. **Background check not completed** — A single staff member without clearance delays everything.\n3. **Property fails life-safety inspection** — Missing smoke detectors, blocked egress, inoperable HVAC.\n4. **Resident agreement is inadequate** — Missing required disclosures or illegal provisions.\n5. **Application forms incomplete** — Every section must be filled out; "N/A" where appropriate.\n\n### Pro Tip\n\nSchedule a **pre-application meeting** with your ADHS regional consultant before submitting. They can review your documents informally and tell you what is missing. This single step can save months.',
  14,
  true
)
ON CONFLICT (id) DO NOTHING;

-- Quiz: Lesson 6-2 (ADHS Licensing)
INSERT INTO public.lms_quiz_questions (lesson_id, sort_order, question, options_json, correct_index, explanation)
VALUES
(
  'a0060200-0000-0000-0000-000000000001', 1,
  'What is the ADHS licensing fee for a 10-bed Sober Living Home?',
  '["$500","$1,000","$1,500","$2,000"]',
  2,
  'The ADHS SLH license fee is $500 base + $100 per maximum resident. For 10 residents: $500 + (10 × $100) = $1,500.'
),
(
  'a0060200-0000-0000-0000-000000000001', 2,
  'What fingerprint clearance level is required for all SLH staff in Arizona?',
  '["Level 1 fingerprint clearance card through AZ DPS","FBI background check only","Level 2 clearance through ADHS","No fingerprint check required for SLH staff"]',
  0,
  'All SLH house managers and staff must obtain a Level 1 fingerprint clearance card from the Arizona Department of Public Safety (DPS). The process typically takes 3-6 weeks.'
),
(
  'a0060200-0000-0000-0000-000000000001', 3,
  'What is the most common reason for ADHS SLH application delays?',
  '["Incorrect fee amount","Incomplete or inadequate policy and procedure manual","Property is too large","Too many beds requested"]',
  1,
  'An incomplete or inadequate policy and procedure manual is the most common reason applications are delayed or returned. ADHS requires detailed written policies covering all aspects of operations.'
),
(
  'a0060200-0000-0000-0000-000000000001', 4,
  'What is the recommended first action before submitting your ADHS application?',
  '["Hire all staff first","Open the home before applying","Schedule a pre-application meeting with your ADHS regional consultant","Wait until the property is fully furnished"]',
  2,
  'A pre-application meeting with your ADHS regional consultant lets them informally review your documents and identify gaps before official submission, potentially saving months of delay.'
)
ON CONFLICT DO NOTHING;

-- ── Lesson 3: Business Formation ─────────────────────────────
INSERT INTO public.lms_lessons (id, course_id, sort_order, title, content_type, content_body, duration_minutes, has_quiz)
VALUES (
  'a0060300-0000-0000-0000-000000000001',
  'c0000006-0000-0000-0000-000000000006',
  3,
  'Business Formation in Arizona',
  'text',
  E'## Business Formation in Arizona\n\n### Why Entity Structure Matters\n\nOperating a sober living home under your personal name exposes your personal assets to liability. A properly formed business entity separates your personal finances from your business obligations and is required by most insurers and lenders.\n\n### Recommended Structure: Limited Liability Company (LLC)\n\nFor most sober living operators, an Arizona LLC is the best starting point:\n\n- **Personal liability protection** — Your home, car, and personal savings are shielded from business debts and lawsuits\n- **Simple management** — No board requirements, flexible operating structure\n- **Pass-through taxation** — Profits and losses reported on your personal return (avoids corporate double taxation)\n- **Credibility** — Banks, insurers, and ADHS expect a formal entity\n\n### Step-by-Step Formation\n\n#### 1. Name Your LLC\n\n- Search for name availability at: **azcc.gov** (Arizona Corporation Commission)\n- The name must include "Limited Liability Company," "LLC," or "L.L.C."\n- Avoid names that imply a medical practice (e.g., "Medical," "Health Center") unless you are licensed for that\n\n#### 2. File Articles of Organization\n\n- File online at **azcc.gov/entities/create**\n- Filing fee: $50 (standard) or $85 (expedited 3-day processing)\n- Required information: LLC name, statutory agent, member/manager names and addresses\n\n#### 3. Appoint a Statutory Agent\n\nYou must have an Arizona-registered statutory agent to receive legal documents. You can be your own agent (if you have an Arizona physical address) or hire a registered agent service ($50-$150/year).\n\n#### 4. Draft an Operating Agreement\n\nAn operating agreement is not filed with the state but is **essential**. It defines:\n- Who owns what percentage of the business\n- How profits and losses are split\n- Who has decision-making authority\n- What happens if an owner leaves or dies\n- How the business can be dissolved\n\nHave an attorney draft this, especially if you have co-owners. Disputes over ownership are the #1 cause of recovery housing business failures that are not regulatory in nature.\n\n#### 5. Get Your EIN (Employer Identification Number)\n\n- Apply free at: **irs.gov/businesses/small-businesses-self-employed/apply-for-an-employer-identification-number-ein-online**\n- Takes 5-10 minutes; your EIN is issued immediately\n- Required for: bank accounts, hiring employees, tax returns\n\n#### 6. Open a Business Checking Account\n\nBring your Articles of Organization and EIN to a bank. **Never commingle personal and business funds.** Commingling is the #1 way courts pierce the liability protection of an LLC.\n\n#### 7. Arizona Transaction Privilege Tax (TPT) License\n\nIf you provide services that are subject to Arizona TPT (most rental-based SLH operations are NOT — but check with your accountant), register at: **azdor.gov**\n\n### Timeline Summary\n\n| Step | Time | Cost |\n|---|---|---|\n| Name search | 1 day | Free |\n| File Articles | 1-3 days | $50-$85 |\n| Operating Agreement | 1-2 weeks | $500-$2,000 (attorney) |\n| EIN | Same day | Free |\n| Bank account | 1-3 days | Varies |\n\n**Total formation time:** 2-3 weeks\n**Total formation cost:** $600-$2,500',
  11,
  false
)
ON CONFLICT (id) DO NOTHING;

-- ── Lesson 4: Property Selection & Zoning ────────────────────
INSERT INTO public.lms_lessons (id, course_id, sort_order, title, content_type, content_body, duration_minutes, has_quiz)
VALUES (
  'a0060400-0000-0000-0000-000000000001',
  'c0000006-0000-0000-0000-000000000006',
  4,
  'Property Selection & Arizona Zoning Compliance',
  'text',
  E'## Property Selection & Arizona Zoning Compliance\n\n### What Makes a Good SLH Property?\n\nYour property is your operating platform. Choose carefully — a wrong choice means zoning fights, failed inspections, or a location that does not serve your residents.\n\n**Physical Requirements:**\n- Residential zoning (R-1, R-2, R-3 depending on municipality)\n- Adequate bedroom count (plan for the number of residents you want to license)\n- Working HVAC, plumbing, and electrical\n- Smoke detectors on every level and in every bedroom\n- Carbon monoxide detectors (required by Arizona law)\n- Fire extinguishers in kitchen and common areas\n- Clear emergency egress from all bedrooms\n- Accessibility: ground-floor bathroom accessible or elevator if serving residents with mobility limitations\n\n**Location Requirements:**\n- Near public transit (bus routes) — most residents do not drive\n- Within reasonable distance of NA/AA meetings, grocery stores, pharmacies, and healthcare\n- In a stable residential neighborhood\n- NOT adjacent to liquor stores, bars, or drug activity areas\n\n### The 6-Resident Rule — Why It Matters\n\nFederal Fair Housing Act and many Arizona municipal codes recognize homes with **6 or fewer residents** as functionally equivalent to single-family residences. This is the most important zoning number in Arizona sober living.\n\n**Homes of 6 or fewer residents typically:**\n- Do not require a special use permit or conditional use permit\n- Are treated as single-family or multi-family use by right\n- Face minimal neighbor/HOA opposition by default\n\n**Homes of 7+ residents** typically require:\n- A Conditional Use Permit (CUP) or Group Home permit\n- Public notice and a hearing process (90-180 days)\n- Neighbor notification (generates opposition)\n\n> **Strong recommendation for first-time operators: License a 6-bed home.** The simplicity of avoiding the CUP process is worth the lower bed count.\n\n### City-by-City Zoning Notes\n\n#### Phoenix (Zoning Ordinance §608)\n- 6 or fewer residents in a single-family zone: permitted by right\n- 7+ residents: Conditional Use Permit required from Phoenix Planning & Development\n- Business license required: $50/year\n- Contact: Phoenix Planning & Development, (602) 262-7811\n\n#### Scottsdale\n- Similar to Phoenix: 7+ unrelated adults require a Group Home permit\n- Residential spacing requirements may apply\n- Contact: Scottsdale Development Services, (480) 312-2500\n\n#### Mesa\n- 6 or fewer: treated as single-family use in most zones\n- Strongly recommended: Contact Mesa Development Services for a free pre-application meeting before signing any lease\n- Contact: Mesa Development Services, (480) 644-2251\n\n#### Prescott / Prescott Valley\n- Generally favorable to recovery housing\n- City of Prescott for incorporated areas; Yavapai County for unincorporated areas\n- Lower opposition than metro Phoenix areas\n\n#### Tucson\n- Supportive regulatory environment\n- Active local recovery housing coalition\n- Contact: Tucson Development Services, (520) 791-5550\n- Check Tucson Unified Development Code for group home definitions\n\n### Before You Sign a Lease\n\n1. **Verify zoning in writing** — Get a letter or email from the city confirming the intended use is permitted\n2. **Review the lease for SLH disclosure** — Inform the landlord of your intended use in writing\n3. **Check HOA rules** — Many HOAs prohibit group homes or require approval; HOA restrictions can be difficult to fight\n4. **Inspect the property personally** with your ADHS inspection checklist in hand\n5. **Get a move-in inspection report** documenting existing conditions\n\n### The Lease vs Own Decision\n\n| Leasing | Owning |\n|---|---|\n| Lower upfront capital | Higher upfront capital |\n| Landlord can terminate | Full control |\n| Flexibility to relocate | Build equity |\n| Landlord must approve SLH use | No approval needed |\n| Lower risk for first operators | Better long-term economics |\n\nMost first-time operators lease. Purchasing makes sense after you have demonstrated your operating model works.',
  12,
  true
)
ON CONFLICT (id) DO NOTHING;

-- Quiz: Lesson 6-4 (Property & Zoning)
INSERT INTO public.lms_quiz_questions (lesson_id, sort_order, question, options_json, correct_index, explanation)
VALUES
(
  'a0060400-0000-0000-0000-000000000001', 1,
  'In Phoenix, a 6-bed sober living home in a single-family zone requires:',
  '["A Conditional Use Permit","A Group Home permit from the city","No special permit — it is permitted by right","A variance from the zoning board"]',
  2,
  'Under Phoenix Zoning Ordinance §608, a sober living home with 6 or fewer residents in a single-family zone is permitted by right. No special permit is needed. Seven or more residents trigger a CUP requirement.'
),
(
  'a0060400-0000-0000-0000-000000000001', 2,
  'Why do most experts recommend starting with a 6-bed home rather than a larger facility?',
  '["6 beds is the maximum ADHS allows","A 6-bed home avoids special use permit requirements in most Arizona cities","6-bed homes are easier to insure","NARR only certifies homes with 6 or fewer beds"]',
  1,
  'The 6-resident threshold is the critical zoning number. Homes with 6 or fewer residents avoid Conditional Use Permit processes, which involve public hearings, neighbor notification, and 90-180 days of process time.'
),
(
  'a0060400-0000-0000-0000-000000000001', 3,
  'Before signing a lease for a potential SLH property, you should:',
  '["Sign the lease and then apply for permits","Verify zoning in writing from the city before signing","Assume residential zoning means SLH is allowed","Ask neighbors if they mind"]',
  1,
  'Always verify the zoning is compatible with your intended use in writing before committing to a lease. This prevents costly mistakes if the city determines the use is not permitted.'
)
ON CONFLICT DO NOTHING;

-- ── Lesson 5: Insurance Requirements ─────────────────────────
INSERT INTO public.lms_lessons (id, course_id, sort_order, title, content_type, content_body, duration_minutes, has_quiz)
VALUES (
  'a0060500-0000-0000-0000-000000000001',
  'c0000006-0000-0000-0000-000000000006',
  5,
  'Insurance Requirements for Arizona Sober Living Homes',
  'text',
  E'## Insurance Requirements for Arizona Sober Living Homes\n\nInsurance is not optional — it is the financial safety net that protects your residents, your staff, and everything you have built. A single liability lawsuit without adequate coverage can wipe out your business.\n\n### Required and Strongly Recommended Policies\n\n#### 1. Commercial General Liability (CGL) — Required\n\n**Minimum:** $1,000,000 per occurrence / $2,000,000 aggregate\n\nCovers: Bodily injury and property damage claims arising from your operations. If a resident is injured on your property and sues you, this pays for legal defense and judgment.\n\n**Why recovery housing needs higher limits:** Residents are a vulnerable population. Slip-and-fall incidents, overdoses, altercations, and medical emergencies are more common than in standard residential rentals. Some funders and ADHS itself may require proof of CGL.\n\n#### 2. Professional Liability / E&O — Strongly Recommended\n\n**Minimum:** $1,000,000 per occurrence\n\nCovers: Claims that your organization''s services, decisions, or failures to act caused harm. Example: A resident claims you failed to respond appropriately to a mental health crisis.\n\nThis is separate from CGL. CGL covers physical accidents; E&O covers professional service failures.\n\n#### 3. Commercial Property Insurance\n\nCovers: Building contents you own (furniture, appliances, equipment). If you lease the building, your landlord''s policy covers the structure — you need coverage for what is inside.\n\nFor a typical 6-bed home: $100,000-$200,000 in contents coverage is usually adequate.\n\n#### 4. Workers'' Compensation — Required if You Have Employees\n\nArizona law requires workers'' comp coverage for any business with employees (W-2 workers). House managers, staff, and anyone on payroll must be covered.\n\n**Important:** Independent contractor (1099) arrangements do not typically require workers'' comp, but misclassifying employees as contractors is a serious legal risk. Consult an employment attorney.\n\n#### 5. Commercial Auto — If You Use Vehicles for Program Purposes\n\nPersonal auto policies do not cover accidents that occur during business activities. If any staff member uses their vehicle to transport residents, make supply runs, or conduct any program-related driving, you need commercial auto coverage or a non-owned/hired auto endorsement on your CGL policy.\n\n#### 6. Directors & Officers (D&O) — If Nonprofit\n\nCovers board members and officers from personal liability for organizational decisions. If you are operating as a 501(c)(3), your board members should be protected.\n\n### Finding the Right Insurance\n\n**The Problem:** Most standard commercial insurers do not write recovery housing because they are unfamiliar with the risk profile. Do not waste time calling your personal auto or homeowner''s insurer.\n\n**Specialty carriers that work with recovery housing:**\n- **Philadelphia Insurance Companies (PHLY)** — Market leader in behavioral health specialty coverage\n- **Markel Insurance** — Behavioral health and human services specialty\n- **Burns & Wilcox** — National wholesale broker with recovery housing experience\n- **Covenant Insurance** — Small SLH operator focus\n\n**Work with a broker, not directly with a carrier.** A specialty broker who places recovery housing accounts regularly will know which carriers are offering competitive rates and can advocate on your behalf.\n\n### Cost Ranges (Arizona, 2025-2026)\n\n| Policy | Typical Annual Cost |\n|---|---|\n| CGL ($1M/$2M), 6-bed SLH | $2,500 – $5,000 |\n| Professional Liability ($1M) | $1,500 – $3,500 |\n| Commercial Property (contents) | $500 – $1,200 |\n| Workers'' Comp (1-3 employees) | $2,000 – $5,000 |\n| Commercial Auto | $1,500 – $3,000 |\n\n**Total estimated annual insurance budget for a 6-bed SLH with 1 FTE:** $7,000 – $15,000\n\n### Insurance Red Flags\n\n- A quote that seems unusually cheap (under $2,000/year for CGL) — the policy may have exclusions that render it useless for recovery housing\n- Policies that exclude "sexual abuse and molestation" — this exclusion creates significant exposure in a residential care setting; get a policy with this coverage or a separate SAM policy\n- "Occurrence" vs "Claims-made" — Occurrence policies cover incidents that happen during the policy period regardless of when the claim is filed; claims-made policies only cover claims filed while the policy is active. Occurrence is generally preferable.',
  11,
  false
)
ON CONFLICT (id) DO NOTHING;

-- ── Lesson 6: Policies & Resident Agreements ─────────────────
INSERT INTO public.lms_lessons (id, course_id, sort_order, title, content_type, content_body, duration_minutes, has_quiz)
VALUES (
  'a0060600-0000-0000-0000-000000000001',
  'c0000006-0000-0000-0000-000000000006',
  6,
  'Policies, Procedures & Resident Agreements',
  'text',
  E'## Policies, Procedures & Resident Agreements\n\nYour written policies are the backbone of your operation. They protect residents'' rights, establish expectations, define consequences, and demonstrate to ADHS (and courts) that you run a structured, professional program.\n\n### The Policy and Procedure Manual\n\nADHS requires a written Policy and Procedure Manual (P&P Manual) as part of your licensing application. The manual must address at minimum:\n\n1. **Mission and values statement**\n2. **Admission criteria** — Who you accept, who you do not (based on program fit, not protected characteristics)\n3. **Intake process** — How residents are screened and admitted\n4. **Resident rights** — Must be provided to every resident at intake\n5. **House rules** — Specific, detailed rules with clear consequences\n6. **Drug and alcohol testing policy** — Frequency, methods, chain of custody\n7. **Medication policy** — Including MAT (you CANNOT ban prescribed medications)\n8. **Curfew and guest policy**\n9. **Grievance procedure** — How residents raise complaints\n10. **Discipline and discharge process** — Notice requirements, appeals\n11. **Emergency procedures** — Overdose, fire, medical emergencies\n12. **Confidentiality policy**\n13. **Financial policies** — Fees, deposits, refunds\n14. **Staff policies** — Background checks, training requirements, supervision\n\n### The Resident Agreement\n\nThe resident agreement is the legal contract between you and your resident. It must be signed at intake. Include:\n\n**Financial Terms:**\n- Monthly program fee (exact amount)\n- Payment due date and grace period\n- Late payment consequences\n- Security deposit amount and refund policy\n- Additional fees (if any) — clearly itemized\n- No hidden fees are permitted under NARR standards\n\n**Occupancy Terms:**\n- Address of the property\n- Start date\n- Nature of occupancy (program participant, not standard residential tenant)\n- Termination process\n\n**Program Requirements:**\n- Sobriety requirement\n- House meeting attendance\n- Chores and house maintenance responsibilities\n- Drug testing consent\n- Curfew acknowledgment\n- Guest policy acknowledgment\n\n**Rights and Disclosures:**\n- Resident rights statement (required by ADHS)\n- Grievance procedure\n- Privacy policy\n- Authorization to verify sobriety with treatment providers (optional but recommended)\n\n### Critical Legal Issue: Tenancy vs Program Participation\n\nUnder Arizona''s Residential Landlord and Tenant Act (A.R.S. § 33-1301 et seq.), a person who has resided in a property for **30 or more days** may have established tenant rights — including the right to formal eviction process.\n\n**Your resident agreement must:**\n- Clearly identify the relationship as a program participant arrangement\n- Specify that residency is contingent on program participation\n- Include a clear discharge procedure that complies with Arizona law\n- Consult with a local real estate/landlord-tenant attorney to ensure your agreement is enforceable in Arizona\n\n### Drug Testing Policy\n\nYour drug testing policy must specify:\n- Testing frequency (e.g., twice weekly, random)\n- Who selects who gets tested and how\n- What happens with a positive result (first offense, second offense)\n- Whether you use point-of-care tests, lab confirmation, or both\n- Chain of custody procedures for any legally consequential tests\n- Consent to testing as a condition of residency\n\n### MAT (Medication-Assisted Treatment) Policy\n\n**You cannot maintain a blanket ban on MAT medications** (Suboxone/buprenorphine, Methadone, Vivitrol/naltrexone). This violates the Fair Housing Act.\n\nYou MAY have reasonable operational rules:\n- Medications must be stored in a locked box\n- Residents must show proof of prescription on request\n- Staff may administer medications if a resident requests it\n\nBut a policy of "no Suboxone allowed" is illegal. If your current policy says this, consult legal counsel immediately.',
  13,
  true
)
ON CONFLICT (id) DO NOTHING;

-- Quiz: Lesson 6-6 (Policies)
INSERT INTO public.lms_quiz_questions (lesson_id, sort_order, question, options_json, correct_index, explanation)
VALUES
(
  'a0060600-0000-0000-0000-000000000001', 1,
  'Under Arizona law, a resident who has lived in your home for 30+ days may have:',
  '["No legal rights — your house rules control","Established tenant rights under the Residential Landlord and Tenant Act","Rights only if they have a written lease","Rights only if they paid a security deposit"]',
  1,
  'Under A.R.S. § 33-1301 et seq., residents who have lived in a property for 30+ days may establish tenant rights. Your resident agreement must clearly structure the relationship to avoid triggering full landlord-tenant law protections unexpectedly.'
),
(
  'a0060600-0000-0000-0000-000000000001', 2,
  'A blanket house policy banning all MAT medications (Suboxone, Methadone, Vivitrol) is:',
  '["Permitted — operators can set any rules they want","Required for NARR certification","Illegal under the Fair Housing Act","Only illegal if the resident has a written prescription"]',
  2,
  'A blanket ban on prescribed MAT medications violates the Fair Housing Act because it discriminates against people with substance use disorder who are using legally prescribed treatment medications. You may have reasonable storage rules but cannot ban MAT outright.'
),
(
  'a0060600-0000-0000-0000-000000000001', 3,
  'Your resident agreement must include which financial elements?',
  '["Only the monthly fee","Exact fees, payment terms, deposit amount, refund policy, and any additional charges — all clearly itemized","Only fees that you decide to charge at the time","Just a general statement that fees may apply"]',
  1,
  'NARR standards and basic legal protection require that all fees be clearly disclosed before move-in. Hidden fees or undisclosed charges violate NARR ethical standards and may constitute consumer fraud.'
)
ON CONFLICT DO NOTHING;

-- ── Lesson 7: Building a Referral Network ────────────────────
INSERT INTO public.lms_lessons (id, course_id, sort_order, title, content_type, content_body, duration_minutes, has_quiz)
VALUES (
  'a0060700-0000-0000-0000-000000000001',
  'c0000006-0000-0000-0000-000000000006',
  7,
  'Building Your Referral Network in Arizona',
  'text',
  E'## Building Your Referral Network in Arizona\n\nOccupancy is everything. An empty bed costs you as much as a full one (you still pay rent). Building a strong referral network before you open — and continuously throughout your operation — is the difference between a thriving program and one that struggles.\n\n### Who Refers Residents to Sober Living?\n\n#### 1. Courts and Probation\n- **Maricopa County Adult Probation** — Probation officers actively seek housing for clients completing incarceration or treatment\n- **Drug Court and DUI Court programs** — Judges mandate sober living as a condition of program participation\n- **State prison prerelease planning** — Arizona Department of Corrections (ADC) discharge planners help identify housing for people releasing\n- **Federal probation/pretrial services** — Refer people on federal supervision\n\n**How to connect:** Contact the probation department''s community resource coordinator. Offer a facility tour. Provide a one-page fact sheet with your program description, requirements, bed availability contact, and fees.\n\n#### 2. Treatment Centers\n- **Residential treatment facilities** — Discharge planners are actively looking for step-down housing for clients completing 30-90 day programs\n- **Partial hospitalization (PHP) and Intensive Outpatient (IOP) programs** — Patients need stable housing during treatment\n- **Detox facilities** — Short-stay (5-7 day) programs need to connect patients to the next level of care\n\n**Key facilities in Arizona to know:**\n- Connections Health Solutions (Phoenix, Tucson, Flagstaff)\n- Banner Behavioral Health\n- Sonora Behavioral Health\n- Valley Hospital\n- Crossroads Inc.\n- La Frontera Arizona (Tucson)\n\n**How to connect:** Ask to speak with the discharge planner or case manager. Bring business cards and a facility sheet. Offer a tour.\n\n#### 3. Hospitals\n- Emergency department social workers refer people in crisis who need stable housing\n- Behavioral health units discharge to step-down care\n\n**How to connect:** Call the hospital''s case management department. Ask to be added to their community resource list.\n\n#### 4. VA Phoenix Healthcare System\n- Phoenix VA has dedicated housing and homeless prevention programs for Veterans\n- HUD-VASH program places Veterans in stable housing with case management\n- **Contact:** VA Phoenix Patient Care (602) 277-5551, ask for Social Work\n\n#### 5. Arizona 211\n- Arizona''s statewide information and referral service\n- Call 211 or visit az211.gov to list your resource\n- Social workers and case managers statewide use 211 to find housing\n\n#### 6. AHCCCS Managed Care Organizations (if BHRF)\n- If you become a BHRF with AHCCCS enrollment, MCOs will refer members directly\n- Arizona Complete Health, UnitedHealthcare Community Plan, Blue Cross Blue Shield of AZ Medicaid\n\n### Online and Directory Listings\n\n**Required for visibility:**\n\n1. **BHSL.com (Arizona SLH Directory)** — Arizona''s primary online directory for sober living. Get listed immediately after certification.\n2. **SAMHSA Behavioral Health Treatment Locator** — findtreatment.gov — National database used by thousands of referral sources\n3. **Google Business Profile** — Create a free listing at google.com/business. This is critical for "sober living near me" searches.\n4. **ARHA (Arizona Recovery Housing Association) Member Directory** — Listing requires membership but adds significant credibility\n5. **Arizona 211 Resource Database** — List your facility at az211.gov\n\n### Community Relationship Building\n\n- **Attend NA/AA central service meetings** — These communities are deeply connected to sober living referrals\n- **Connect with Oxford House (District 37 Arizona)** — While a competitor in some markets, the Oxford House network often refers people they cannot accommodate\n- **Join ARHA** — Membership connects you to the statewide recovery housing network and provides educational resources\n- **Attend NAMI Arizona events** — Families seeking housing for loved ones in recovery are active in NAMI\n\n### Marketing Materials\n\nEvery referral source should receive:\n- **One-page fact sheet:** Program name, address, bed count, gender/population served, sobriety requirements at intake, fees, contact information\n- **Business cards** for the house manager and operator\n- **Facility photos** (if you have a clean, professional-looking home)\n\nKeep your Google Business Profile and BHSL listing updated with:\n- Current bed availability\n- Any changes to requirements or fees\n- Positive reviews from former residents (ask for these!)',
  11,
  false
)
ON CONFLICT (id) DO NOTHING;

-- ── Lesson 8: Financial Projections & Cash Flow ───────────────
INSERT INTO public.lms_lessons (id, course_id, sort_order, title, content_type, content_body, duration_minutes, has_quiz)
VALUES (
  'a0060800-0000-0000-0000-000000000001',
  'c0000006-0000-0000-0000-000000000006',
  8,
  'Financial Projections & Cash Flow Management',
  'text',
  E'## Financial Projections & Cash Flow Management\n\nSober living homes can be financially viable businesses — but many fail in the first 12 months because of poor financial planning. This lesson gives you the numbers and frameworks to plan with clarity.\n\n### Revenue Model\n\nSober Living Homes generate revenue from **monthly program fees** paid by residents.\n\n**Market rates in Arizona (2025-2026):**\n\n| Market | Typical Monthly Fee |\n|---|---|\n| Phoenix metro (standard) | $700 – $900 |\n| Phoenix metro (upscale) | $900 – $1,400 |\n| Scottsdale | $900 – $1,500 |\n| Tucson | $600 – $800 |\n| Prescott | $700 – $950 |\n\n**Revenue projection example (10-bed Phoenix SLH at $850/month average):**\n\n| Occupancy | Monthly Revenue | Annual Revenue |\n|---|---|---|\n| 100% (10 beds) | $8,500 | $102,000 |\n| 85% (8.5 beds) | $7,225 | $86,700 |\n| 70% (7 beds) | $5,950 | $71,400 |\n\nTarget break-even occupancy for most SLH operations: **75-85%**\n\n### Startup Cost Ranges\n\n| Item | SLH Low | SLH High |\n|---|---|---|\n| Legal (LLC, operating agreement, contracts) | $3,000 | $15,000 |\n| ADHS license fee (10-bed example) | $1,500 | $1,500 |\n| Property security deposit + 1st month | $3,000 | $8,000 |\n| Furniture and household setup (all rooms) | $5,000 | $15,000 |\n| Policy manual and resident agreement (attorney) | $2,000 | $5,000 |\n| Insurance (first year) | $7,000 | $15,000 |\n| Background checks (staff, 3 people) | $300 | $600 |\n| Technology (property management software, phone) | $500 | $2,000 |\n| Marketing and directory listings | $500 | $2,000 |\n| Working capital (3 months operating reserve) | $18,000 | $36,000 |\n| **Total** | **$40,800** | **$100,100** |\n\n**Practical target:** Budget $50,000-$75,000 for a 10-bed SLH in the Phoenix metro area.\n\n### Monthly Operating Cost Ranges\n\n| Expense | Monthly Low | Monthly High |\n|---|---|---|\n| Rent / mortgage | $2,500 | $5,000 |\n| Utilities (electric, gas, water, internet) | $400 | $900 |\n| Insurance (monthly portion) | $600 | $1,300 |\n| House manager salary (part-time) | $1,500 | $2,500 |\n| House manager salary (full-time) | $2,500 | $4,500 |\n| Supplies and maintenance | $300 | $600 |\n| Drug testing supplies | $100 | $400 |\n| Food and household items (if provided) | $0 | $1,000 |\n| Software and subscriptions | $100 | $300 |\n| **Total (part-time manager)** | **$6,000** | **$11,500** |\n\n### Break-Even Analysis Example\n\n**Scenario:** 10-bed Phoenix home, $850/month fees, $9,000/month operating costs\n\n- Break-even beds needed: $9,000 ÷ $850 = **10.6 beds**\n- At 10 beds (100% occupancy): slight loss at $850 rate\n- Solution: Increase fees to $900-$950 to create margin\n- OR reduce operating costs by $500/month\n\n**Lesson:** At $850/month with $9,000 operating costs, you need near-full occupancy to break even. This is why pricing, cost control, and occupancy management are critical.\n\n### Cash Flow Management\n\n**The most common failure mode:** Running out of cash during the first 3-6 months when occupancy builds slowly.\n\n**Cash flow protection strategies:**\n\n1. **Collect first + last month fee at intake** — This gives you a buffer if a resident leaves suddenly\n2. **Open with 3 months cash reserve** — Do not open until you have this (include it in your startup budget)\n3. **Track cash weekly** — Know your balance and your upcoming expenses every week\n4. **Have a waiting list before you open** — Build relationships with referral sources for 30-60 days before accepting your first resident\n5. **Stagger resident move-in dates** — Avoid opening with zero residents on day one; try to have 3-4 committed residents before you unlock the doors\n6. **Late fees** — Enforce payment deadlines consistently; unpaid rent is the silent killer of recovery housing cash flow\n\n### Key Financial Metrics to Track\n\n| Metric | Target |\n|---|---|\n| Average occupancy rate | 85%+ |\n| Average length of stay | 6+ months |\n| Days to first bed filled (new home) | < 30 days |\n| Monthly revenue per available bed | > $750 |\n| Operating expense ratio | < 80% of revenue |\n\n### Financial Tools\n\nSoberOps includes:\n- **Expense Tracking** module for categorized operating expenses\n- **Projections** module with P&L and break-even analysis\n- **QuickBooks integration** for professional accounting\n\nTrack every expense from day one. This data is required for tax filing, ADHS compliance, investor reporting, and securing future financing.',
  16,
  true
)
ON CONFLICT (id) DO NOTHING;

-- Quiz: Lesson 6-8 (Financial Projections)
INSERT INTO public.lms_quiz_questions (lesson_id, sort_order, question, options_json, correct_index, explanation)
VALUES
(
  'a0060800-0000-0000-0000-000000000001', 1,
  'How many months of operating cash reserve should you have BEFORE opening your SLH?',
  '["1 month","2 months","3 months","6 months"]',
  2,
  'Three months of operating reserve is the recommended minimum before opening. Occupancy builds slowly in the first 3-6 months, and without this buffer, a new SLH operator can run out of cash before reaching break-even.'
),
(
  'a0060800-0000-0000-0000-000000000001', 2,
  'For a 10-bed SLH charging $850/month with $9,000 monthly operating costs, what is the approximate break-even occupancy?',
  '["70% (7 beds)","80% (8 beds)","90-100% (9-10 beds)","50% (5 beds)"]',
  2,
  '$9,000 ÷ $850 = 10.6 beds needed to break even, which means near-100% occupancy. This example illustrates why pricing and cost management are critical — small changes in fee rates or expenses have significant impact on viability.'
),
(
  'a0060800-0000-0000-0000-000000000001', 3,
  'Which strategy BEST protects your cash flow when a resident leaves unexpectedly?',
  '["Charge a refundable deposit only","Collect first AND last month program fee at intake","Require 6 months of fees upfront","Rely on the next resident to cover the shortfall"]',
  1,
  'Collecting first and last month program fee at intake provides a financial buffer when a resident leaves suddenly. This is standard practice in recovery housing and gives you time to fill the bed without an immediate cash shortfall.'
),
(
  'a0060800-0000-0000-0000-000000000001', 4,
  'What is the target average occupancy rate for a financially healthy SLH?',
  '["50%","65%","85% or higher","100% — every bed must be filled"]',
  2,
  'An 85%+ occupancy rate is the target for financial sustainability in most SLH models. Below 75%, most homes with typical operating costs will struggle to break even. Building a waiting list helps maintain this level.'
)
ON CONFLICT DO NOTHING;
