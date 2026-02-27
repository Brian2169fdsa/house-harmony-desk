# SoberOps — Master Build Document

> **Single source of truth.** Merges: `README.md`, `ROADMAP.md`, `STARTUP-GUIDE-ARIZONA.md`, and all 22 pages of the Arizona Sober Living Startup Guide (absorbed February 2026). Use this document to drive all development, feature prioritization, and regulatory decisions.

---

## Table of Contents

1. [Project Identity & Stack](#1-project-identity--stack)
2. [What Exists Today](#2-what-exists-today)
3. [Regulatory Foundation — Arizona](#3-regulatory-foundation--arizona)
4. [SLH vs BHRF — The Two Tracks](#4-slh-vs-bhrf--the-two-tracks)
5. [Operator Startup Journey (22-Page Guide Summary)](#5-operator-startup-journey-22-page-guide-summary)
6. [Platform Feature Inventory](#6-platform-feature-inventory)
7. [Build Roadmap — Phased](#7-build-roadmap--phased)
8. [Database Schema — Complete](#8-database-schema--complete)
9. [Architecture](#9-architecture)
10. [Official Sources & Resource Links](#10-official-sources--resource-links)

---

## 1. Project Identity & Stack

**Product name:** SoberOps (formerly House Harmony Desk)
**Purpose:** Purpose-built operating system for Arizona sober living home and behavioral health residential facility operators. Not generic property management — a compliance-aware, outcome-tracking, AI-augmented platform for recovery housing.

**Companion app:** SoberNest (resident-facing portal, shared Supabase backend)

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS + shadcn/ui (Radix UI) |
| Backend | Supabase (Auth, PostgreSQL, Realtime, Storage) |
| State | React Query (TanStack Query) |
| Routing | React Router v6 |
| Validation | Zod |
| Charts | Recharts |
| Dev Server | Port 8081 |

### Environment Variables

```
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-anon-key
```

### Feature Flag System

Feature flags stored in `localStorage`. Toggle from Settings page. All feature-gated routes wrapped in `<FeatureGate flag="ENABLE_XXX">`.

| Flag | Feature |
|------|---------|
| `ENABLE_INTAKE` | Intake / waitlist pipeline |
| `ENABLE_CRM` | CRM (contacts, orgs, referrals) |
| `ENABLE_MAINTENANCE` | Maintenance requests & vendors |
| `ENABLE_ANALYTICS` | Analytics dashboard + Projections |
| `ENABLE_INVESTOR_PORTAL` | Investor/lender read-only portal |
| `ENABLE_QUICKBOOKS` | QuickBooks Online integration |
| `ENABLE_STARTUP_WIZARD` | Guided startup wizard |
| `ENABLE_CHECKLISTS` | Checklist engine |
| `ENABLE_DOCUMENT_TEMPLATES` | Document template generator |
| `ENABLE_LMS` | Learning management system (Training) |

---

## 2. What Exists Today

### Core (Always On)

| Module | Status | Route |
|--------|--------|-------|
| Overview dashboard | ✅ Built | `/` |
| House / room / bed management | ✅ Built | `/houses`, `/houses/:id` |
| Resident profiles & leases | ✅ Built | `/residents` |
| Payment tracking & AR | ✅ Built | `/payments` |
| Notices & messaging | ✅ Built | `/notices`, `/messages` |
| Chore assignment | ✅ Built | `/chores` |
| Incident reporting | ✅ Built | `/incidents` |
| Resource library | ✅ Built | `/resources` |
| Drug testing tracker | ✅ Built | `/drug-tests` |
| Recovery program tracking | ✅ Built | `/recovery` |
| Emergency protocols | ✅ Built | `/emergency` |
| Accreditation tracker | ✅ Built | `/accreditation` |
| Staff management | ✅ Built | `/staff` |
| Auth (Supabase) | ✅ Built | `/auth` |
| Settings | ✅ Built | `/settings` |

### Feature-Gated

| Module | Flag | Route |
|--------|------|-------|
| Intake / waitlist pipeline | `ENABLE_INTAKE` | `/intake` |
| CRM (contacts, orgs, referrals) | `ENABLE_CRM` | `/crm`, `/crm/contacts/:id`, `/crm/referrals` |
| Maintenance requests | `ENABLE_MAINTENANCE` | `/maintenance` |
| Startup Wizard | `ENABLE_STARTUP_WIZARD` | `/startup`, `/startup/:wizardId` |
| Checklists | `ENABLE_CHECKLISTS` | `/checklists`, `/checklists/:id` |
| Document templates | `ENABLE_DOCUMENT_TEMPLATES` | `/documents`, `/documents/generate/:id` |
| Training / LMS | `ENABLE_LMS` | `/training`, `/training/courses`, `/training/courses/:id`, `/training/courses/:id/lesson/:lessonId`, `/training/admin` |
| Analytics | `ENABLE_ANALYTICS` | `/analytics` |
| Financial projections | `ENABLE_ANALYTICS` | `/projections` (includes SLH vs BHRF startup cost tab) |
| Investor portal | `ENABLE_INVESTOR_PORTAL` | `/investor-portal` |
| QuickBooks | `ENABLE_QUICKBOOKS` | `/quickbooks` |

---

## 3. Regulatory Foundation — Arizona

### Mandatory Licensing (A.R.S. 36-2061, 36-2062)

Arizona requires ADHS licensure for all sober living homes since **July 1, 2019** (9 A.A.C. 12 = R9-12). A "sober living home" provides:
- Alcohol/drug-free housing + independent living + life skills
- May support recovery activities
- **Cannot** provide medical/clinical services (except drug/alcohol testing)

### Key Legislation

| Bill | Year | Impact |
|------|------|--------|
| HB 2107 | 2016 | Cities/counties may regulate via ordinance |
| SB 1465 | 2018 | Mandatory ADHS licensure |
| **SB 1361** | **2024** | Mandatory on-site inspections; self-attestation banned; penalties $1,000/day/violation; operating without license = Class 1 misdemeanor |
| SB 1605 | 2024 | Died — 24hr supervision + 2:6 ratio (signals future direction) |

### SB 1361 (2024) — Critical Operator Implications

1. ADHS conducts **mandatory physical on-site inspections** before license + annually
2. **Self-attestation prohibited** — cannot just sign a compliance form
3. ADHS obtains **local jurisdiction documentation** (zoning, building, fire)
4. Civil penalty: **$1,000 per day per violation** (up from $500)
5. 10 days post-notice without license = **Class 1 misdemeanor**
6. State agencies may only refer to **certified or licensed** homes
7. Only certified/licensed homes eligible for **federal or state funding**

### ADHS License — SLH

- **Fee:** $500 + $100 × maximum number of residents
- **Validity:** 12 months, annual renewal required
- **Non-transferable** — new owners must re-apply
- **ADHS contact:** 150 N. 18th Ave., Ste. 410, Phoenix AZ 85007 | 602-542-3422 | SoberLiving@azdhs.gov

### AzRHA / NARR Certification (Voluntary, Strongly Recommended)

AzRHA = Arizona's exclusive NARR state affiliate.

| Step | Detail |
|------|--------|
| Membership | $400/year (membership@myazrha.org) |
| Meetings | 2 monthly (3rd Wednesday, 9 AM — St. Matthew's Episcopal Church, 901 W Erie St, Chandler 85225 or MS Teams) |
| Inspection | $100/house (email inspector@myazrha.org for checklist) |
| Bed dues | $10/bed/year (Level I/II) |
| Timeline | Up to 60 days |

**Why it matters:** Streamlines ADHS licensing, gates referrals from treatment centers/courts/state agencies, enables grants and public funding.

### NARR Levels

| Level | Name | Description | Recommended |
|-------|------|-------------|-------------|
| I | Peer-Run | Democratic/Oxford House model, no paid staff | Experienced community |
| **II** | **Monitored** | **House manager oversight, peer accountability** | **First-time AZ operators** |
| III | Supervised | Paid professional staff, structured programming | Clinical partnerships |
| IV | Clinical | Licensed clinical professionals, treatment services | Requires BHRF license |

### Fair Housing Act Protections

- Cities cannot zone sober homes out of residential areas
- Cities must provide **reasonable accommodation** for recovery housing
- SLH address is **not a public record** (A.R.S. 9-500.40)
- Exception: FHA does NOT protect individuals currently engaging in illegal drug use

### City-Level Requirements (Maricopa County Area)

| City | Key Requirements |
|------|----------------|
| **Phoenix** | Structured Sober Living Homes License through City Clerk; 11+ residents = "community residence center" |
| **Scottsdale** | Spacing requirements for all care homes (2024) |
| **Mesa** | Register with City Planning Division (Chapter 87, Section 11-31-14 of Mesa Zoning Ordinance) |
| **Prescott** | "Community residences" terminology; spacing + occupancy requirements |
| **Tucson** | Contact City of Tucson Planning Department |

**Phoenix 2024:** Explicitly tightened rules to discourage clustering. Maricopa County community residence program sets spacing/cap rules. Early neighbor outreach + clear operational policies reduce enforcement friction. Municipalities with distance rules must provide **reasonable accommodation deviation process**.

### AHCCCS / Medicaid

- **Room and board at SLH is NOT reimbursable** through AHCCCS/Medicaid (Federal Medicaid: room-and-board only available for institutionally-based facilities)
- Clinical services to residents by **outside providers** can bill AHCCCS (outpatient therapy, peer support)
- BHRF operators must finance housing separately; bill medically-necessary services to AHCCCS separately
- **Fraud warning:** Arizona had a massive AHCCCS/Medicaid fraud scandal — SB 1361 is the direct response. Ethical operation is existential.

---

## 4. SLH vs BHRF — The Two Tracks

### Decision Matrix

| Factor | SLH (R9-12) | BHRF (R9-10) |
|--------|-------------|--------------|
| Governing rule | 9 A.A.C. 12 | 9 A.A.C. 10 |
| Clinical services | None (drug testing only) | Yes — licensed clinical services |
| Staffing | House manager (on-site, 1yr sober, CPR, Narcan) | Qualified clinical staff + supervision ratios |
| AHCCCS billing | Room/board not billable | Clinical services billable to AHCCCS |
| Physical plant | Standard residential; smoke/CO/fire extinguisher/egress | More stringent occupancy/egress/systems (IFC + PBCC Phoenix framework) |
| Business structure | LLC or nonprofit; both viable | More complex — clinical compliance + payer contracts |
| Startup cost (10 residents) | $81K–$285K (lease) | $170K–$700K+ (lease) |
| Regulatory pathway | ADHS SLH license + AzRHA | ADHS BHRF license; AzRHA/NARR less applicable |
| Recommendation | **Start here — first-time operators** | After proven SLH operations |

### BHRF Classification (R9-10)

AHCCCS "Mental Health Services, Room and Board" covers lodging/meal-related services with billing limitations; exhaustion of other fund sources required first. SAMHSA SOR grant dollars can fund recovery housing including MOUD. Second Chance Act programs fund housing stabilization for reentry.

### Startup Budget Comparison (Maricopa County, AZ — 10 residents, lease-based)

| Line Item | SLH Low | SLH High | BHRF Low | BHRF High |
|-----------|---------|----------|----------|-----------|
| Legal entity + policies + contracts | $3K | $15K | $10K | $40K |
| Local zoning / use permit | $0 | $10K | $2K | $25K |
| Building / fire code renovations | $10K | $80K | $25K | $200K |
| Furnishings, beds, linens, security | $8K | $35K | $15K | $60K |
| Safety gear | $500 | $3K | $2K | $10K |
| IT + EHR / record system | $1K | $10K | $5K | $40K |
| ADHS licensing fees | $600 | $1.5K | $1K | $5K |
| AzRHA / NARR certification | $580 | $580 | $0 | $2K |
| Staffing recruitment + training | $5K | $25K | $20K | $80K |
| Insurance (Year 1) | $3K | $15K | $10K | $40K |
| Working capital reserve (2–3 mo.) | $20K | $80K | $80K | $250K |
| **TOTAL** | **$51.7K** | **$275K** | **$170K** | **$752K** |

*Source: Arizona Sober Living Startup Guide, pages 11-15. ADHS SLH fee = $500 + $100×max residents.*

---

## 5. Operator Startup Journey (22-Page Guide Summary)

### 10-Phase Startup Checklist

**Phase 1 — Planning & Research (Weeks 1-4)**
- Write business plan (mission, target population, financial projections, market analysis)
- Define model: NARR Level (Level II recommended), demographic, gender, specialty
- Research local market: demand, pricing, referral landscape
- Define startup budget and secure funding
- Decide entity: LLC or 501(c)(3)
- Consult attorney (landlord-tenant law + recovery housing)

**Phase 2 — Business Formation (Weeks 3-6)**
- File Articles of Organization (LLC) or Incorporation (nonprofit) with AZ Corporation Commission (azcc.gov)
- Obtain EIN (irs.gov — free, immediate)
- If nonprofit: file IRS Form 1023 within 27 months for retroactive tax-exempt status
- Open business bank account (separate from personal)
- Register AZ New Hire Reporting, unemployment insurance, TPT license, local business license

**Phase 3 — Property (Weeks 4-10)**
- Define property criteria: capacity, location, zoning, ADA
- Verify zoning with local planning department
- Secure property (lease or purchase); Owner Attestation Form if leasing
- Pass fire safety inspection (smoke, CO, extinguishers, egress)
- ADA compliance (A.R.S. 36-2062)
- Furnish + install safety equipment (Narcan kit, first aid, fire)

**Phase 4 — Insurance (Weeks 6-10)**
- General Liability ($1M per occurrence / $3M aggregate)
- Professional Liability (E&O)
- Workers' Compensation (required by AZ law if employees)
- Commercial Property
- Additional: Abuse & Molestation, Auto, Umbrella, Cyber/HIPAA, D&O (nonprofit)
- Get insurance **binder** (needed for AzRHA)

**Phase 5 — Policies & Procedures (Weeks 6-10)**
All must be written, signed, and consistently enforced:
- Resident Agreement / Program Agreement (per 9 A.A.C. 12, R9-12-202)
- House Rules; Drug & Alcohol Testing Policy; Grievance Procedures
- Discharge/Eviction Procedures; Medication Policy; Emergency Procedures
- Confidentiality Policy (42 CFR Part 2); Anti-Discrimination / Fair Housing
- Code of Ethics; Abuse Reporting Policy (A.R.S. 46-454); Record Retention

**Phase 6 — Staffing (Weeks 8-12)**
House Manager (ADHS mandatory requirements):
- Must live on-site; At least 21; Sober ≥1 year; CPR certified; Narcan certified
- Background check; Code of Ethics signed; LMS training completed; System access

**Phase 7 — AzRHA Certification (Weeks 10-16)**
- Submit application + $400; Attend 2 meetings; Email inspector@myazrha.org for checklist
- Submit policies & procedures; Pass documentation review; Pass on-site inspection ($100)
- Pay bed dues; Receive certification (up to 60 days)

**Phase 8 — ADHS Licensing (Weeks 14-20)**
- Complete ADHS SLH application; Attach AzRHA cert; Submit Owner Attestation Form
- Pay fee: $500 + $100 × max residents; Submit local jurisdiction compliance docs
- Pass mandatory on-site inspection; Receive ADHS license (12-month validity)

**Phase 9 — Referral Network & Marketing (Weeks 12-20)**
Priority referral sources:
- **Tier 1 (High-volume, best fit):** Residential treatment discharge planners, IOPs
- **Tier 2 (Reliable, moderate):** Drug courts, probation/parole, detox, county behavioral health ($35-$55/day)
- **Tier 3 (Supplementary):** Churches, hospital social workers, VA, peer recovery centers

Industry referral split: 25% criminal justice, 23% family/friends, 20% self-referral, 13% residential treatment.

Budget: $2,000–$8,000/year. Get certified first — certification is the gateway to referrals.

**Phase 10 — Launch (Week 20+)**
- Final walkthrough; stock drug testing supplies; set up system; accept first residents
- "Go Live" transition from startup mode to operations mode

### Gantt Timeline (Maricopa County, AZ — SLH, 10 residents baseline)

| Track | Task | Duration |
|-------|------|---------|
| a1 | Decide model SLH/BHRF/ARCI | 21d |
| a2 | Site shortlist + zoning pre-check (after a1) | 30d |
| b1 | Phoenix/County planning consult (after a2) | 14d |
| b2 | Spacing analysis + reasonable accommodation strategy | 21d |
| b3 | Submit zoning/use permit/community residence packet | 60d |
| c1 | Building/fire code review (after b1) | 45d |
| c2 | Renovations + furnishings | 90d |
| c3 | Fire inspection readiness (AHJ) | 14d |
| d1 | SLH application prep R9-12 (after b3) | 30d |
| d2 | SLH ADHS review + inspection | 45d |
| e1 | BHRF application + policies + staffing (after b3) | 90d |
| e2 | BHRF ADHS substantive review + on-site survey | 90d |
| f1 | Hire/train staff + background checks (after c1) | 60d |
| f2/f3 | Intake pipeline + referral agreements (after f1) | 45d |
| **GO-LIVE** | After d2 (SLH) or e2 (BHRF) | **~9-12 months total** |

### Key Financial Metrics

| Metric | Target |
|--------|--------|
| Break-even occupancy | ~70% |
| Target occupancy | 85%+ |
| Operating margin (stabilized) | 20–35% |
| Monthly operating expenses (mid-market) | $3,000–$5,000 |
| Time to profitability | 6–18 months |
| Year 1 conservative occupancy | 40–60% |

### Revenue Sources

| Source | Monthly per Bed |
|--------|----------------|
| Private pay (shared room) | $450–$800 |
| Private pay (private room) | $1,000–$2,500 |
| County reimbursement | $1,050–$1,650 ($35–$55/day) |
| Drug court / probation funding | $1,050–$1,650 |

### 14 Common Mistakes to Avoid

1. Treating it like a side project
2. Securing property before defining business model
3. Skipping market research
4. Not diversifying funding
5. Not testing residents at intake
6. No written policies
7. Zoning and compliance failures
8. Ignoring licensing/certification
9. Accidentally operating as unlicensed treatment facility
10. Underestimating costs and timeline
11. Not specializing (trying to serve everyone)
12. Mishandling MAT patients
13. Mixing genders in same home
14. Poor documentation (no audit trail = legal exposure)

### Accreditation Options

| Accreditation | Body | Cost | Notes |
|--------------|------|------|-------|
| **NARR/AzRHA** | AzRHA | $580 startup + $10/bed/yr | Strongly recommended; streamlines ADHS |
| **ADHS SLH License** | ADHS | $500 + $100×residents/yr | Mandatory |
| **ADHS BHRF License** | ADHS | Varies by class | Mandatory for clinical services |
| CARF | CARF | Custom quote | Prep may take 1+ year; continuous improvement model |
| CARF ASAM LOC | CARF/ASAM | Custom quote (see Fees-JUL2025-JUN2026) | Residential SUD LOC signaling |
| Joint Commission | TJC | Custom quote | Market signaling; on-site survey by trained surveyors |

---

## 6. Platform Feature Inventory

### Built

See Section 2 — What Exists Today.

### Outstanding — Ordered by Priority

#### Batch 1: Foundation (Weeks 1-4)

| # | Feature | Why |
|---|---------|-----|
| 1 | Audit Trail & Logging (`audit_log`) | Every action logged from this point forward |
| 2 | Role-Based Access Control | Needed before investor/vendor/staff portals |
| 3 | Drug Testing Tracker | ✅ Built |
| 4 | Recovery Program Tracking | ✅ Built |
| 5 | Document Management + E-Signatures | Leases, intake forms, compliance docs |
| 6 | Emergency Protocols | ✅ Built |
| 7 | Accreditation Tracker | ✅ Built |

#### Batch 2: Financial & Analytics (Weeks 5-8)

| # | Feature | Why |
|---|---------|-----|
| 8 | Expense Tracking | Need costs before ROI |
| 9 | ROI Analytics Dashboard | ✅ Built (Analytics.tsx) |
| 10 | QuickBooks Integration | ✅ Built (QuickBooks.tsx scaffold) |
| 11 | Investor/Lender Portal | ✅ Built |
| 12 | Financial Projections Engine | ✅ Built — SLH vs BHRF startup cost tab added |

#### Batch 3: Operations Scale (Weeks 9-12)

| # | Feature | Why |
|---|---------|-----|
| 13 | Enhanced Maintenance + SLAs | Property care = homeowner trust |
| 14 | Preventive Maintenance Scheduler | Proactive > reactive |
| 15 | Staff Training (LMS) | ✅ Built |
| 16 | Staff Scheduling | Coverage across multiple houses |
| 17 | Notification Hub | Unified comms backbone |
| 18 | Multi-Property Portfolio View | Bird's-eye view |

#### Batch 4: AI & Automation (Weeks 13-16)

| # | Feature | Tech |
|---|---------|------|
| 19 | AI Intake Screening Agent | Edge Function + Claude API + Twilio |
| 20 | AI Payment Collection Agent | Supabase CRON + Edge Functions + Twilio/SendGrid |
| 21 | AI Maintenance Triage Agent | Edge Function + Claude API (vision) |
| 22 | AI Compliance Monitor | Supabase CRON + Edge Functions |
| 23 | Smart Assistant (Chat) | Claude API with tool use + Supabase function calling |

#### Batch 5: Growth & Retention (Weeks 17-20)

| # | Feature | Why |
|---|---------|-----|
| 24 | Marketing & Lead Source Analytics | Know what's working |
| 25 | Alumni Network & Aftercare | Outcomes data + referral pipeline |
| 26 | Outcome Tracking | Grant apps, marketing, mission proof |
| 27 | AI Occupancy Optimization | Fill beds faster |
| 28 | AI Report Generation | One-click investor + compliance reports |
| 29 | Vendor Portal | Self-service reduces overhead |

#### Community Engagement Module (from pages 11-15)

Needed for Phoenix/Maricopa County NIMBY risk mitigation:
- Neighbor outreach log (date, contact, outcome)
- Complaint resolution tracking (complaint received → response sent → resolved)
- Reasonable accommodation request tracking (FHA framework)
- Status dashboard for each property's community engagement health

---

## 7. Build Roadmap — Phased

### Phase 1: Startup & Staff Training ✅ (Largely Complete)

Built: LMS (5 courses, quiz engine, certificates), Startup Wizard (10 steps), Checklists (5 templates, dependency engine), Document Generator (policy templates), Accreditation Tracker (NARR/AzRHA, ADHS, CARF, JC).

Remaining:
- [ ] Seed LMS with actual course content for all 5 built-in courses
- [ ] Staff onboarding workflow (invite → guided setup → role assignment)
- [ ] Certification expiry notifications (email/in-app)

### Phase 2: ROI Analytics & Investor Dashboard ✅ (Largely Complete)

Built: Analytics.tsx, InvestorPortal.tsx, Projections.tsx (now with SLH vs BHRF startup cost tab).

Remaining:
- [ ] Expense tracking module (expense_records table UI)
- [ ] Outcome tracking (resident milestones, sobriety tracking, alumni follow-up)
- [ ] Aggregated outcome reports for grant applications

### Phase 3: QuickBooks Integration ✅ (Scaffold Complete)

Built: QuickBooks.tsx OAuth2 flow scaffold.

Remaining:
- [ ] Actual QB API calls (Supabase Edge Functions)
- [ ] Sync status dashboard + manual re-sync
- [ ] Report pull (P&L, AR aging)

### Phase 4: Enhanced Maintenance

- [ ] SLA tracking (Emergency: 4hr, High: 24hr, Medium: 72hr, Low: 1wk)
- [ ] Preventive maintenance scheduler (recurring templates)
- [ ] Cost tracking per ticket
- [ ] Budget vs. actual variance per house

### Phase 5: Agentic AI System

Architecture: Supabase Edge Functions + Claude API + Twilio + SendGrid

Agents to build:
1. `ai-intake-agent` — screen leads 24/7 via SMS
2. `ai-payment-agent` — automated AR follow-up sequence
3. `ai-maintenance-agent` — triage + dispatch via vision model
4. `ai-compliance-agent` — daily scan, flag gaps, weekly report
5. `ai-occupancy-agent` — fill beds, pricing recommendations
6. `ai-report-agent` — scheduled investor/compliance reports
7. `ai-assistant` — in-app chat with tool use

### Phase 6: Operator Must-Haves

- [x] Drug Testing Tracker
- [x] Recovery Program Tracking
- [x] Emergency Protocols
- [x] Document Management
- [ ] Multi-Property Portfolio Map View (Google Maps, color-coded by performance)
- [ ] Alumni Network & Aftercare
- [ ] Staff Scheduling & Time Tracking
- [ ] Notification & Communication Hub (Twilio + SendGrid + Firebase)
- [ ] Marketing & Lead Source Analytics

---

## 8. Database Schema — Complete

### Existing (Migrations applied)

```
houses, rooms, beds                          -- core property
residents, leases, lease_terms               -- residents
invoices, payments, payment_history          -- payments
notices, messages                            -- communications
chores, chore_assignments                    -- chore management
incidents, incident_follow_ups               -- incident tracking
resources                                    -- resource library
maintenance_requests, vendors                -- maintenance
crm_contacts, crm_organizations, crm_referrals -- CRM
intake_leads, intake_stages                  -- intake pipeline
drug_tests, drug_test_schedules             -- drug testing
meeting_attendance, court_requirements       -- recovery tracking
employment_records, program_phase_rules      -- recovery program
emergency_contacts, emergency_protocols      -- emergency
emergency_supplies, emergency_events         -- emergency
audit_log                                    -- audit trail
compliance_checklists, inspection_records    -- compliance
lms_courses, lms_modules, lms_lessons       -- LMS
lms_quizzes, lms_enrollments                -- LMS
lms_lesson_progress, lms_quiz_attempts       -- LMS progress
lms_certificates                             -- LMS certs
startup_wizards                              -- startup wizard
checklist_templates, checklists              -- checklists
checklist_items, checklist_item_attachments  -- checklist items
checklist_audit_log                          -- checklist audit
document_templates, generated_documents      -- documents
projection_scenarios                         -- financial projections
financial_snapshots, expense_records         -- analytics
resident_outcomes, alumni_followups          -- outcomes
investor_accounts, portfolio_metrics         -- investor portal
qb_connections, qb_sync_mappings            -- QuickBooks
qb_sync_log, qb_account_mappings            -- QuickBooks
agent_actions_log, agent_configurations      -- AI agents
agent_conversations, ai_screening_results    -- AI agents
accreditations, accreditation_prep_items     -- NEW: accreditation tracker
```

### New: Accreditation Tables

```sql
CREATE TABLE accreditations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  house_id UUID REFERENCES houses(id) ON DELETE SET NULL,
  accreditation_type TEXT NOT NULL,
  -- 'narr_azrha' | 'adhs_slh' | 'adhs_bhrf' | 'carf' | 'carf_asam' | 'joint_commission' | 'other'
  accreditation_name TEXT NOT NULL,
  issuing_body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'planning',
  -- 'planning' | 'applied' | 'in_review' | 'inspection_scheduled' | 'active' | 'expired' | 'denied' | 'withdrawn'
  applied_at DATE,
  issued_at DATE,
  expires_at DATE,
  renewal_due_at DATE,
  next_inspection_at DATE,
  application_fee NUMERIC(10,2),
  annual_fee NUMERIC(10,2),
  fee_notes TEXT,
  notes TEXT,
  certificate_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE accreditation_prep_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  accreditation_id UUID REFERENCES accreditations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  due_date DATE,
  completed_at TIMESTAMPTZ,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Pending: Community Engagement

```sql
CREATE TABLE community_engagement_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  house_id UUID REFERENCES houses(id),
  user_id UUID REFERENCES auth.users(id),
  contact_type TEXT NOT NULL,  -- 'neighbor_outreach' | 'complaint' | 'reasonable_accommodation' | 'meeting'
  contact_name TEXT,
  contact_address TEXT,
  contact_date DATE NOT NULL,
  description TEXT,
  outcome TEXT,
  follow_up_date DATE,
  status TEXT DEFAULT 'open',  -- 'open' | 'in_progress' | 'resolved' | 'escalated'
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Pending: Staff Scheduling

```sql
CREATE TABLE staff_schedules (
  staff_id UUID REFERENCES auth.users(id),
  house_id UUID REFERENCES houses(id),
  shift_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  role TEXT
);

CREATE TABLE time_entries (
  staff_id UUID REFERENCES auth.users(id),
  clock_in TIMESTAMPTZ NOT NULL,
  clock_out TIMESTAMPTZ,
  house_id UUID REFERENCES houses(id),
  break_minutes INTEGER DEFAULT 0
);
```

### Pending: Marketing & Lead Analytics

```sql
CREATE TABLE marketing_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL,  -- 'google' | 'referral_partner' | 'alumni' | 'court' | 'treatment' | 'other'
  monthly_cost NUMERIC(10,2),
  active BOOLEAN DEFAULT true
);

CREATE TABLE lead_attributions (
  lead_id UUID REFERENCES intake_leads(id),
  channel_id UUID REFERENCES marketing_channels(id),
  campaign_name TEXT,
  cost NUMERIC(10,2)
);
```

### Pending: Notification Hub

```sql
CREATE TABLE notification_preferences (
  user_id UUID REFERENCES auth.users(id),
  channel TEXT NOT NULL,  -- 'email' | 'sms' | 'push' | 'in_app'
  category TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true
);

CREATE TABLE notification_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID REFERENCES auth.users(id),
  channel TEXT NOT NULL,
  category TEXT NOT NULL,
  subject TEXT,
  body TEXT,
  status TEXT DEFAULT 'pending',
  sent_at TIMESTAMPTZ
);

CREATE TABLE message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  subject_template TEXT,
  body_template TEXT,
  variables JSONB
);
```

---

## 9. Architecture

```
┌─────────────────────────────────────────────────────────┐
│              Frontend (React 18 / Vite)                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐  │
│  │ Operator  │ │ Investor │ │  Vendor  │ │   Staff    │  │
│  │Dashboard  │ │ Portal   │ │ Portal   │ │  Portal    │  │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └─────┬──────┘  │
│       │                                         │         │
│  ┌────┴──────────────────────────────────────────┐        │
│  │            AI Chat Assistant Panel             │        │
│  └──────────────────────┬─────────────────────────┘        │
└─────────────────────────┼────────────────────────────────┘
                          │
┌─────────────────────────┼────────────────────────────────┐
│                   Supabase Platform                       │
│  ┌──────────────────────┴───────────────────────────┐    │
│  │              Supabase Edge Functions              │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────────────┐  │    │
│  │  │ AI Agents│ │ QB Sync  │ │ Notification Svc │  │    │
│  │  └──────────┘ └──────────┘ └──────────────────┘  │    │
│  └───────────────────────────────────────────────────┘    │
│                                                           │
│  PostgreSQL + Auth + Storage + Realtime                   │
└───────────────────────────────────────────────────────────┘
                          │
          ┌───────────────┼───────────────┐
          │               │               │
  ┌───────┴──────┐ ┌─────┴──────┐ ┌──────┴──────┐
  │  QuickBooks  │ │  Twilio    │ │   Claude    │
  │  Online API  │ │  (SMS)     │ │   API       │
  └──────────────┘ └────────────┘ └─────────────┘
          │               │
  ┌───────┴──────┐ ┌─────┴──────┐
  │  SendGrid    │ │  DocuSign  │
  │  (Email)     │ │  (E-Sign)  │
  └──────────────┘ └────────────┘
```

### AI Agent Architecture

```
/supabase/functions/
├── ai-intake-agent/          -- Lead screening via SMS (Twilio + Claude)
├── ai-payment-agent/         -- AR follow-up sequence (CRON + Twilio/SendGrid)
├── ai-maintenance-agent/     -- Triage + dispatch (Claude vision)
├── ai-compliance-agent/      -- Daily scan, weekly compliance report
├── ai-occupancy-agent/       -- Fill beds, pricing recommendations
├── ai-report-agent/          -- Scheduled investor + compliance reports
└── ai-assistant/             -- In-app chat with tool use
```

### Revenue Model

| Feature | Operator Value |
|---------|----------------|
| AI Intake Agent | Handle 3x leads without hiring → fill beds faster |
| Payment Agent | Reduce AR days 40-60% → improve cash flow |
| Maintenance SLAs | Prove property care → secure more properties |
| ROI Dashboard | Close lender/investor deals with real data |
| QB Integration | Save 10+ hrs/month bookkeeping |
| Compliance Engine | Avoid fines, pass audits → protect licenses |
| Occupancy Agent | Reduce vacancy days 30-50% → $500-1500/bed/yr gain |
| Alumni Network | 20-30% new residents from alumni → free acquisition |
| Staff Training | Reduce turnover + liability incidents |

---

## 10. Official Sources & Resource Links

### Arizona Statutes & Regulations

| Reference | URL |
|-----------|-----|
| A.R.S. 36-2061 (SLH definition) | https://www.azleg.gov/ars/36/02061.htm |
| A.R.S. 36-2064 (SLH requirements) | https://www.azleg.gov/ars/36/02064.docx |
| 9 A.A.C. 12 (SLH rules) | https://azleg.gov/ars/12/02297.htm |
| 9 A.A.C. 10 (BHRF rules) | https://www.azleg.gov/ars/12/02292.htm |

### ADHS Licensing Documents

| Document | URL |
|----------|-----|
| SLH Complete Application | https://www.azdhs.gov/documents/licensing/special/sober-living-homes/sober-living-complete-application.pdf |
| BHRF Initial Checklist | https://www.azdhs.gov/documents/licensing/residential-facilities/forms/behavioral-health-initial-checklist.pdf |
| Residential Licensure Process (training deck) | https://www.azdhs.gov/documents/licensing/residential-facilities/training/residential-licensure-process.pdf |

### Accreditation Bodies

| Organization | URL |
|-------------|-----|
| NARR Standards | https://narronline.org/standards/ |
| CARF Behavioral Health Programs | https://carf.org/accreditation/programs/behavioral-health/ |
| CARF Accreditation Steps | https://carf.org/accreditation/steps-accreditation/ |
| CARF Fee Schedule (JUL2025-JUN2026) | https://carf.org/wp-content/uploads/2025/07/Fees-JUL2025-JUN2026-LOC-2025-FINAL.pdf |
| CARF Contact | https://carf.org/contact-us/ |
| Joint Commission — BH Care & Human Services | https://www.jointcommission.org/en-us/accreditation/behavioral-health-care-and-human-services |
| Joint Commission — Standards | https://www.jointcommission.org/en-us/standards/public-standards |
| Joint Commission — Accreditation Process | https://www.jointcommission.org/en-us/accreditation/process |
| Joint Commission — Pricing | https://www.jointcommission.org/en-us/accreditation/pricing |
| Joint Commission — State & Payer Recognitions | https://www.jointcommission.org/en-us/accreditation/behavioral-health-care-and-human-services/state-payer-recognitions |

### Payer & Funding

| Resource | URL |
|----------|-----|
| AHCCCS Mental Health Policy Manual 320T2 | https://www.azahcccs.gov/shared/Downloads/MedicalPolicyManual/300/320T2.pdf |
| CMS Medicaid Room & Board Policy (SMD19003) | https://www.medicaid.gov/federal-policy-guidance/downloads/smd19003.pdf |
| 42 CFR Part 2 (SUD record confidentiality) | https://www.ecfr.gov/current/title-42/chapter-I/subchapter-A/part-2 |
| HIPAA Privacy | https://www.hhs.gov/hipaa/for-professionals/privacy/index.html |
| 45 CFR Part 160 (HIPAA) | https://www.ecfr.gov/current/title-45/subtitle-A/subchapter-C/part-160 |

### Business Formation

| Resource | URL |
|----------|-----|
| Arizona Business One Stop | https://businessonestop.az.gov/ |
| AZ Work/Business | https://az.gov/work/business |
| AZ Corp Commission — Nonprofit Instructions | https://www.azcc.gov/docs/default-source/corps-files/instructions/c011i-instructions-articles-of-inc-nonprofit.pdf?sfvrsn=eac39497_2 |

---

*Last updated: 2026-02-27. Sources verified. All 22 pages of Arizona Sober Living Startup Guide absorbed.*
