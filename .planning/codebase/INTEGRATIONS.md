---
last_mapped_commit: f2cb2a1d03cde0c6cdc105338394bcc1fed0bcff
last_mapped_at: 2026-10-18
---
# External Integrations

**Analysis Date:** 2026-10-18

## Databases

**PostgreSQL (via Supabase / Drizzle):**
- Schema definitions: `drizzle/schema.ts`
- Migrations: `drizzle/migrations/`
- Runtime connection: Supabase Data API & PostgreSQL client (`postgres: ^3.4.9`)
- Key tables:
  - `pickup_requests` - Customer pickup requests with valuation snapshots, addresses, time slots, and status
  - `user_roles` - Role-based authorization (`admin` role assigned to verified administrators via DB trigger)

## Authentication

**Supabase Auth:**
- Client integration: `src/integrations/supabase/client.ts`
- Server-side admin client: `src/integrations/supabase/client.server.ts`
- Auth middleware: `src/integrations/supabase/auth-middleware.ts` (`requireSupabaseAuth`)
- Brokered preview auth: `src/integrations/supabase/previewAuthStorage.ts` for preview sessions
- Route protection: `src/routes/_authenticated/admin.tsx` (enforces session and server-checked `admin` role in `user_roles`)
- Staff accounts: Secure invitations only; public signup is disabled in hosted auth configuration

## External APIs & Services

**Supabase Platform:**
- Base URLs: `VITE_SUPABASE_URL` / `SUPABASE_URL`
- Publishable key: `VITE_SUPABASE_PUBLISHABLE_KEY` / `SUPABASE_PUBLISHABLE_KEY`
- Service role key: `SUPABASE_SERVICE_ROLE_KEY` (server-side only, used in `src/integrations/supabase/client.server.ts` for elevated admin writes and pickup inserts)

**Maps & Navigation:**
- Google Maps store location link: `https://maps.app.goo.gl/F44EijMUeiuE4ACn7` (Toli Chowki store in `src/lib/shop.ts`)

**Direct Communications:**
- Direct phone dialer: `tel:09000464640` (`SHOP_PHONE` in `src/lib/shop.ts`)
- Instagram: `@usedmobile.in` (`SHOP_INSTAGRAM` in `src/lib/shop.ts`)
- Note: Customer WhatsApp links and automated handoff logic were intentionally deprecated and removed per project guidelines

## Webhooks & Server Functions

**Server Functions (`createServerFn`):**
- Defined in `src/lib/pickup.functions.ts`:
  - `createPickupRequest` - Public endpoint with idempotency via `submission_key`, server-side valuation recalculation, and duplicate prevention
  - `getPickupRequests` - Admin protected endpoint to query requests with search and status filtering
  - `updatePickupRequest` - Admin protected endpoint to update status, assigned staff, notes, or rescheduled slots

---

*Integration analysis: 2026-10-18*
