# How to Start a Sober Living Home in Arizona — Complete Guide & System Plan

> This document serves as both a **human-readable guide** and a **feature specification** for building a guided startup system, checklist engine, and LMS into House Harmony Desk. A future Claude session will implement these features in code.

---

## Table of Contents

1. [Arizona Legal & Regulatory Overview](#1-arizona-legal--regulatory-overview)
2. [Step-by-Step Startup Checklist](#2-step-by-step-startup-checklist)
3. [Business Formation](#3-business-formation)
4. [Property Selection & Requirements](#4-property-selection--requirements)
5. [Licensing & Certification](#5-licensing--certification)
6. [Staffing & Training](#6-staffing--training)
7. [Operational Policies & Procedures](#7-operational-policies--procedures)
8. [Drug Testing Protocols](#8-drug-testing-protocols)
9. [Financial Planning & Startup Costs](#9-financial-planning--startup-costs)
10. [Insurance Requirements](#10-insurance-requirements)
11. [Marketing & Referral Network](#11-marketing--referral-network)
12. [Common Mistakes to Avoid](#12-common-mistakes-to-avoid)
13. [LMS (Learning Management System) Specification](#13-lms-specification)
14. [Guided Startup Wizard — Feature Specification](#14-guided-startup-wizard--feature-specification)
15. [Checklist Engine — Feature Specification](#15-checklist-engine--feature-specification)
16. [Database Schema](#16-database-schema)

---

## 1. Arizona Legal & Regulatory Overview

### Licensing is MANDATORY

Arizona requires all sober living homes to be licensed by the **Arizona Department of Health Services (ADHS)**. This has been the law since **July 1, 2019**, when rules codified in **Arizona Administrative Code Title 9, Chapter 12 (9 A.A.C. 12)** took effect.

**Governing Statute:** A.R.S. 36-2061 defines a "sober living home" as any premises that:
- Provides alcohol-free or drug-free housing
- Promotes independent living and life skills development
- May provide activities directed toward recovery from substance use disorders
- Provides a supervised setting to a group of unrelated individuals recovering from SUDs
- Does **NOT** provide any medical or clinical services or medication administration on-site (except drug/alcohol testing)

**Contact:** ADHS, 150 N. 18th Ave., Ste. 410, Phoenix, AZ 85007 | 602-542-3422 | SoberLiving@azdhs.gov

### Key Arizona Legislation

| Bill | Year | Status | What It Did |
|------|------|--------|-------------|
| **HB 2107** | 2016 | Signed | Gave cities/counties permissive authority to regulate sober living via ordinance |
| **SB 1465** | 2018 | Signed | Mandated ADHS licensure for all sober living homes |
| **SB 1361** | 2024 | Signed | Mandatory on-site inspections, eliminated self-attestation, increased penalties to $1,000/day/violation, operating without license = Class 1 misdemeanor |
| **SB 1605** | 2024 | Died | Would have required 24-hour supervision and 2:6 staff ratios (signals future legislative direction) |

### SB 1361 (2024) — What You Need to Know

This law was a direct response to the massive AHCCCS/Medicaid fraud scandal involving sober living homes. Key changes:
- ADHS must conduct **mandatory physical on-site inspections** before approving any license, renewal, capacity change, or construction modification — plus **at least annually**
- **Self-attestation of compliance is prohibited** — operators can no longer just sign a form saying they meet codes
- ADHS must obtain **documentation from local jurisdictions** verifying compliance with zoning, building, fire, and licensing ordinances
- Civil penalty cap increased from $500 to **$1,000 per day per violation**
- Operating without a license 10 days after notice = **Class 1 misdemeanor**
- State agencies may only refer to **certified or licensed** homes
- Only certified/licensed homes are eligible for **federal or state funding**

### Fair Housing Act Protections

The 1988 FHA Amendments expanded protections to individuals with disabilities, **including those in recovery from substance use disorders**:
- Cities **cannot** zone sober homes out of residential areas
- Cities **must** make reasonable accommodations for recovery housing
- A sober living home's address is **not a public record** (A.R.S. 9-500.40)
- **Exception:** FHA does NOT protect individuals currently engaging in illegal drug use

**Filing complaints:** Arizona Attorney General's Civil Rights Division — must file within 12 months of alleged discrimination. azag.gov/civil-rights/fair-housing

### City-Level Regulations

| City | Key Requirements |
|------|-----------------|
| **Phoenix** | Structured Sober Living Homes License through City Clerk's office; 11+ residents = "community residence center" requiring city licensing |
| **Scottsdale** | Spacing requirements for all care homes (enacted late 2024) |
| **Prescott** | Uses "community residences" terminology; has specific spacing and occupancy requirements |
| **Mesa** | Must register with City Planning Division (Chapter 87, Section 11-31-14 of Mesa Zoning Ordinance) |
| **Tucson** | Contact City of Tucson Planning Department for local provisions |

**Always verify with your specific municipality before securing a property.**

### AHCCCS (Arizona Medicaid) — Important Distinction

**Room and board at sober living homes is NOT reimbursable through AHCCCS/Medicaid.**

Since sober living homes cannot provide clinical services on-site, they cannot bill insurance or AHCCCS directly. However, clinical services provided to residents **by outside providers** can be billed to AHCCCS (outpatient therapy, peer support services, etc.).

**Fraud Warning:** Arizona experienced a massive Medicaid fraud scandal involving sober living homes exploiting the American Indian Health Program. This is the primary driver behind the tightened regulations. Operating ethically is not optional — it's existential.

---

## 2. Step-by-Step Startup Checklist

This is the master checklist. Each item maps to a detailed section below and will be implemented as an interactive checklist system in the app.

### Phase 1: Planning & Research (Weeks 1-4)
- [ ] **1.1** Write a business plan (mission, target population, financial projections, market analysis)
- [ ] **1.2** Define your model: NARR Level (Level II recommended for first-time operators), target demographic, gender, specialty
- [ ] **1.3** Research your local market: existing homes, demand, pricing, referral landscape
- [ ] **1.4** Define startup budget and secure funding
- [ ] **1.5** Decide entity type: LLC (for-profit) or 501(c)(3) (nonprofit)
- [ ] **1.6** Consult an attorney experienced in landlord-tenant law and recovery housing

### Phase 2: Business Formation (Weeks 3-6)
- [ ] **2.1** File Articles of Organization (LLC) or Articles of Incorporation (nonprofit) with Arizona Corporation Commission (azcc.gov)
- [ ] **2.2** Obtain an EIN from the IRS (irs.gov — free, immediate)
- [ ] **2.3** If nonprofit: file IRS Form 1023 within 27 months for retroactive tax-exempt status
- [ ] **2.4** Open a business bank account (separate from personal finances)
- [ ] **2.5** Register with Arizona New Hire Reporting Center (if hiring employees)
- [ ] **2.6** Obtain unemployment insurance (if hiring)
- [ ] **2.7** Register for Transaction Privilege Tax (TPT) license if applicable
- [ ] **2.8** Obtain city/local business license per your municipality's requirements

### Phase 3: Property (Weeks 4-10)
- [ ] **3.1** Define property criteria: capacity, location, zoning, ADA accessibility
- [ ] **3.2** Verify zoning compliance with local planning department
- [ ] **3.3** Check for HOA restrictions (if purchasing)
- [ ] **3.4** Secure property (lease or purchase)
- [ ] **3.5** If leasing: obtain Owner Attestation Form from landlord, ensure lease states sober living use
- [ ] **3.6** Pass fire safety inspection (smoke detectors, CO detectors, fire extinguishers, egress)
- [ ] **3.7** Ensure ADA compliance (per A.R.S. 36-2062)
- [ ] **3.8** Furnish the home (beds, dressers, living room, kitchen, bathrooms)
- [ ] **3.9** Install safety equipment: Narcan kit, first aid supplies, fire extinguishers
- [ ] **3.10** Set up household supplies: cleaning, kitchen, bathroom, linens

### Phase 4: Insurance (Weeks 6-10)
- [ ] **4.1** Obtain General Liability insurance ($1M per occurrence / $3M aggregate)
- [ ] **4.2** Obtain Professional Liability (Errors & Omissions) insurance
- [ ] **4.3** Obtain Workers' Compensation insurance (required by AZ law if you have employees)
- [ ] **4.4** Obtain Commercial Property insurance
- [ ] **4.5** Consider: Abuse & Molestation coverage, Auto/Transportation, Umbrella, Cyber/HIPAA, D&O (if nonprofit)
- [ ] **4.6** Get insurance binder (proof of active coverage) — needed for certification

### Phase 5: Policies & Procedures (Weeks 6-10)
- [ ] **5.1** Write Resident Agreement / Program Agreement
- [ ] **5.2** Write House Rules document
- [ ] **5.3** Write Drug & Alcohol Testing Policy
- [ ] **5.4** Write Grievance Procedures
- [ ] **5.5** Write Discharge/Eviction Procedures
- [ ] **5.6** Write Medication Policy
- [ ] **5.7** Write Emergency Procedures (overdose response, Narcan protocol)
- [ ] **5.8** Write Confidentiality Policy (42 CFR Part 2 compliance)
- [ ] **5.9** Write Anti-Discrimination / Fair Housing Policy
- [ ] **5.10** Write Code of Ethics (read/signed by all staff)
- [ ] **5.11** Write Abuse Reporting Policy (per A.R.S. 46-454)
- [ ] **5.12** Write Record Retention Policy
- [ ] **5.13** Create intake forms and screening questionnaire
- [ ] **5.14** Create incident report template

### Phase 6: Staffing (Weeks 8-12)
- [ ] **6.1** Hire/designate a House Manager meeting ADHS requirements:
  - Must live on-site
  - At least 21 years old
  - Sober for at least 1 year
  - Current CPR certification
  - Current Narcan (naloxone) training certification
- [ ] **6.2** Conduct background check on house manager
- [ ] **6.3** Complete staff training (see LMS section below)
- [ ] **6.4** Have all staff sign Code of Ethics
- [ ] **6.5** Set up staff in House Harmony Desk system

### Phase 7: AzRHA Certification (Weeks 10-16)
- [ ] **7.1** Submit AzRHA membership application + $400 annual fee (membership@myazrha.org)
- [ ] **7.2** Attend 2 monthly AzRHA meetings (3rd Wednesday, 9 AM — St. Matthew's Episcopal Church, 901 W Erie St, Chandler 85225, or via MS Teams)
- [ ] **7.3** After membership approved: email inspector@myazrha.org for current inspection checklist
- [ ] **7.4** Submit all documentation: policies & procedures, proof of insurance
- [ ] **7.5** Pass documentation review against NARR and AzRHA Quality Standards
- [ ] **7.6** Schedule and pass on-site inspection ($100/house fee)
- [ ] **7.7** Pay annual bed dues ($10/bed for Level I/II)
- [ ] **7.8** Receive AzRHA certification (process takes up to 60 days)

### Phase 8: ADHS Licensing (Weeks 14-20)
- [ ] **8.1** Complete ADHS Sober Living Home application
- [ ] **8.2** Include AzRHA certification (if obtained — streamlines ADHS process)
- [ ] **8.3** Submit Owner Attestation Form
- [ ] **8.4** Pay licensing fee: $500 + $100 × maximum number of residents
- [ ] **8.5** Provide documentation of compliance with local zoning, building, and fire codes (ADHS obtains from local jurisdictions per SB 1361)
- [ ] **8.6** Pass ADHS on-site inspection (mandatory per SB 1361)
- [ ] **8.7** Receive ADHS license (valid 12 months, annual renewal required)

### Phase 9: Referral Network & Marketing (Weeks 12-20)
- [ ] **9.1** Build referral relationships with residential treatment programs (discharge planners)
- [ ] **9.2** Build referral relationships with IOPs
- [ ] **9.3** Connect with drug courts and mental health courts
- [ ] **9.4** Connect with probation and parole departments
- [ ] **9.5** Connect with detox centers
- [ ] **9.6** Contact county behavioral health department
- [ ] **9.7** Connect with hospitals (ED discharge coordinators, social workers)
- [ ] **9.8** Connect with VA (if serving veterans)
- [ ] **9.9** Connect with churches and faith-based organizations
- [ ] **9.10** List on recovery housing directories (SAMHSA locator, state directories)
- [ ] **9.11** Create a professional website
- [ ] **9.12** Prepare marketing materials (brochures, one-pagers)

### Phase 10: Launch (Week 20+)
- [ ] **10.1** Final walkthrough: all checklists complete, all systems operational
- [ ] **10.2** Stock drug testing supplies
- [ ] **10.3** Set up House Harmony Desk for daily operations
- [ ] **10.4** Accept first residents
- [ ] **10.5** Conduct intake process per established procedures
- [ ] **10.6** Begin daily operations cycle

---

## 3. Business Formation

### LLC (For-Profit) — Most Common

**Steps:**
1. Choose a business name and check availability at azcc.gov
2. File **Articles of Organization** with Arizona Corporation Commission
3. Designate a **Statutory Agent** with an Arizona address
4. Obtain an **EIN** from the IRS (free, immediate at irs.gov)
5. Open a **business bank account** (100% separate from personal)
6. Register for any required state/local taxes

**Options:** Single-member LLC, multi-member LLC. Can later elect S-corp taxation if advantageous.

### Nonprofit 501(c)(3) — For Grant Seekers

**Steps:**
1. File **Articles of Incorporation** + Certificate of Disclosure with AZ Corporation Commission ($40 filing fee, $75 expedited)
2. Establish a board of directors (minimum 3 in Arizona)
3. Draft bylaws
4. File **IRS Form 1023** within 27 months of incorporation for retroactive tax-exempt status
5. Obtain EIN
6. File annual **990** returns with IRS

**Benefits:** Eligible for HUD Recovery Housing Program grants, SAMHSA grants, opioid settlement funds, donations are tax-deductible for donors.

**You don't need to be a nonprofit to receive most government funding** — but certain HUD programs specifically require it.

---

## 4. Property Selection & Requirements

### What Makes a Property Suitable

| Criteria | Details |
|----------|---------|
| **Zoning** | Must be zoned residential and verified with local planning department |
| **Capacity** | 6-12 residents typical for standard residential property |
| **Bedrooms** | ~60 sq ft per single resident, ~50 sq ft per person in shared rooms |
| **Bathrooms** | 1 bathroom per 4-5 residents; NARR standard: 1 sink + 1 toilet + 1 shower per 6 residents |
| **Common areas** | Needed for house meetings and peer support activities |
| **Manager quarters** | On-site housing for live-in house manager |
| **Safety** | Smoke detectors, CO detectors, fire extinguishers, two exits (egress), Narcan on-site |
| **Location** | Near public transit, employment, recovery support (meetings, outpatient), away from bars/liquor stores |
| **ADA** | Must comply with Americans with Disabilities Act (A.R.S. 36-2062) |

### Lease vs. Purchase

**Leasing:**
- Lower upfront cost ($3,000-$10,000 deposits)
- Must disclose sober living use to landlord
- Must obtain **Owner Attestation Form** (required for ADHS license)
- Lease must state property will be used as sober living home
- Risk: landlord can choose not to renew

**Purchasing:**
- Higher upfront cost ($400,000-$1,500,000 in AZ markets)
- Full control over property
- Check HOA restrictions before purchasing
- Better long-term economics
- Can leverage property for additional financing

### ADHS Maximum Occupancy
ADHS identifies the **maximum number of residents** on each license. This is based on:
- Local zoning ordinances
- Bedroom sizes and bathroom ratios
- Safety codes and egress requirements
- Building code occupancy limits

---

## 5. Licensing & Certification

### AzRHA Certification (Voluntary but Strongly Recommended)

AzRHA is the exclusive NARR state affiliate for Arizona. Certification is voluntary but unlocks:
- Streamlined ADHS licensing (may reduce state inspections)
- Access to referrals from treatment centers, courts, and state agencies
- Eligibility for grants and public funding
- Professional credibility

**Process:**
1. Submit application + $400/year membership fee
2. Attend 2 monthly meetings
3. Submit all policies & procedures for review
4. Pass on-site inspection ($100/house)
5. Pay bed dues ($10/bed/year for Level I/II)
6. Timeline: up to 60 days

**Meetings:** 3rd Wednesday of each month, 9 AM — St. Matthew's Episcopal Church, 901 W Erie St, Chandler 85225 (or via MS Teams). No December meeting.

### ADHS License (Mandatory)

**Application Requirements:**
- AzRHA certification (if obtained)
- Owner Attestation Form
- Fee: $500 + $100 × maximum number of residents
- Documentation of compliance with local zoning, building, fire codes
- Applicant must be a U.S. citizen or legal resident with AZ address

**License:**
- Valid for **12 months**, annual renewal required
- Annual compliance investigations (on-site)
- **Non-transferable** — new owners must submit initial application
- ADHS identifies maximum number of residents on the license

### NARR Levels — Which to Choose

| Level | Name | Description | Recommended For |
|-------|------|-------------|-----------------|
| **Level I** | Peer-Run | Democratically run, no paid staff (Oxford House model) | Experienced recovery community |
| **Level II** | Monitored | House manager oversight, peer accountability | **First-time Arizona operators** |
| **Level III** | Supervised | Paid professional staff, structured programming | Operators with clinical partnerships |
| **Level IV** | Clinical | Licensed clinical professionals, treatment services | Requires separate ADHS behavioral health facility license |

**Recommendation: Start with Level II.** It's the most common model, the simplest to operate, and has the lowest staffing requirements while still meeting ADHS standards.

---

## 6. Staffing & Training

### House Manager Requirements (ADHS Mandatory)

| Requirement | Details |
|-------------|---------|
| **Residency** | Must live on-site |
| **Age** | At least 21 years old |
| **Sobriety** | Maintained sobriety for at least 1 year |
| **CPR** | Current CPR certification |
| **Narcan** | Current naloxone training certification |
| **Availability** | On premises or available within 30 minutes of ADHS inspection notification |
| **Restriction** | Manager (or employee/family member) may NOT act as a resident's representative |

### Recommended Certifications

| Certification | Description | Requirements |
|---------------|-------------|--------------|
| **CRRA** | Certified Recovery Residence Administrator | 100 hours training, covers NARR standards and Code of Ethics |
| **CRSS** | Certified Recovery Support Specialist | 40-75 hours training + 1,000 hours experience + 2+ years recovery |
| **CPRS** | Certified Peer Recovery Specialist | Lived experience + state-specific training |
| **PRSS** | Peer Recovery Support Specialist (AZ specific) | AHCCCS OIFA credentialing under AMPM Policy 963 |

### Required Training Topics (LMS Curriculum)

**Category 1: Compliance & Legal**
- [ ] Arizona sober living laws (A.R.S. 36-2061, 36-2062)
- [ ] Fair Housing Act compliance
- [ ] 42 CFR Part 2 / HIPAA confidentiality
- [ ] NARR Standards and Code of Ethics
- [ ] Mandatory reporting (A.R.S. 46-454 — abuse/exploitation)
- [ ] ADA compliance

**Category 2: Operations**
- [ ] Intake and screening procedures
- [ ] Drug testing administration and protocols
- [ ] Record keeping and documentation
- [ ] House rules enforcement and progressive discipline
- [ ] Discharge and eviction procedures
- [ ] Medication management policies
- [ ] Financial management and rent collection

**Category 3: Safety & Emergency**
- [ ] CPR certification
- [ ] Narcan (naloxone) administration
- [ ] Overdose response protocol
- [ ] Fire safety and evacuation
- [ ] First aid
- [ ] Crisis de-escalation
- [ ] Mental Health First Aid

**Category 4: Recovery Support**
- [ ] Trauma-informed care
- [ ] Motivational interviewing basics
- [ ] MAT (Medication-Assisted Treatment) awareness and proper handling
- [ ] Understanding recovery stages and phases
- [ ] Peer support best practices
- [ ] Cultural competency
- [ ] Co-occurring disorders awareness

---

## 7. Operational Policies & Procedures

### Residency Agreement (Required by 9 A.A.C. 12, R9-12-202)

Must be documented before or at acceptance and include:
- Name and phone number of emergency contact
- Statement of resident rights
- All fees and charges (disclosed in writing before accepting any funds)
- Scope of services provided
- Drug testing policies and consequences
- Termination provisions
- Signed by both resident and operator

**Use "Residency Agreement" or "Program Agreement"** — not "lease." This emphasizes behavioral expectations and recovery participation.

### Termination of Residency (Arizona Rules)

| Type | Notice Required | When Used |
|------|----------------|-----------|
| **Immediate** | None | Behavior that is an immediate threat to health/safety |
| **7-day written** | 7 days | Nonpayment of fees, charges, or deposit |
| **14-day written** | 14 days | Any other reason |

### Standard House Rules

**Sobriety:**
- Zero tolerance for drugs and alcohol on premises
- Prescription medications must be documented at intake

**Drug Testing:**
- Random and/or scheduled screenings
- Positive test may result in immediate discharge
- All testing done per written policy

**Meeting Attendance:**
- Typically: 90 meetings in 90 days initially, then 3-4 per week
- AA, NA, SMART Recovery, Celebrate Recovery, or other approved programs
- Active work with a sponsor/mentor

**Curfew:**
- Typical: 9-11 PM weeknights, 12-1 AM weekends
- Phased approach common: stricter first 30 days, relaxed after good standing
- Earliest departure: typically 6 AM

**Employment/Education:**
- Must be employed, seeking employment, or enrolled in education
- Begin job search immediately upon move-in
- If not employed/in school: off property by 9 AM, return after 4 PM

**Chores:**
- Assigned weekly
- Clean common areas, maintain personal spaces
- Failure to participate may be grounds for progressive discipline

**Additional:**
- Sleep at the house at least 5 nights per week
- Visitor policies and hours
- No violence, weapons, threats — zero tolerance
- Room search policy for prohibited items
- Respect for all residents, staff, and neighbors

### Grievance Procedures
- Posted or available in common areas
- Written policy with clear steps
- Right to escalate to AzRHA for mediation
- Target resolution within 48 hours
- Anti-retaliation protections
- All grievances documented

### Record Keeping

Must maintain in secure, locked location:
- Resident files (application, intake docs, signed agreements, emergency contacts)
- Drug test results
- Incident reports
- Financial records
- Medication documentation
- Employment/education verification
- Discharge records
- Staff records (training, background checks, certifications)
- Insurance documentation
- Compliance documentation
- House meeting minutes
- Grievance records

**Retention:** Follow the longest applicable period. When in doubt, retain for **7 years minimum**.

---

## 8. Drug Testing Protocols

### Legal Framework
- Drug and alcohol tests are the **only medical/clinical service** permitted on-site (A.R.S. 36-2061)
- Must maintain "consistent and fair practices" for testing including frequency (A.R.S. 36-2062)
- At admission: resident must provide **proof of sobriety** within 3 calendar days before or at acceptance

### Testing Methods

| Method | Detection Window | Cost | Best For |
|--------|-----------------|------|----------|
| **Urine (UDT)** | 1-3 days (up to 30 days THC for chronic users) | $5-15 per instant cup | Routine screening — most common |
| **Saliva** | 24-48 hours | Moderate | Quick assessments, observed collection |
| **Hair Follicle** | Up to 90 days | $100-150 | Detecting long-term/chronic use |

### Best Practices
- **Test at intake — always, no exceptions.** Operators who skip intake testing report dramatically more incidents.
- **Random testing preferred** over scheduled — discourages planning use around known dates
- **Increase frequency** for new residents (first 30-60 days)
- Use tamper-resistant specimen cups with temperature strips
- Document all results in resident file

### AzRHA Ethical Standards for Drug Testing
1. **No insurance billing** for urine drug testing (if not licensed by ADHS for clinical services)
2. **No kickbacks** from lab companies
3. **All fees disclosed** at admission and in resident agreement
4. **No excessive testing** — understand it can negatively impact recovery if done punitively

---

## 9. Financial Planning & Startup Costs

### Startup Cost Estimates (Arizona / Phoenix Market)

| Category | Low Estimate | High Estimate |
|----------|-------------|---------------|
| Property deposit/lease (first, last, security) | $3,000 | $10,000 |
| Furniture & furnishings | $30,000 | $100,000 |
| Renovations/repairs | $5,000 | $50,000 |
| Insurance (Year 1) | $2,000 | $8,000 |
| ADHS Licensing (8-bed home) | $1,300 | $1,300 |
| AzRHA Certification | $580 | $580 |
| Legal fees | $2,000 | $5,000 |
| Marketing & branding | $2,000 | $8,000 |
| Technology & software | $5,000 | $15,000 |
| Drug testing supplies | $500 | $2,000 |
| Safety equipment (fire, Narcan, first aid) | $500 | $2,000 |
| Household supplies | $1,000 | $3,000 |
| Staffing & training (initial) | $20,000 | $50,000 |
| Operating reserves (3-6 months) | $9,000 | $30,000 |
| **TOTAL (Leased Property)** | **$81,880** | **$284,880** |

### Revenue Model

| Revenue Source | Monthly Per Bed | Notes |
|----------------|----------------|-------|
| Private pay (shared room) | $450-$800 | Primary revenue source |
| Private pay (private room) | $1,000-$2,500 | Higher margin |
| County reimbursement | $1,050-$1,650 | $35-$55/day |
| Drug court / probation funding | $1,050-$1,650 | $35-$55/day |

### Key Financial Metrics

| Metric | Target |
|--------|--------|
| Break-even occupancy | ~70% |
| Target occupancy | 85%+ |
| Operating margin (stabilized) | 20-35% |
| Monthly operating expenses (mid-market) | $3,000-$5,000 |
| Time to profitability | 6-18 months |
| Year 1 conservative occupancy assumption | 40-60% |

### Funding Sources
- **Private pay** (primary)
- **County behavioral health contracts** ($35-$55/day)
- **Drug court / probation referrals** ($35-$55/day)
- **HUD Recovery Housing Program (RHP)** grants (nonprofits only)
- **SAMHSA grants** (reauthorized through FY 2030)
- **State Opioid Response (SOR) grants**
- **Opioid settlement funds**
- **Arizona 1115 Waiver** (CMS-approved for housing-related services)
- **AZ AG $6M Sober Living Home Support Program** (grants up to $500K for Tribal Nations)

---

## 10. Insurance Requirements

### Required Coverage

| Type | Purpose | Budget |
|------|---------|--------|
| **General Liability** | Bodily injury, property damage on premises | $500-$5,000/yr |
| **Professional Liability (E&O)** | Negligence claims related to supervision/services | ~$850/yr |
| **Workers' Compensation** | Employee injuries (REQUIRED by AZ law if you have employees) | ~$550/yr |
| **Commercial Property** | Building and contents protection | Varies by property |

### Recommended Additional Coverage

| Type | Purpose |
|------|---------|
| **Abuse & Molestation** | Misconduct or supervision failure claims |
| **Hired/Non-Owned Auto** | Staff using personal vehicles for business |
| **Umbrella** | Additional protection above core limits |
| **Cyber / HIPAA Breach** | Data breach protection for resident info |
| **D&O** | Board liability (nonprofits) |

### Important Notes
- **Standard homeowner/landlord policies WILL NOT cover sober living operations**
- Specialized recovery housing insurance is a niche product — quotes take days, not hours
- Use experienced brokers who understand recovery housing
- Budget **$2,000-$8,000/year minimum** for comprehensive coverage
- Get an insurance **binder** (proof of active coverage) — needed for AzRHA certification

---

## 11. Marketing & Referral Network

### Referral Sources (Priority Order)

**Tier 1 — High-Volume, Best Fit**
- Residential treatment programs (discharge planners)
- Intensive outpatient programs (IOP)
- Visit in person, bring brochures, offer facility tours, follow up regularly

**Tier 2 — Reliable, Moderate Volume**
- Drug courts and mental health courts
- Probation and parole departments
- Detox centers
- County behavioral health departments (have dedicated budgets)

**Tier 3 — Supplementary**
- Churches and faith-based organizations
- Peer recovery centers and recovery coaches
- Hospital social workers and ED discharge coordinators
- Psychiatric hospitals/units
- Department of Veterans Affairs
- Other sober houses (for level-of-care transfers)
- Department of Children and Families

### Referral Data (Industry Average)
- 25% from criminal justice system
- 23% from family/friends
- 20% self-referral
- 13% from residential/inpatient treatment

### Marketing Best Practices
- **Get certified first** — certification is the gateway to most referral sources
- Build a **repeatable weekly outreach habit** to stay top-of-mind
- Provide **feedback to referral agencies** about how their referrals are adjusting
- Attend and speak at addiction recovery conferences
- Create a professional website with clear information
- List on recovery housing directories (SAMHSA locator, state directories)
- Budget **$2,000-$8,000/year** for marketing
- Build reciprocal relationships (refer residents needing detox back to hospital partners)

---

## 12. Common Mistakes to Avoid

1. **Treating it like a side project** — No business plan, unclear policies, mixed personal/business finances
2. **Finding a property before defining the business model** — Your model should drive property selection
3. **Skipping market research** — Not understanding local demand, competition, pricing
4. **Not diversifying funding** — Relying solely on private-pay instead of pursuing contracts and grants
5. **Not testing residents at intake** — Operators who skip this report dramatically more incidents
6. **No written policies** — Policies must be documented, signed, and consistently enforced
7. **Zoning and compliance failures** — Not understanding permits, spacing, registration requirements
8. **Ignoring licensing/certification** — Being locked out of referrals, funding, and credibility
9. **Accidentally operating as an unlicensed treatment facility** — Even well-intentioned clinical services create serious legal risk
10. **Underestimating costs and timeline** — Not having adequate reserves, not planning for low occupancy in Year 1
11. **Not specializing** — Trying to serve everyone instead of a niche (veterans, women, young adults, justice-involved)
12. **Mishandling MAT patients** — Creating stigma, not understanding protocols, or blanket-banning MAT
13. **Mixing genders in the same home** — Creates complications and often violates certification requirements
14. **Poor documentation** — Not documenting incidents, violations, conversations — creates legal exposure

---

## 13. LMS (Learning Management System) Specification

### Overview

The LMS is a built-in training platform within House Harmony Desk that ensures staff and new operators complete required training before going live.

### Feature Requirements

#### 13.1 — Course Structure
```
Course
├── Module 1
│   ├── Lesson 1 (video/text/PDF)
│   ├── Lesson 2
│   └── Quiz (must pass to proceed)
├── Module 2
│   ├── Lesson 1
│   └── Quiz
└── Final Assessment
```

#### 13.2 — Course Categories

| Category | Target Audience | Required/Optional |
|----------|----------------|-------------------|
| **Startup Foundations** | New operators | Required before launch |
| **Arizona Compliance** | All staff | Required |
| **House Manager Training** | House managers | Required |
| **Safety & Emergency** | All staff | Required |
| **Recovery Support** | All staff | Required |
| **Advanced Operations** | Operators/admins | Optional |
| **Continuing Education** | All staff | Annual requirement |

#### 13.3 — Built-In Courses (Pre-Loaded)

**Course 1: Arizona Sober Living Startup** (For Operators)
- Module 1: Arizona Legal Landscape (A.R.S. 36-2061, 36-2062, SB 1361)
- Module 2: Business Formation (LLC vs. Nonprofit)
- Module 3: Property Selection & Compliance
- Module 4: ADHS Licensing Process
- Module 5: AzRHA Certification Process
- Module 6: Financial Planning & Budgeting
- Module 7: Insurance Requirements
- Module 8: Building Your Referral Network
- Final Assessment

**Course 2: House Manager Certification Prep** (For Managers)
- Module 1: NARR Standards and Code of Ethics
- Module 2: Intake & Screening Procedures
- Module 3: Drug Testing Administration
- Module 4: House Rules Enforcement & Progressive Discipline
- Module 5: Record Keeping & Documentation
- Module 6: Discharge & Eviction Procedures
- Module 7: Fair Housing & Anti-Discrimination
- Module 8: Financial Management (Rent Collection, AR)
- Final Assessment

**Course 3: Safety & Emergency Response** (For All Staff)
- Module 1: Overdose Recognition & Narcan Administration
- Module 2: CPR Overview (directs to external certification)
- Module 3: Crisis De-Escalation
- Module 4: Fire Safety & Evacuation
- Module 5: First Aid Basics
- Module 6: Mental Health First Aid Overview
- Module 7: Mandatory Reporting (A.R.S. 46-454)
- Final Assessment

**Course 4: Recovery Support Fundamentals** (For All Staff)
- Module 1: Understanding Addiction & Recovery
- Module 2: Trauma-Informed Care
- Module 3: Motivational Interviewing Basics
- Module 4: MAT Awareness (Suboxone, Vivitrol, Methadone — What Staff Need to Know)
- Module 5: Co-Occurring Disorders
- Module 6: Cultural Competency
- Module 7: Peer Support Best Practices
- Final Assessment

**Course 5: Compliance & Confidentiality** (For All Staff)
- Module 1: 42 CFR Part 2 — Substance Use Disorder Records
- Module 2: HIPAA Basics (if applicable)
- Module 3: Fair Housing Act Deep Dive
- Module 4: ADA Compliance
- Module 5: Documentation Standards
- Final Assessment

#### 13.4 — LMS Features

- **Progress tracking** — visual progress bar per course, per user
- **Quiz engine** — multiple choice, true/false, scenario-based questions
- **Passing scores** — configurable per course (default 80%)
- **Certificates of completion** — auto-generated, downloadable PDF
- **Expiration tracking** — certifications expire, auto-remind for renewal
- **Custom course builder** — operators can create their own courses
- **Content types** — video (YouTube/Vimeo embed), text/markdown, PDF upload, external links
- **Assignment system** — assign courses to specific staff members with deadlines
- **Compliance dashboard** — admin view showing who's completed what, who's overdue
- **Reporting** — exportable training completion reports for audits

#### 13.5 — Certification Tracking Integration

The LMS connects to the certification tracking system:
- When a staff member completes a course → certification record created
- When a certification expires → staff member auto-assigned to re-take course
- Admin dashboard shows: green (current), yellow (expiring within 30 days), red (expired)
- Training status visible on staff profile

---

## 14. Guided Startup Wizard — Feature Specification

### Overview

A step-by-step guided wizard that walks a new operator through every step of starting a sober living home in Arizona. Think "TurboTax for opening a sober living."

### 14.1 — Wizard Flow

```
Welcome Screen
│
├── Step 1: Define Your Model
│   ├── What type of operator? (First-time / Experienced)
│   ├── NARR Level selection (I, II, III, IV — recommends Level II)
│   ├── Target demographic (men, women, young adults, veterans, etc.)
│   ├── Planned capacity (number of beds)
│   └── City/municipality (loads city-specific requirements)
│
├── Step 2: Business Formation
│   ├── Entity type selector (LLC vs. Nonprofit — with pros/cons comparison)
│   ├── Links to Arizona Corporation Commission filing
│   ├── EIN walkthrough
│   ├── Bank account setup guidance
│   └── Checklist items auto-created
│
├── Step 3: Property
│   ├── Lease vs. Purchase decision guide
│   ├── Zoning verification walkthrough (per selected city)
│   ├── Property requirements checklist
│   ├── Safety requirements checklist
│   ├── Furnishing checklist
│   └── Owner Attestation Form template
│
├── Step 4: Insurance
│   ├── Coverage types explainer
│   ├── Recommended minimums
│   ├── Broker recommendations (optional)
│   └── Upload insurance binder
│
├── Step 5: Policies & Procedures
│   ├── Template generator for each required document:
│   │   ├── Resident Agreement
│   │   ├── House Rules
│   │   ├── Drug Testing Policy
│   │   ├── Grievance Procedures
│   │   ├── Discharge Procedures
│   │   ├── Medication Policy
│   │   ├── Emergency Procedures
│   │   ├── Confidentiality Policy
│   │   ├── Anti-Discrimination Policy
│   │   ├── Code of Ethics
│   │   ├── Abuse Reporting Policy
│   │   └── Record Retention Policy
│   ├── Each template is pre-filled with Arizona-specific language
│   ├── Editable — operator customizes for their home
│   └── Export as PDF/Word
│
├── Step 6: Staffing
│   ├── House manager requirements checklist
│   ├── Background check guidance
│   ├── Assign LMS training courses
│   └── Certification tracker setup
│
├── Step 7: AzRHA Certification
│   ├── Guided walkthrough of AzRHA process
│   ├── Meeting attendance tracker
│   ├── Documentation checklist
│   ├── Inspection preparation guide
│   └── Status tracker (applied → docs submitted → inspected → certified)
│
├── Step 8: ADHS Licensing
│   ├── Application walkthrough
│   ├── Fee calculator
│   ├── Document gathering checklist
│   ├── Inspection preparation guide
│   └── Status tracker (applied → inspected → licensed)
│
├── Step 9: Referral Network
│   ├── Local referral source directory (by city)
│   ├── Outreach tracking (who you've contacted, when, outcome)
│   ├── Marketing material templates
│   └── Website launch checklist
│
└── Step 10: Launch Readiness
    ├── Final readiness assessment
    ├── All checklists must be 100% before launch
    ├── System configuration for daily operations
    └── "Go Live" button — transitions from startup mode to operations mode
```

### 14.2 — Key Features

- **Save and resume** — wizard state saved, pick up where you left off
- **Progress percentage** — overall completion tracking
- **Time estimates** — each step shows estimated time to complete
- **Document generation** — AI-assisted document templates pre-filled with operator's info
- **Resource links** — direct links to ADHS, AzRHA, AZ Corporation Commission, etc.
- **Contextual help** — info bubbles explaining why each step matters
- **Multi-home support** — repeat the wizard for each new house
- **Collaborative** — multiple team members can work on different sections

---

## 15. Checklist Engine — Feature Specification

### Overview

A dynamic, persistent checklist system that tracks startup progress and ongoing compliance. Not just static checkboxes — smart checklists that understand dependencies, deadlines, and requirements.

### 15.1 — Checklist Types

| Type | Use Case |
|------|----------|
| **Startup Checklist** | Opening a new house (from the wizard) |
| **Onboarding Checklist** | New staff member onboarding |
| **Intake Checklist** | New resident intake process |
| **Annual Renewal Checklist** | ADHS license renewal, AzRHA recertification |
| **Inspection Prep Checklist** | Preparing for ADHS or AzRHA inspection |
| **Monthly Operations Checklist** | Recurring monthly tasks |
| **Custom Checklists** | Operator-defined |

### 15.2 — Smart Checklist Features

- **Dependencies** — Item B cannot be checked until Item A is complete
- **Auto-populated dates** — deadlines calculated from start date or dependencies
- **Document attachments** — upload proof/evidence per item
- **Assignees** — assign checklist items to specific team members
- **Status tracking** — Not started, In progress, Blocked, Complete, N/A
- **Notifications** — automated reminders for upcoming and overdue items
- **Templates** — save and reuse checklist templates for new houses/staff
- **Progress dashboard** — visual completion percentage with bottleneck identification
- **Audit trail** — who completed what, when, with evidence
- **Export** — generate compliance report from completed checklists

### 15.3 — Pre-Built Templates

**Template: New House Startup (Arizona)**
- 10 phases, 70+ items
- Maps exactly to Section 2 of this document
- Auto-loads city-specific items based on selected municipality
- Estimated completion: 20 weeks

**Template: New Staff Onboarding**
- Background check submitted/cleared
- Code of Ethics signed
- LMS Course: Safety & Emergency → assigned and tracked
- LMS Course: Compliance & Confidentiality → assigned and tracked
- LMS Course: Recovery Support Fundamentals → assigned and tracked
- LMS Course: House Manager Certification (if applicable)
- CPR certification documented
- Narcan training documented
- All certifications uploaded
- System access granted and role assigned

**Template: New Resident Intake**
- Pre-screening questionnaire completed
- In-person interview conducted
- Drug test administered (within 3 days of acceptance)
- Background documentation collected (ID, insurance, sobriety proof)
- Resident Agreement reviewed and signed
- House Rules acknowledged and signed
- Emergency contacts documented
- Medication inventory completed
- Bed assigned
- Orientation completed (facility tour, schedule, expectations)
- First house meeting attended

**Template: ADHS Annual Renewal**
- All policies & procedures current and reviewed
- Insurance certificates current and on file
- Staff certifications current (CPR, Narcan, etc.)
- Fire safety equipment inspected
- Building/safety code compliance verified
- Resident records complete and secure
- Drug testing records current
- Financial records organized
- Renewal application submitted
- Renewal fee paid
- ADHS inspection scheduled and passed

**Template: Monthly Operations**
- Fire extinguisher inspection
- Smoke/CO detector test
- First aid supply check
- Narcan supply check
- Staff certification expiration review
- Resident drug testing compliance review
- Rent collection status review
- Maintenance request review
- Incident report review
- House meeting conducted
- AzRHA meeting attendance (if scheduled)

---

## 16. Database Schema

### LMS Tables

```sql
-- Course and content management
CREATE TABLE lms_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- startup_foundations, arizona_compliance, house_manager, safety_emergency, recovery_support, advanced_operations, continuing_education
  target_audience TEXT NOT NULL, -- operator, house_manager, all_staff
  is_required BOOLEAN DEFAULT false,
  passing_score INTEGER DEFAULT 80,
  estimated_hours DECIMAL(4,1),
  created_by UUID REFERENCES auth.users(id),
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE lms_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES lms_courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE lms_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID REFERENCES lms_modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content_type TEXT NOT NULL, -- video, text, pdf, external_link
  content TEXT, -- markdown content or URL
  file_url TEXT, -- for PDF uploads
  duration_minutes INTEGER,
  sort_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE lms_quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID REFERENCES lms_modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  passing_score INTEGER DEFAULT 80,
  questions_json JSONB NOT NULL, -- [{question, options[], correct_answer, explanation}]
  time_limit_minutes INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- User progress tracking
CREATE TABLE lms_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES lms_courses(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'not_started', -- not_started, in_progress, completed, expired
  assigned_by UUID REFERENCES auth.users(id),
  assigned_at TIMESTAMPTZ DEFAULT now(),
  deadline TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  UNIQUE(user_id, course_id)
);

CREATE TABLE lms_lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES lms_lessons(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  UNIQUE(user_id, lesson_id)
);

CREATE TABLE lms_quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  quiz_id UUID REFERENCES lms_quizzes(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  passed BOOLEAN NOT NULL,
  answers_json JSONB, -- user's submitted answers
  attempted_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE lms_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES lms_courses(id) ON DELETE CASCADE,
  certificate_number TEXT UNIQUE NOT NULL,
  issued_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ, -- null = never expires
  certificate_url TEXT -- generated PDF URL
);
```

### Startup Wizard Tables

```sql
CREATE TABLE startup_wizards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  house_name TEXT,
  municipality TEXT, -- phoenix, scottsdale, mesa, prescott, tucson, other
  narr_level TEXT DEFAULT 'level_2', -- level_1, level_2, level_3, level_4
  entity_type TEXT, -- llc, nonprofit
  target_demographic TEXT, -- men, women, young_adults, veterans, general
  planned_capacity INTEGER,
  current_step INTEGER DEFAULT 1,
  status TEXT DEFAULT 'in_progress', -- in_progress, completed, abandoned
  wizard_data_json JSONB DEFAULT '{}', -- stores all form data across steps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Checklist Engine Tables

```sql
CREATE TABLE checklist_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- startup, onboarding, intake, renewal, inspection, monthly, custom
  items_json JSONB NOT NULL, -- [{id, phase, title, description, dependencies[], estimated_days, documents_required}]
  municipality_specific TEXT, -- null = universal, or specific city name
  is_system BOOLEAN DEFAULT false, -- true = built-in, false = user-created
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES checklist_templates(id),
  name TEXT NOT NULL,
  house_id UUID REFERENCES houses(id),
  assigned_to UUID REFERENCES auth.users(id),
  status TEXT DEFAULT 'active', -- active, completed, archived
  due_date TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_id UUID REFERENCES checklists(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  phase TEXT, -- groups items by phase
  sort_order INTEGER NOT NULL,
  status TEXT DEFAULT 'not_started', -- not_started, in_progress, blocked, completed, na
  assigned_to UUID REFERENCES auth.users(id),
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES auth.users(id),
  dependencies TEXT[], -- array of checklist_item ids that must be complete first
  evidence_required BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE checklist_item_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID REFERENCES checklist_items(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  uploaded_by UUID REFERENCES auth.users(id),
  uploaded_at TIMESTAMPTZ DEFAULT now()
);
```

### Document Template Tables

```sql
CREATE TABLE document_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL, -- resident_agreement, house_rules, drug_testing_policy, grievance_procedures, discharge_procedures, medication_policy, emergency_procedures, confidentiality_policy, anti_discrimination, code_of_ethics, abuse_reporting, record_retention
  description TEXT,
  template_content TEXT NOT NULL, -- markdown with {{variable}} placeholders
  variables_json JSONB, -- [{name, label, type, default_value}]
  arizona_specific BOOLEAN DEFAULT true,
  version INTEGER DEFAULT 1,
  is_system BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE generated_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES document_templates(id),
  house_id UUID REFERENCES houses(id),
  resident_id UUID REFERENCES residents(id),
  filled_content TEXT NOT NULL,
  variables_used JSONB,
  signed_at TIMESTAMPTZ,
  signature_url TEXT,
  generated_by UUID REFERENCES auth.users(id),
  generated_at TIMESTAMPTZ DEFAULT now()
);
```

---

## Implementation Notes

### Feature Flags

Add these to the existing feature flag system:
- `ENABLE_LMS` — Learning Management System
- `ENABLE_STARTUP_WIZARD` — Guided Startup Wizard
- `ENABLE_CHECKLISTS` — Checklist Engine
- `ENABLE_DOCUMENT_TEMPLATES` — Document Template Generator

### Routing

| Route | Component | Feature Flag |
|-------|-----------|-------------|
| `/startup` | StartupWizard | ENABLE_STARTUP_WIZARD |
| `/startup/:wizardId` | StartupWizardStep | ENABLE_STARTUP_WIZARD |
| `/training` | LMSDashboard | ENABLE_LMS |
| `/training/courses` | LMSCourseList | ENABLE_LMS |
| `/training/courses/:id` | LMSCourseView | ENABLE_LMS |
| `/training/courses/:id/lesson/:lessonId` | LMSLessonView | ENABLE_LMS |
| `/training/admin` | LMSAdmin | ENABLE_LMS |
| `/checklists` | ChecklistDashboard | ENABLE_CHECKLISTS |
| `/checklists/:id` | ChecklistView | ENABLE_CHECKLISTS |
| `/documents` | DocumentTemplates | ENABLE_DOCUMENT_TEMPLATES |
| `/documents/generate/:templateId` | DocumentGenerator | ENABLE_DOCUMENT_TEMPLATES |

### Sidebar Navigation

Add under a new "Startup & Training" section in AppSidebar:
- Startup Wizard (rocket icon)
- Training / LMS (graduation cap icon)
- Checklists (clipboard-check icon)
- Documents (file-text icon)

---

## Sources & References

### Arizona State Resources
- [ADHS Sober Living Homes](https://www.azdhs.gov/licensing/special/sober-living-homes/)
- [ADHS Sober Living Fact Sheet](https://www.azdhs.gov/documents/licensing/special/sober-living-homes/sober-living-fact-sheet.pdf)
- [ADHS Sober Living FAQ](https://www.azdhs.gov/documents/licensing/special/sober-living-homes/faq-slh.pdf)
- [ADHS Sober Living Rules (9 A.A.C. 12)](https://www.azdhs.gov/documents/licensing/special/sober-living-homes/sober-living-rules.pdf)
- [ADHS Application](https://www.azdhs.gov/documents/licensing/special/sober-living-homes/sober-living-complete-application.pdf)
- [Arizona Corporation Commission — 10 Steps](https://azcc.gov/corporations/10-steps-to-starting-a-business-in-arizona)
- [Arizona AG Fair Housing](https://www.azag.gov/civil-rights/fair-housing)

### Legislation
- [HB 2107 (2016)](https://www.azleg.gov/legtext/52leg/2r/bills/hb2107p.pdf)
- [SB 1465 (2018)](https://www.azleg.gov/legtext/53leg/2r/bills/sb1465s.pdf)
- [SB 1361 (2024)](https://www.azleg.gov/legtext/56leg/2r/bills/sb1361s.htm)
- [SB 1605 (2024)](https://www.azleg.gov/legtext/56leg/2R/bills/SB1605P.htm)

### Certification
- [AzRHA Steps to Certification](https://www.myazrha.org/steps-to-certification)
- [AzRHA Certification Checklist](https://www.myazrha.org/certification-checklist)
- [AzRHA Membership](https://www.myazrha.org/membership-overview/)
- [NARR Standards](https://narronline.org/standards/)
- [NARR Standard 3.0 PDF](https://narronline.org/wp-content/uploads/2024/05/NARR-Standard-3.0.pdf)

### Industry Guides
- [Vanderburgh House — How to Open in Arizona](https://www.vanderburghhouse.com/how-to-open-a-sober-living-home-or-recovery-housing-program-in-arizona/)
- [Vanderburgh House — How to Certify with AzRHA](https://www.vanderburghhouse.com/how-to-certify-a-sober-living-home-or-recovery-housing-program-in-arizona-with-azrha/)
- [Vanderburgh House — Insurance Guide](https://www.vanderburghhouse.com/managing-insurance-for-your-sober-house-a-guide-for-operators/)
- [Vanderburgh House — House Rules Guide](https://www.vanderburghhouse.com/house-rules-in-sober-houses/)
- [Vanderburgh House — Lease Agreement Guide](https://www.vanderburghhouse.com/sober-living-lease-agreements-what-to-include-and-what-to-leave-out/)
- [Sober Living App — Arizona Guide](https://soberlivingapp.com/blog/5-hacks-for-opening-a-sober-living-home-in-arizona-quickly)
- [Sobriety Hub — How to Open Profitably](https://www.sobrietyhub.com/our-blog/how-to-open-a-profitable-sober-living-home-inspired-by-owner-interviews)

### Compliance
- [42 CFR Part 2 (eCFR)](https://www.ecfr.gov/current/title-42/chapter-I/subchapter-A/part-2)
- [AHCCCS Peer Recovery Support Specialist](https://www.azahcccs.gov/AHCCCS/Downloads/PeerRecoverySupportSpecialist.pdf)
- [AzRHA Drug Testing Ethics](https://www.myazrha.org/drug-testing-sober-living)
