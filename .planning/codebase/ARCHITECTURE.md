---
last_mapped_commit: f2cb2a1d03cde0c6cdc105338394bcc1fed0bcff
last_mapped_at: 2026-10-18
---
# System Architecture

**Analysis Date:** 2026-10-18

## Architectural Pattern

**Full-Stack Type-Safe SSR Application:**
The application is built on **TanStack Start** and **TanStack Router**, implementing an edge-ready, server-rendered React architecture. Client navigation uses type-safe route trees generated ahead-of-time (`src/routeTree.gen.ts`). Sensitive operations (valuation recalculation, database persistence, admin queries) execute within server functions (`createServerFn`) powered by the Nitro server engine.

```
┌────────────────────────────────────────────────────────┐
│                   Browser Client                       │
│  (React 19 + TanStack Router + Tailwind v4 + Radix)    │
└───────────────────────────┬────────────────────────────┘
                            │
               Client/Server RPC Boundary
         (TanStack Start `createServerFn`)
                            │
┌───────────────────────────▼────────────────────────────┐
│                    Nitro Server                        │
│   ┌────────────────────────────────────────────────┐   │
│   │   `src/lib/pickup.functions.ts`                │   │
│   │   • Exact Catalog Lookup & Valuation Verify    │   │
│   │   • Slot & Schema Validation (Zod)             │   │
│   │   • Supabase Auth & Role Verification          │   │
│   └───────────────────────┬────────────────────────┘   │
└───────────────────────────┼────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│                  External Database                     │
│         Supabase PostgreSQL (RLS Protected)            │
│       • `pickup_requests`    • `user_roles`            │
└────────────────────────────────────────────────────────┘
```

## Layers

**1. Routing & Presentation (`src/routes/`):**
- Defined using TanStack Router file-based route conventions.
- Static and parameterized dynamic routes (`sell-phone.$brand.$model.$variant.tsx`).
- Protected routes grouped under `_authenticated/` with automatic redirection to `/auth`.

**2. Domain Logic & Calculations (`src/lib/`):**
- `valuation.ts`: Pure functional condition evaluation, deduction percentages, and pricing caps. Completely isolated from UI components for independent testability.
- `pickup.ts`: Domain schemas, reference code generation (`makeReference`), time slot validation (`isBookableSlot`), and status constants.

**3. Server Functions & API Boundary (`src/lib/pickup.functions.ts`):**
- Server-side RPC methods created with `createServerFn`.
- Recomputes valuations using catalog base prices before persisting to prevent client manipulation.
- Implements idempotent inserts with `submission_key` preventing duplicate bookings on network retries.

**4. Data Catalog & Lookup (`src/data/`):**
- Static catalog data embedded in `sellPhoneCatalog.generated.json` and `dofyPriceCatalog.generated.json`.
- Typed accessors in `sellPhoneCatalog.ts` and `sellPhonePricing.ts` guaranteeing deterministic pricing without database roundtrips.

**5. Integration & Auth Middleware (`src/integrations/supabase/`):**
- Server and client Supabase instances with role-checking helpers (`has_role`).

## Key Abstractions

**Valuation Engine (`src/lib/valuation.ts`):**
- Purpose: Computes dynamic quote values based on functional checks (touch, display, body, cameras, etc.).
- Pattern: Immutable reducer computing exact percentages and caps.

**Brand Logo Renderer (`src/components/public/BrandLogo.tsx`):**
- Purpose: Single canonical business logo component enforcing uniform branding across header, footer, auth, and admin interfaces.
- Pattern: Direct local asset import with static root fallback.

**Protected RPC Gateway (`src/lib/pickup.functions.ts`):**
- Purpose: Gate admin-level actions behind session verification and DB role checks (`has_role`).

## Entry Points

**Web Entry (SSR / Client):**
- `src/routes/__root.tsx`: Root shell rendering HTML skeleton, SEO metadata, fonts, and favicon links.
- `src/routeTree.gen.ts`: Generated TanStack route tree registering all routes.

**Server Entry:**
- Configured via `@lovable.dev/vite-tanstack-config` with Nitro entry `"server"`.

## Architectural Constraints

- **Exact Pricing Lookup:** Prices must always resolve from static catalog files, preventing similar-model price substitutions.
- **Server-Side Recomputation:** Client estimate values are never trusted directly; `createPickupRequest` must recompute using exact catalog prices.
- **No Public Signup:** User creation is restricted to invitation-only administrator provisioning; first user gains admin via database trigger.
- **Brand Consistency:** Browser icons and website logos must derive strictly from the primary source asset to avoid branding drift.

---

*Architecture analysis: 2026-10-18*
