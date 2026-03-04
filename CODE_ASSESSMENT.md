# House Harmony Desk — Full Code Assessment

**Date:** 2026-03-04
**Stack:** React 18 + TypeScript + Vite + Supabase (PostgreSQL + Auth + Storage)

---

## VERDICT SUMMARY

| Category | Count |
|----------|-------|
| Pages with real Supabase backend | **42** |
| Pages with mock/hardcoded data | **0** |
| Feature-gated (built but hidden) | **13** |
| SQL migration files | **19** |
| RLS policies defined | **~152** |
| Automated tests | **0** |
| TODO/FIXME/HACK comments | **0** |

**Bottom line:** The frontend is almost entirely real — every page queries Supabase via TanStack Query. There are zero mock data arrays or faker libraries. However, several important production concerns remain unfinished.

---

## WHAT'S REAL (Production-Ready)

### Backend / Database
- **Supabase PostgreSQL** with 19 migration files covering 40+ tables
- **Row Level Security** — ~152 RLS policy statements across all migrations
- **Supabase Auth** — email/password login, session management, auto-refresh tokens
- **Supabase Storage** — two buckets (`resident-documents`, `maintenance-attachments`)
- **Role-based access** — `staff_profiles` table with roles: owner, regional_manager, house_manager, staff, investor
- **Audit logging** — `audit_log` table with `logAudit()` utility (`src/lib/audit.ts`)

### Frontend Data Layer
- **Every single page** uses `useQuery` / `useMutation` from TanStack Query against live Supabase
- **Zero mock data** — no hardcoded arrays, no faker, no placeholder JSON
- **Proper error handling** — try/catch with toast notifications on all mutations
- **Form validation** — React Hook Form + Zod across all forms
- **File uploads** — real Supabase Storage integration for documents and maintenance attachments

### Core Feature Pages (Always Visible)

| Page | File | Status |
|------|------|--------|
| Dashboard/Overview | `Overview.tsx` | Full KPIs, activity feed, occupancy, AR aging — all from DB |
| Houses | `Houses.tsx` | CRUD with bed count joins |
| House Detail | `HouseDetail.tsx` | Room/bed management, resident assignment |
| Residents | `Residents.tsx` | CRUD, document uploads, bed assignments |
| Payments | `Payments.tsx` | Invoice management, payment recording, AR tracking |
| Notices | `Notices.tsx` | Create/send notices |
| Messages | `Messages.tsx` | Thread-based messaging |
| Chores | `Chores.tsx` | Task management with frequency tracking |
| Incidents | `Incidents.tsx` | Severity-based incident logging |
| Resources | `Resources.tsx` | Curated resource library |
| Staff | `Staff.tsx` | Staff profiles, invitations, role management |
| Drug Tests | `DrugTests.tsx` | Scheduling and result tracking |
| Recovery | `Recovery.tsx` | Meeting attendance, court requirements, employment |
| Emergency | `Emergency.tsx` | Contacts, supplies, protocols, event logging |
| Accreditation | `Accreditation.tsx` | NARR/ADHS/CARF license tracking with renewals |
| Community Engagement | `CommunityEngagement.tsx` | Neighbor outreach, complaints, FHA compliance |
| Settings | `Settings.tsx` | App settings + feature flag toggles |

### Feature-Gated Pages (Built, Behind localStorage Flags)

| Page | Flag | Status |
|------|------|--------|
| Intake Pipeline | `ENABLE_INTAKE` | Full lead-to-resident funnel |
| CRM | `ENABLE_CRM` | Contacts, organizations, activities |
| CRM Contact Detail | `ENABLE_CRM` | Individual contact view |
| CRM Referrals | `ENABLE_CRM` | Referral pipeline |
| Maintenance | `ENABLE_MAINTENANCE` | Requests, vendor matching, attachments |
| Documents | `ENABLE_DOCUMENT_TEMPLATES` | Template library |
| Document Generate | `ENABLE_DOCUMENT_TEMPLATES` | Variable substitution + save |
| Checklists | `ENABLE_CHECKLISTS` | Template-based checklists with audit log |
| Checklist Detail | `ENABLE_CHECKLISTS` | Item-level progress + attachments |
| Training Hub / Admin | `ENABLE_LMS` | Course enrollment, progress, lesson management |
| Analytics | `ENABLE_ANALYTICS` | 12-month trends, occupancy, revenue |
| Projections | `ENABLE_ANALYTICS` | SLH vs BHRF cost modeling |
| Investor Portal | `ENABLE_INVESTOR_PORTAL` | P&L, cap rates, cash-on-cash |
| QuickBooks | `ENABLE_QUICKBOOKS` | Account mapping, sync logs |
| Startup Wizard | `ENABLE_STARTUP_WIZARD` | 10-phase guided setup |
| Expenses | *(always on)* | Category-based expense tracking |

---

## WHAT'S MOCKED / PLACEHOLDER

The codebase has **no mock data layer**. However, these items are placeholders:

### 1. Property Valuation Estimate — `InvestorPortal.tsx`
```ts
const estimatedPropertyValue = filteredHouses.length * 200000;
```
Hardcoded $200k/house for cap rate calculation. Should come from DB or user input.

### 2. QuickBooks OAuth Flow — `QuickBooks.tsx`
The "Connect" button has a comment: `"In production, redirect to QB OAuth"`. The actual OAuth redirect URL + token exchange is not implemented. Requires a Supabase Edge Function or backend server.

### 3. PDF Export — `InvestorPortal.tsx`
Uses `window.print()` instead of proper PDF generation (jsPDF, react-pdf, etc.)

### 4. Feature Flags — `FeatureGate.tsx`
Stored in `localStorage`, not in the database. Per-browser, not per-organization.

### 5. Service Key in Source — `scripts/setup-db.mjs:24`
The Supabase **service_role** key is hardcoded in the setup script. **Security issue** — service keys should never be in source control.

---

## WHAT NEEDS TO BE FINISHED

### Critical (Security / Functionality)

| # | Item | Details |
|---|------|---------|
| 1 | **Remove hardcoded service key** | `scripts/setup-db.mjs:24` — service_role key bypasses all RLS. Move to env var. |
| 2 | **QuickBooks OAuth backend** | Need Edge Function for OAuth redirect, token exchange, refresh token storage, periodic sync. |
| 3 | **Email / transactional notifications** | No email sending anywhere. Needed for: intake leads, payment reminders, incident alerts, staff invitations. `Staff.tsx` inserts into `staff_invitations` but never sends an email. |
| 4 | **Realtime subscriptions** | Supabase Realtime is configured in the client but **not used**. Messages, maintenance, and dashboard should have live updates. |

### Important (Production Readiness)

| # | Item | Details |
|---|------|---------|
| 5 | **Automated tests** | Zero test files, no vitest/jest config, no testing libs in package.json. Critical paths (auth, payments, residents) have zero coverage. |
| 6 | **Error boundaries** | No React error boundaries — uncaught errors crash the entire app. |
| 7 | **XSS in LessonViewer** | `LessonViewer.tsx:21-41` uses `dangerouslySetInnerHTML` with a custom markdown parser that doesn't sanitize. Use react-markdown or DOMPurify. |
| 8 | **Data editing / updates** | Many pages only support **create**, not **edit** or **delete**. Houses, Residents, Incidents, CRM contacts, Resources, Chores — all create-only. |
| 9 | **Pagination** | No pagination on any list page — all queries fetch everything. Will break at scale. |
| 10 | **Loading/empty states** | Most pages have loading spinners but poor empty states. No skeleton loaders. |
| 11 | **Search** | Global search is basic client-side text matching. No server-side search. |
| 12 | **Mobile responsiveness** | `use-mobile.tsx` hook exists but complex pages (Analytics, Projections) may not render well on mobile. |

### Nice to Have (Post-MVP)

| # | Item |
|---|------|
| 13 | Proper PDF generation (replace `window.print()`) |
| 14 | Feature flags in database (per-organization, not per-browser) |
| 15 | Offline support / service worker |
| 16 | i18n / localization |
| 17 | Accessibility audit (ARIA labels beyond shadcn defaults) |
| 18 | Client-side rate limiting on mutations |
| 19 | CSV/Excel data export |
| 20 | Bulk operations (multi-select batch actions) |
| 21 | Confirmation dialogs / undo on delete operations |

---

## Architecture Quality

### Strengths
- Clean, consistent code style across 42 pages
- Zero TODO/FIXME comments — codebase is intentional
- Proper TypeScript types generated from Supabase schema (1961-line type file)
- React Query for all data fetching with proper cache invalidation
- Feature flags for phased rollout — good product thinking
- 19 SQL migrations with ~152 RLS policies — proper database security
- Role-based access control — real implementation, not just UI
- Audit logging infrastructure in place

### Weaknesses
- **Monolithic page components** — most pages are 300-700 LOC with no sub-component extraction
- **No shared data hooks** — each page writes inline `useQuery` instead of reusable hooks like `useHouses()`, `useResidents()`
- **No API layer abstraction** — Supabase calls scattered across every page
- **No shared form components** — similar forms duplicated across pages
- **console.error in production** — `NotFound.tsx` logs 404s to browser console

---

## File Inventory

| Directory | Files | Purpose |
|-----------|-------|---------|
| `src/pages/` | 42 | Page components |
| `src/components/ui/` | 53 | shadcn/ui primitives |
| `src/components/layout/` | 2 | MainLayout, AppSidebar |
| `src/components/` | 3 | FeatureGate, RoleGuard, NewRequestDialog |
| `src/contexts/` | 1 | UserRoleContext |
| `src/hooks/` | 4 | useUserRole, useDebounce, useMobile, useToast |
| `src/integrations/supabase/` | 2 | Client + Types |
| `src/lib/` | 3 | utils, audit, policyTemplates |
| `supabase/migrations/` | 19 | SQL schema + RLS + seed data |
| `scripts/` | 2 | DB setup + migration runner |
