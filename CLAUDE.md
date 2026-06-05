@AGENTS.md

# Sofia's on the Beach — Booking Platform

Production direct-booking platform for a beachfront pousada in Búzios, Brazil.

## Stack
- Next.js 16.x (App Router, Turbopack)
- TypeScript (strict)
- Tailwind CSS v4
- shadcn/ui (New York style, Neutral base, Radix primitives)
- Supabase (auth, database, storage)
- Asaas (payments: PIX and credit card — Phase 3)
- Resend + React Email (transactional email — Phase 3)

## Key Rules
- All UI text is in Portuguese (Brazilian)
- Mobile-first: every component must work on small screens
- Never expose SUPABASE_SERVICE_ROLE_KEY to the browser — use only in server files
- Admin routes: all under /dashboard, protected by src/proxy.ts (Next.js 16 renamed middleware → proxy)
- All database writes go through Server Actions or Route Handlers — never client-side
- Availability model: sparse blocked-date rows in room_availability (available = row absent)
- reservation_events must be created whenever reservation status changes
- minimum_stay_rules must be validated before any reservation is created
- WhatsApp is a primary channel, not optional — number comes from the settings table

## Folder Conventions
- src/components/ui/         — shadcn primitives only, never edit manually
- src/components/marketing/  — public website sections
- src/components/rooms/      — room display components
- src/components/booking/    — booking flow components
- src/components/admin/      — admin panel components
- src/components/shared/     — header, footer, WhatsApp button
- src/lib/supabase/          — supabase clients (client, server, admin)
- src/lib/asaas/             — Asaas API wrapper (Phase 3)
- src/lib/email/             — Resend + React Email templates (Phase 3)
- src/lib/validations/       — Zod schemas
- src/hooks/                 — React hooks
- src/types/                 — TypeScript types

## Supabase Client Usage
- Browser components → import from @/lib/supabase/client
- Server Components, Route Handlers, Server Actions → import from @/lib/supabase/server
- Webhooks, admin operations with elevated privileges → import from @/lib/supabase/admin

## Design Intent
- Beachfront luxury: white architecture, ocean blue accents, Mediterranean calm
- Premium but simple — no generic hotel templates
- The ocean view is the hero of the brand
- Sofia's brand colors override the shadcn neutral defaults (defined in Phase 1.2)
