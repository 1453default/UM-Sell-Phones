---
last_mapped_commit: f2cb2a1d03cde0c6cdc105338394bcc1fed0bcff
last_mapped_at: 2026-10-18
---
# Coding Conventions

**Analysis Date:** 2026-10-18

## Naming Patterns

**Files:**
- React components: PascalCase (e.g., `BrandLogo.tsx`, `DeviceAssessment.tsx`, `PickupForm.tsx`)
- TanStack Route files: Dot-separated path convention with `$` for parameters (e.g., `sell-phone.$brand.$model.$variant.tsx`, `__root.tsx`)
- Server files: `*.functions.ts` or `*.server.ts` (e.g., `pickup.functions.ts`, `client.server.ts`)
- Tests: `*.test.ts` or `*.test.tsx` (e.g., `valuation.test.ts`, `pickup.test.ts`)
- Pure libraries/utilities: camelCase (e.g., `valuation.ts`, `pickup.ts`, `shop.ts`)

**Functions:**
- camelCase (e.g., `calculateValuation`, `createPickupRequest`, `isBookableSlot`, `getSellBrand`)

**Variables & Constants:**
- Local variables / properties: camelCase (e.g., `displayedEstimate`, `submissionKey`)
- Global configuration / constants: UPPER_SNAKE_CASE (e.g., `SHOP_PHONE`, `REQUEST_STATUSES`, `BASIC`)

**Types & Interfaces:**
- PascalCase (e.g., `Answers`, `PickupSchema`, `ValuationResult`, `Brand`)

## Code Style

**Formatting:**
- Prettier 3.9.10 configured via `.prettierrc`
- `printWidth: 100`
- `semi: true`
- `singleQuote: false` (double quotes preferred)
- `trailingComma: "all"`

**Linting:**
- ESLint 9 (`eslint.config.js`) flat configuration
- Extends `js.configs.recommended` and `tseslint.configs.recommended`
- React Hooks rules enforced (`react-hooks/recommended`)
- Server imports restricted: `no-restricted-imports` forbids Next.js `server-only`, requiring TanStack Start conventions (`*.server.ts` or `@tanstack/react-start/server-only`)

## Import Organization

**Order:**
1. External framework / library imports (`react`, `@tanstack/*`, `zod`, `lucide-react`)
2. Internal alias imports (`@/components/*`, `@/integrations/*`, `@/lib/*`, `@/data/*`)
3. Relative imports (`./valuation`, `./pickup`)
4. Type-only imports (`type { Answers }`, `type { Database }`)

**Path Aliases:**
- `@/*` mapped to `./src/*` in `tsconfig.json` and `vite.config.ts`

## Error Handling

**Server Functions:**
- Zod safe parsing (`pickupSchema.safeParse(input)`) returning `{ ok: false, error: "..." }` objects
- Try-catch around Supabase queries returning clean user-facing error messages without leaking database errors to client
- Retry lookup handling on Postgres unique constraint violations (code `"23505"`)

**Client UI:**
- Sonner toasts for validation errors and success confirmations
- Form field validation errors displayed inline with accessible error text

## Comments & Documentation

- Explanatory comments preserved on business rules (e.g., why estimates are recomputed on server, why 30% floor is maintained in `valuation.ts`)
- Architecture and security invariants documented in `AGENTS.md`

---

*Convention analysis: 2026-10-18*
