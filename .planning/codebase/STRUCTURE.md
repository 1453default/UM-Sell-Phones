---
last_mapped_commit: f2cb2a1d03cde0c6cdc105338394bcc1fed0bcff
last_mapped_at: 2026-10-18
---
# Codebase Structure

**Analysis Date:** 2026-10-18

## Directory Layout

```
UM-Sell-Phones/
├── .agents/                    # GSD workflows, skills, and agent tool definitions
├── .planning/                  # Project planning and codebase intelligence maps
├── drizzle/                    # Drizzle ORM PostgreSQL schema and migrations
├── public/                     # Static root assets (icons, brand logos, robots.txt)
├── scripts/                    # Python maintenance scripts (catalog audit, sync, verification)
├── src/
│   ├── assets/                 # Bundled static media (store photos, brand logos)
│   ├── components/             # Reusable UI component modules
│   │   ├── public/             # Public layout components (Header, Footer, BrandLogo, Tagline)
│   │   ├── sell/               # Phone assessment questions and pickup booking form
│   │   └── ui/                 # Accessible Radix / shadcn UI primitive components
│   ├── data/                   # Static device catalogs and pricing lookups
│   ├── integrations/           # External service clients (Supabase auth & database)
│   │   └── supabase/           # Client, server admin client, middleware, storage
│   ├── lib/                    # Domain logic (valuation calculation, pickup schemas, utils)
│   ├── routes/                 # TanStack file-based routing tree
│   │   ├── _authenticated/     # Protected administrator dashboard routes
│   │   └── sell-phone/         # Nested brand/model/variant selling flow
│   ├── test/                   # Vitest unit and integration test suites
│   ├── styles.css              # Tailwind v4 theme configuration and design system
│   └── routeTree.gen.ts        # Auto-generated TanStack router tree
├── components.json             # shadcn/ui configuration
├── drizzle.config.ts           # Drizzle migration configuration
├── eslint.config.js            # ESLint flat config
├── package.json                # Project dependencies and npm scripts
├── tsconfig.json               # TypeScript compiler options and aliases
├── vite.config.ts              # Vite + TanStack Start configuration
└── vitest.config.ts            # Vitest testing environment configuration
```

## Directory Purposes

**`src/routes/`:**
- Purpose: Application routing and page views using TanStack file routes
- Key files:
  - `__root.tsx`: Document shell and global links
  - `index.tsx`: Homepage with store overview and top brands
  - `sell-phone.index.tsx`: Complete list of 22 supported phone brands
  - `sell-phone.$brand.$model.$variant.tsx`: Specific variant condition assessment and quote display
  - `_authenticated/admin.tsx`: Protected management dashboard for pickup requests

**`src/lib/`:**
- Purpose: Core pure business logic and helper functions
- Key files:
  - `valuation.ts`: Device condition questions, deduction calculations, and estimate boundaries
  - `pickup.ts`: Zod schemas for booking requests, slot availability rules, reference generation
  - `pickup.functions.ts`: Full-stack server functions (`createServerFn`) for booking creation and management

**`src/components/`:**
- Purpose: React UI components divided by domain
- Key files:
  - `public/BrandLogo.tsx`: Canonical brand logo with high-res source asset and fallback
  - `public/PublicLayout.tsx`: Site-wide header, footer, navigation bar, and contact actions
  - `sell/DeviceAssessment.tsx`: Multi-step functional assessment questionnaire
  - `sell/PickupForm.tsx`: Booking form with date/slot selection and validation

**`src/data/`:**
- Purpose: Static data sources for instant pricing and model metadata
- Key files:
  - `sellPhoneCatalog.generated.json`: All brands, series, models, specifications, and icon paths
  - `dofyPriceCatalog.generated.json`: Base buyback prices per variant
  - `sellPhoneCatalog.ts`: Catalog lookup functions (`getSellBrand`, `getSellModel`, `SELL_BRANDS`)
  - `sellPhonePricing.ts`: Pricing variant lookups

**`src/test/`:**
- Purpose: Comprehensive automated test coverage
- Key files:
  - `valuation.test.ts`: Condition evaluation and edge-case price calculations (67 tests)
  - `pickup.test.ts`: Schema parsing and slot booking rules
  - `catalog.test.ts`: Integrity of device and pricing lookups
  - `lead.test.ts`: Customer lead contact helpers

## Key File Locations

**Configuration:**
- `package.json`: Dependency manifests and build scripts
- `tsconfig.json`: TypeScript `@/*` path mapping
- `vite.config.ts`: TanStack Start entry and server fs access
- `src/styles.css`: Tailwind v4 `@theme inline` design tokens

**Assets:**
- `src/assets/used-mobile-logo.png`: High-resolution master logo asset
- `public/favicon.png`: 64×64 browser tab icon
- `public/apple-touch-icon.png`: 180×180 mobile touch icon

## Where to Add New Code

**Adding a New Route / Page:**
- File: `src/routes/[route-path].tsx`
- Regenerates: `src/routeTree.gen.ts`

**Modifying Device Valuation Logic:**
- File: `src/lib/valuation.ts`
- Tests: `src/test/valuation.test.ts`

**Adding UI Primitives:**
- File: `src/components/ui/[component-name].tsx`

**Updating Store Metadata (Phone, Address, Hours):**
- File: `src/lib/shop.ts`

---

*Structure analysis: 2026-10-18*
