# House Harmony Desk — Business Expansion Roadmap

## What Exists Today

| Module | Status |
|--------|--------|
| House/Room/Bed Management | Core |
| Resident Profiles & Leases | Core |
| Payment Tracking & AR | Core |
| Notices & Messaging | Core |
| Chore Assignment | Core |
| Incident Reporting | Core |
| Resource Library | Core |
| Intake/Waitlist Pipeline | Feature-gated |
| CRM (Contacts, Orgs, Referrals) | Feature-gated |
| Maintenance Requests & Vendors | Feature-gated |
| Auth (Supabase) | Core |

---

## Phase 1: Startup & Staff Training Module

**Why:** Sober living operators scale by opening new houses. Every new house means new house managers and staff who need consistent training. Lenders and homeowners want to see you have repeatable, professional operations — not just one person who "knows how to do it."

### 1.1 — Staff Onboarding Workflow
- New staff invite system (email → create account → guided setup)
- Role-based access: Owner, Regional Manager, House Manager, Staff, Read-Only (Investor)
- Onboarding checklist per role (background check submitted, training completed, policies signed)
- Progress tracker visible to admins

### 1.2 — Training Material Library
- Upload & organize training content (videos, PDFs, SOPs)
- Categorized by topic: De-escalation, Drug Testing Procedures, Emergency Protocols, House Rules Enforcement, Fair Housing, NARR Standards
- Quiz/assessment engine — staff must pass before going live
- Certification tracking with expiration dates (CPR, First Aid, NARR ethics)
- Re-certification reminders (automated email/notification)

### 1.3 — Standard Operating Procedures (SOPs)
- SOP template builder (step-by-step procedures)
- Version control — when SOPs change, staff must re-acknowledge
- SOPs linked to specific tasks (e.g., "Intake Procedure" linked to intake pipeline)
- Printable/exportable for physical house binders

### Database Tables
```
staff_profiles        — extended user profiles with role, hire_date, status
training_modules      — id, title, category, content_url, content_type, quiz_json, passing_score
staff_training_progress — staff_id, module_id, status, score, completed_at
certifications        — staff_id, cert_type, issued_at, expires_at, document_url
sop_documents         — id, title, category, version, content, effective_date
sop_acknowledgments   — staff_id, sop_id, acknowledged_at
onboarding_checklists — staff_id, checklist_items_json, completed_items, status
```

---

## Phase 2: ROI Analytics & Investor/Lender Dashboard

**Why:** This is the make-or-break feature. Homeowners need proof their property is being cared for and generating returns. Lenders need data showing the business model works. Operators need to see which houses perform and which don't.

### 2.1 — Operator Analytics Dashboard
- **Occupancy Analytics:** Rate over time (daily/weekly/monthly), days-to-fill per bed, vacancy cost calculator
- **Revenue Analytics:** Revenue per bed per month, revenue per house, total portfolio revenue, month-over-month growth
- **Expense Tracking:** Cost per resident, maintenance cost per house, total operating expenses, expense categories breakdown
- **Retention Metrics:** Average length of stay, voluntary vs. involuntary departures, 30/60/90-day retention rates
- **Pipeline Analytics:** Lead-to-move-in conversion rate, average days in pipeline, referral source ROI (which sources produce the best residents)
- **Collection Metrics:** Payment success rate trends, average days to collect, bad debt write-offs

### 2.2 — Investor/Lender Portal (Read-Only)
- Separate login with restricted access
- Property-specific P&L summaries
- Occupancy and revenue dashboards
- Maintenance history and property condition reports
- Cap rate calculations
- NOI (Net Operating Income) tracking
- Cash-on-cash return displays
- Downloadable PDF reports (monthly/quarterly/annual)
- Benchmark comparisons (your house vs. portfolio average)

### 2.3 — Outcome Tracking (Prove the Mission Works)
- Resident success metrics:
  - Sobriety milestones (30, 60, 90, 180, 365 days)
  - Employment obtained/maintained
  - Moved to independent housing
  - Program completion rate
  - Relapse/readmission rate
- Alumni follow-up tracking (3, 6, 12-month check-ins)
- Aggregated outcome reports for grant applications and marketing
- NARR Level compliance scoring (I, II, III, IV)

### 2.4 — Financial Projections Engine
- "What-if" calculator: If I open house #3 with X beds at $Y/month, what's my projected ROI?
- Break-even analysis per house
- Seasonal occupancy modeling
- Debt service coverage ratio (DSCR) calculator for lenders

### Database Tables
```
financial_snapshots   — house_id, month, revenue, expenses, noi, occupancy_rate, generated_at
expense_records       — id, house_id, category, amount, date, description, receipt_url
resident_outcomes     — resident_id, milestone_type, milestone_date, notes
alumni_followups      — resident_id, followup_date, status, employment, housing, sobriety_status
investor_accounts     — user_id, access_level, linked_house_ids, created_at
portfolio_metrics     — snapshot_date, total_beds, occupied_beds, total_revenue, total_expenses
projection_scenarios  — id, name, assumptions_json, results_json, created_by, created_at
```

---

## Phase 3: QuickBooks API Integration

**Why:** Every sober living operator needs real accounting. Manual spreadsheets don't scale and lenders won't trust them. QuickBooks is the standard for small business accounting.

### 3.1 — OAuth2 Connection
- QuickBooks Online OAuth2 flow (connect/disconnect from Settings)
- Token refresh handling
- Multi-company support (one QB company per operator entity)
- Connection health monitoring

### 3.2 — Chart of Accounts Mapping
- Auto-create sober living chart of accounts:
  - Revenue: Resident Rent, Program Fees, Application Fees, Late Fees
  - Expenses: Maintenance, Utilities, Insurance, Mortgage/Lease, Staff Payroll, Supplies
  - Assets: Security Deposits Held
- Custom mapping UI for operators who already have QB accounts

### 3.3 — Automated Sync
- **Invoices:** When rent is due → create QB invoice automatically
- **Payments:** When payment recorded → mark QB invoice paid
- **Expenses:** Maintenance costs → QB expense entries
- **Deposits:** Security deposits → QB journal entries
- **Vendor Bills:** Vendor invoices → QB bills
- Sync status dashboard (last synced, errors, pending)
- Manual re-sync trigger for failed items
- Conflict resolution UI

### 3.4 — Financial Reports (Pulled from QB)
- P&L by house, by month, by quarter
- Balance sheet
- Cash flow statement
- AR aging report (synced with House Harmony's own AR)
- Tax-ready reports (Schedule E for rental income)
- Export to PDF/Excel

### Architecture
```
Backend: Supabase Edge Functions (Deno)
├── /functions/quickbooks-auth     — OAuth2 flow
├── /functions/quickbooks-sync     — Bi-directional sync
├── /functions/quickbooks-webhook  — Real-time updates from QB
└── /functions/quickbooks-reports  — Report generation

Tables:
qb_connections        — user_id, realm_id, access_token_encrypted, refresh_token_encrypted, expires_at
qb_sync_mappings      — entity_type, local_id, qb_id, last_synced
qb_sync_log           — id, entity_type, direction, status, error_message, timestamp
qb_account_mappings   — local_category, qb_account_id, qb_account_name
```

---

## Phase 4: Enhanced Maintenance & Ticketing System

**Why:** The current system handles basic requests. A real property management operation needs SLAs, preventive maintenance, cost tracking, and resident-facing submission.

### 4.1 — SLA Tracking
- Define SLA per priority (Emergency: 4hr, High: 24hr, Medium: 72hr, Low: 1 week)
- Visual SLA countdown on each ticket
- SLA breach alerts (email + in-app notification)
- SLA compliance reporting per house and per vendor

### 4.2 — Resident-Submitted Requests
- Residents submit via SoberNest companion app
- Photo/video attachment support (Supabase Storage)
- Status updates pushed to resident in real-time
- Resident satisfaction rating after completion

### 4.3 — Preventive Maintenance Scheduler
- Recurring task templates (HVAC filter: every 3 months, pest control: monthly, fire extinguisher: annual)
- Auto-generates tickets on schedule
- Compliance calendar view
- Overdue alerts

### 4.4 — Cost & Budget Tracking
- Actual cost recording per ticket (labor, parts, materials)
- Budget allocation per house per quarter
- Budget vs. actual variance reporting
- Cost-per-bed maintenance metric
- Vendor cost comparison over time

### 4.5 — Vendor Portal
- Vendor self-service login
- View assigned work orders
- Submit completion photos and invoices
- Accept/reject assignment
- Vendor performance scorecard (on-time completion, rating, cost)

### Database Tables
```
maintenance_sla_rules       — priority, response_hours, resolution_hours
maintenance_attachments     — request_id, file_url, uploaded_by, uploaded_at
maintenance_comments        — request_id, user_id, comment, created_at
preventive_schedules        — id, house_id, service_id, frequency, next_due, last_completed
maintenance_costs           — request_id, cost_type, amount, description
maintenance_budgets         — house_id, quarter, year, allocated, spent
vendor_portal_access        — vendor_id, user_id, login_enabled
vendor_ratings              — vendor_id, request_id, rating, feedback, rated_by
```

---

## Phase 5: Agentic AI System

**Why:** Sober living operators are stretched thin. AI agents that take real actions — not just answer questions — are the difference between one person managing 2 houses and one person managing 10.

### 5.1 — Intake Screening Agent
- **Trigger:** New lead comes in (web form, phone, referral)
- **Actions:**
  - Send automated welcome text/email
  - Ask screening questions via SMS/chat (sobriety date, sex offender check, medication list, employment status)
  - Score the lead based on answers (fit score)
  - Auto-advance qualified leads in pipeline
  - Flag disqualified leads with reason
  - Schedule tour/call for qualified leads
- **Tech:** Supabase Edge Function + Claude API + Twilio (SMS)

### 5.2 — Payment Collection Agent
- **Trigger:** Payment due date approaching or missed
- **Actions:**
  - Day -3: Send friendly reminder
  - Day 0: Send "payment due today" notification
  - Day +1: Send "payment overdue" with late fee warning
  - Day +3: Escalate to house manager
  - Day +7: Generate formal notice, flag for admin review
  - Track all communication history
- **Tech:** Supabase CRON + Edge Functions + Twilio/SendGrid

### 5.3 — Maintenance Triage & Dispatch Agent
- **Trigger:** New maintenance request submitted
- **Actions:**
  - Analyze request description and photos (vision model)
  - Auto-categorize service type
  - Set priority based on keywords/urgency detection
  - Auto-assign preferred vendor for that service/house
  - Send vendor notification with details
  - If no vendor available, escalate to admin
  - Generate cost estimate based on historical data
- **Tech:** Edge Function + Claude API (with vision) + notification system

### 5.4 — Compliance Monitoring Agent
- **Trigger:** Daily/weekly scheduled scan
- **Actions:**
  - Check drug test schedule compliance (are tests being done on time?)
  - Monitor curfew violations (if integrated with smart locks)
  - Track meeting attendance requirements
  - Flag residents falling behind on program milestones
  - Generate weekly compliance report for house managers
  - Alert on upcoming certification expirations (staff and facility)
- **Tech:** Supabase CRON + Edge Functions

### 5.5 — Occupancy Optimization Agent
- **Trigger:** Bed becomes available or occupancy drops below threshold
- **Actions:**
  - Analyze pipeline for ready-to-move-in leads
  - Suggest optimal bed assignments (consider compatibility, gender, program phase)
  - Calculate revenue impact of vacancy
  - Auto-reach-out to waitlisted leads
  - Recommend pricing adjustments based on demand
  - Project future occupancy based on lease end dates
- **Tech:** Edge Function + Claude API

### 5.6 — Report Generation Agent
- **Trigger:** Scheduled (weekly/monthly) or on-demand via chat
- **Actions:**
  - Generate investor-ready portfolio reports
  - Create house manager weekly summaries
  - Build grant application outcome reports
  - Produce compliance audit packages
  - Natural language query: "How did House #2 perform last quarter?" → generates analysis
- **Tech:** Edge Function + Claude API + PDF generation

### 5.7 — Smart Assistant (Chat Interface)
- In-app chat panel for operators
- Natural language commands:
  - "Show me residents with overdue payments"
  - "What's the occupancy for Oak Street house?"
  - "Schedule a pest control for all houses next week"
  - "Draft an incident report for Room 3B"
  - "Compare vendor costs for plumbing this quarter"
- Context-aware: knows your houses, residents, financials
- Can take actions with confirmation (create tickets, send notices, update records)
- **Tech:** Claude API with tool use, connected to Supabase via function calling

### Architecture
```
/supabase/functions/
├── ai-intake-agent/
├── ai-payment-agent/
├── ai-maintenance-agent/
├── ai-compliance-agent/
├── ai-occupancy-agent/
├── ai-report-agent/
└── ai-assistant/

Tables:
agent_actions_log     — agent_type, action_type, entity_id, input_json, output_json, status, created_at
agent_configurations  — agent_type, enabled, config_json (thresholds, schedules, templates)
agent_conversations   — id, user_id, agent_type, messages_json, created_at
ai_screening_results  — lead_id, fit_score, answers_json, flags, agent_recommendation
```

---

## Phase 6: What I'd Add (Operator Must-Haves)

### 6.1 — Drug Testing Tracker
- Schedule random and regular drug tests per resident
- Record results (pass, fail, dilute, refused)
- Auto-generate incident on failure
- Chain of custody documentation
- Testing frequency by program phase (Phase 1: 3x/week, Phase 2: 2x/week, etc.)
- Lab integration for electronic results (future)

```
drug_tests            — id, resident_id, test_date, test_type, result, administered_by, notes
drug_test_schedules   — resident_id, frequency, last_test, next_test
```

### 6.2 — Recovery Program Tracking
- Meeting attendance log (AA/NA/SMART Recovery)
- Required meetings per week by program phase
- Court-mandated requirement tracking
- Probation/parole officer contact info and check-in dates
- Community service hour tracking
- Employment search/verification tracking
- Therapist/counselor appointment tracking
- Program phase progression rules (auto-advance when criteria met)

```
meeting_attendance    — resident_id, meeting_type, meeting_date, verified, notes
court_requirements    — resident_id, requirement_type, frequency, officer_name, officer_phone, next_date
employment_records    — resident_id, employer, position, start_date, verified, hourly_rate
program_phase_rules   — phase_number, phase_name, min_days, required_meetings_per_week, required_tests_per_week, curfew_time
```

### 6.3 — Document Management & E-Signatures
- Lease/house agreement templates with variable fields
- Auto-generate lease from template + resident data
- E-signature integration (DocuSign or built-in)
- Document storage per resident (ID, insurance card, intake forms)
- Expiring document alerts (insurance, ID)
- Bulk document generation (all leases for a house)

```
document_templates    — id, name, category, template_content, variables_json
generated_documents   — id, template_id, resident_id, filled_content, signed_at, signature_url
resident_documents    — resident_id, doc_type, file_url, expires_at, uploaded_at
```

### 6.4 — Multi-Property Portfolio View
- Map view of all houses (Google Maps integration)
- Color-coded by performance (green: >90% occupied, yellow: 70-90%, red: <70%)
- Portfolio-level KPIs (total beds, occupancy, revenue, expenses)
- Drill-down from portfolio → house → room → bed
- Compare houses side-by-side
- Regional grouping for operators with houses in multiple cities

### 6.5 — Emergency Protocol System
- Emergency contact directory (per resident: family, sponsor, PO, therapist)
- One-tap emergency notification (send to all relevant contacts)
- Overdose response protocol (step-by-step with Narcan instructions)
- Incident escalation workflows (resident → house manager → admin → emergency services)
- Emergency supply tracking (Narcan inventory, first aid kits)
- Post-incident debrief templates

```
emergency_contacts    — resident_id, contact_name, relationship, phone, priority_order
emergency_protocols   — id, protocol_type, steps_json, last_reviewed, reviewed_by
emergency_supplies    — house_id, supply_type, quantity, expiration_date, location
emergency_events      — id, house_id, event_type, description, actions_taken, responders, timestamp
```

### 6.6 — Audit Trail & Compliance Engine
- Complete audit log of all actions (who did what, when)
- NARR (National Alliance for Recovery Residences) compliance checklist
- State/local licensing requirement tracker
- Fair Housing compliance documentation
- Inspection readiness dashboard
- Auto-generate compliance packages for audits
- Zoning compliance documentation

```
audit_log             — id, user_id, action, entity_type, entity_id, old_value, new_value, ip_address, timestamp
compliance_checklists — id, framework, checklist_items_json, house_id, status, last_reviewed
inspection_records    — house_id, inspector, inspection_date, result, findings_json, next_inspection
```

### 6.7 — Alumni Network & Aftercare
- Alumni directory (opt-in)
- Aftercare check-in scheduling (automated texts at 30, 60, 90, 180, 365 days)
- Alumni mentorship matching (pair alumni with current residents)
- Alumni events calendar
- Success story collection (for marketing and grant applications)
- Referral tracking from alumni

```
alumni_profiles       — resident_id, opt_in, sober_date, current_city, willing_to_mentor
alumni_checkins       — alumni_id, checkin_date, method, status, sobriety_confirmed, notes
mentorship_pairs      — alumni_id, resident_id, start_date, status
```

### 6.8 — Marketing & Lead Source Analytics
- Track where leads come from (Google, referral partners, alumni, courts, treatment centers)
- Cost per lead by source
- Conversion rate by source
- ROI per marketing channel
- Automated Google Business review requests (after positive stay)
- Website inquiry form integration
- Social media post scheduler (future)

```
marketing_channels    — id, name, type, monthly_cost, active
lead_attributions     — lead_id, channel_id, campaign_name, cost
marketing_metrics     — channel_id, month, leads, conversions, cost, revenue_attributed
```

### 6.9 — Staff Scheduling & Time Tracking
- House manager shift scheduling
- Overnight monitor scheduling
- Time clock (clock in/out from app)
- PTO tracking
- Payroll export (CSV for QB payroll or ADP integration)
- Coverage gap alerts

```
staff_schedules       — staff_id, house_id, shift_date, start_time, end_time, role
time_entries          — staff_id, clock_in, clock_out, house_id, break_minutes
pto_requests          — staff_id, start_date, end_date, type, status, approved_by
```

### 6.10 — Notification & Communication Hub
- Unified notification center (in-app, email, SMS, push)
- Notification preferences per user
- Broadcast messaging by house, by program phase, or all
- Template library for common communications
- Scheduled messages
- Read receipts and delivery tracking
- Integration with Twilio (SMS), SendGrid (email), Firebase (push)

```
notification_preferences — user_id, channel, category, enabled
notification_log         — id, recipient_id, channel, category, subject, body, status, sent_at
message_templates        — id, name, category, subject_template, body_template, variables
```

---

## Implementation Priority & Timeline

### Batch 1 — Foundation (Weeks 1-4)
> Build the data layer and core features that everything else depends on

| # | Feature | Rationale |
|---|---------|-----------|
| 1 | Audit Trail & Logging | Every action from this point forward gets logged |
| 2 | Role-Based Access Control | Needed before investor portal, vendor portal, staff features |
| 3 | Drug Testing Tracker | Core daily operation for every sober living |
| 4 | Recovery Program Tracking | Core daily operation, differentiates from a regular rooming house |
| 5 | Document Management | Leases, intake forms, compliance docs — needed everywhere |
| 6 | Emergency Protocols | Liability protection, required by most certifications |

### Batch 2 — Financial & Analytics (Weeks 5-8)
> Prove the business model works with numbers

| # | Feature | Rationale |
|---|---------|-----------|
| 7 | Expense Tracking | Need to know costs before ROI |
| 8 | ROI Analytics Dashboard | Core ask — prove this works to lenders |
| 9 | QuickBooks Integration | Real accounting, professional financial reports |
| 10 | Investor/Lender Portal | Give stakeholders their own login with the data they need |
| 11 | Financial Projections Engine | "What if I open another house?" |

### Batch 3 — Operations Scale (Weeks 9-12)
> Handle more houses with the same team size

| # | Feature | Rationale |
|---|---------|-----------|
| 12 | Enhanced Maintenance & SLAs | Property care = homeowner trust |
| 13 | Preventive Maintenance Scheduler | Proactive > reactive |
| 14 | Staff Training Module | Repeatable operations |
| 15 | Staff Scheduling | Coverage across multiple houses |
| 16 | Notification Hub | Unified comms backbone |
| 17 | Multi-Property Portfolio View | Operator bird's-eye view |

### Batch 4 — AI & Automation (Weeks 13-16)
> Force multiply the operator

| # | Feature | Rationale |
|---|---------|-----------|
| 18 | AI Intake Screening Agent | Handle leads 24/7 without staff |
| 19 | AI Payment Collection Agent | Consistent, tireless follow-up |
| 20 | AI Maintenance Triage Agent | Instant categorization and dispatch |
| 21 | AI Compliance Monitor | Catch gaps before auditors do |
| 22 | Smart Assistant (Chat) | Natural language control of the whole system |

### Batch 5 — Growth & Retention (Weeks 17-20)
> Grow the pipeline and track long-term outcomes

| # | Feature | Rationale |
|---|---------|-----------|
| 23 | Marketing & Lead Source Analytics | Know what's working, stop wasting money |
| 24 | Alumni Network & Aftercare | Outcomes data + referral pipeline |
| 25 | Outcome Tracking | Grant applications, marketing, mission proof |
| 26 | AI Occupancy Optimization | Fill beds faster, smarter |
| 27 | AI Report Generation | One-click investor and compliance reports |
| 28 | Vendor Portal | Self-service reduces admin overhead |

---

## Technical Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React/Vite)                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐ │
│  │ Operator  │ │ Investor │ │  Vendor  │ │   Staff    │ │
│  │Dashboard  │ │ Portal   │ │ Portal   │ │  Portal    │ │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └─────┬──────┘ │
│       │             │            │              │        │
│  ┌────┴─────────────┴────────────┴──────────────┴──┐    │
│  │           AI Chat Assistant Panel                │    │
│  └──────────────────────┬───────────────────────────┘    │
└─────────────────────────┼────────────────────────────────┘
                          │
┌─────────────────────────┼────────────────────────────────┐
│                   Supabase Platform                       │
│  ┌──────────────────────┴───────────────────────────┐    │
│  │              Supabase Edge Functions              │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────────────┐ │    │
│  │  │ AI Agents│ │ QB Sync  │ │ Notification Svc │ │    │
│  │  └──────────┘ └──────────┘ └──────────────────┘ │    │
│  └──────────────────────────────────────────────────┘    │
│                                                           │
│  ┌─────────────┐ ┌──────────┐ ┌────────────────────┐    │
│  │  PostgreSQL  │ │Supabase  │ │  Supabase Storage  │    │
│  │  (Database)  │ │  Auth    │ │  (Files/Photos)    │    │
│  └─────────────┘ └──────────┘ └────────────────────┘    │
│                                                           │
│  ┌─────────────────────────────────────────────────┐     │
│  │            Supabase Realtime                     │     │
│  │  (Live updates, presence, notifications)         │     │
│  └─────────────────────────────────────────────────┘     │
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

---

## Revenue Model / How This Pays for Itself

| Feature | Operator Value |
|---------|---------------|
| AI Intake Agent | Handle 3x more leads without hiring → fill beds faster → less vacancy loss |
| Payment Agent | Reduce AR days by 40-60% → improve cash flow |
| Maintenance SLAs | Prove property care to homeowners → secure more properties |
| ROI Dashboard | Close lender/investor deals with real data → fund expansion |
| QB Integration | Save 10+ hrs/month on bookkeeping → reduce accountant costs |
| Compliance Engine | Avoid fines, pass audits first time → protect licenses |
| Occupancy Agent | Reduce vacancy days by 30-50% → revenue gain of $500-1500/bed/year |
| Alumni Network | 20-30% of new residents come from alumni referrals → free acquisition |
| Staff Training | Reduce turnover, reduce liability incidents → lower insurance costs |

---

## Competitive Moat

Most sober living "software" is just a glorified spreadsheet or a general property management tool. This platform is purpose-built for recovery housing, which means:

1. **Drug testing built into the workflow** — not an afterthought
2. **Recovery program tracking** — this isn't just housing, it's structured recovery
3. **NARR compliance** — the industry standard that serious operators pursue
4. **Court/probation integration** — many residents are court-mandated
5. **Outcome tracking** — prove the mission to grantors and communities
6. **AI that understands sober living** — not generic property management AI
7. **Investor portal** — no other sober living tool has this
8. **Alumni pipeline** — the referral flywheel that keeps beds full

This isn't property management software with a sober living skin. This is a **sober living operating system**.
