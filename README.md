# House Harmony - Sober Living Operations

Admin/operator dashboard for sober living businesses. Resident management, intake pipeline, CRM, billing, maintenance, chore assignment, compliance tracking, and training platform.

## Stack

- React 18 + TypeScript + Vite
- Tailwind CSS + shadcn/ui
- Supabase (Auth, PostgreSQL, Realtime, Storage)
- React Router, React Query, Zod

## Getting Started

```bash
npm install
npm run dev
```

Runs at http://localhost:8081

## Environment Variables

Create a `.env` file:

```
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-anon-key
```

## Companion App

This app works alongside [SoberNest](https://github.com/Brian2169fdsa/sober-nest-app) (resident portal). Both share the same Supabase backend.
