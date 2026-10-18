---
last_mapped_commit: f2cb2a1d03cde0c6cdc105338394bcc1fed0bcff
last_mapped_at: 2026-10-18
---
# Codebase Concerns

**Analysis Date:** 2026-10-18

## Tech Debt

**TanStack Start Server Function Validator Deprecation:**
- Issue: `src/lib/pickup.functions.ts` uses `.inputValidator()` on `createServerFn()`, which is deprecated in current TanStack Start versions in favor of `.validator()`.
- Files: `src/lib/pickup.functions.ts`
- Impact: Produces compiler/bundler warnings during development and build, though functioning correctly.
- Fix approach: Update `createServerFn().inputValidator(...)` to `createServerFn().validator(...)`.

**Static JSON Catalog Scale:**
- Issue: Phone specifications and buyback pricing are bundled in static JSON files (`sellPhoneCatalog.generated.json` and `dofyPriceCatalog.generated.json`).
- Files: `src/data/sellPhoneCatalog.generated.json`, `src/data/dofyPriceCatalog.generated.json`
- Impact: Model pricing adjustments require running Python scripts (`scripts/apply_price_markup.py` or re-generating) and redeploying code rather than updating through an admin panel.
- Fix approach: Transition catalog and pricing storage to Supabase database tables with an admin editing interface in a future milestone.

## Known Gaps

**Live OTP Phone Verification Deferred:**
- Symptoms: Phone verification status is persisted as `"unverified"` for all bookings.
- Files: `src/lib/pickup.ts`, `src/lib/pickup.functions.ts`
- Trigger: No third-party SMS OTP provider (e.g., Twilio, MSG91) has been connected yet.
- Mitigation: Store staff perform manual phone confirmation when reviewing bookings in the admin dashboard.

**Admin Query Pagination Limit:**
- Symptoms: Admin dashboard loads up to 500 pickup requests in a single query.
- Files: `src/lib/pickup.functions.ts` (`getPickupRequests`)
- Impact: In high-volume operations, loading could become slow as request count grows.
- Fix approach: Add cursor or offset pagination to `getPickupRequests`.

## Security Considerations

**Admin Role Verification:**
- Risk: Unauthorized access to customer pickup requests, customer phone numbers, and addresses.
- Files: `src/routes/_authenticated/admin.tsx`, `src/integrations/supabase/auth-middleware.ts`, `src/lib/pickup.functions.ts`
- Current mitigation: Double-checked both client-side and server-side using Supabase `has_role(auth.uid(), 'admin')`. Public signup is disabled; only users provisioned via secure admin invitations can access admin routes.
- Recommendations: Maintain strict audit logging of admin status updates and exports.

**Service Role Key Isolation:**
- Risk: Accidental leakage of elevated `SUPABASE_SERVICE_ROLE_KEY` to client browser bundles.
- Files: `src/integrations/supabase/client.server.ts`
- Current mitigation: Server client is strictly separated into `client.server.ts` and forbidden from client imports by ESLint rule `no-restricted-imports`.

## Fragile Areas

**Valuation and Server Recomputation Parity:**
- Files: `src/lib/valuation.ts`, `src/lib/pickup.functions.ts`
- Why fragile: If assessment questions or deduction calculations in `valuation.ts` are updated without updating the server-side validator, pickup requests might fail validation or compute unexpected prices.
- Safe modification: Run `npm test` (`src/test/valuation.test.ts` and `src/test/pickup.test.ts`) whenever altering condition deductions.

## Dependencies at Risk

**Recharts 2.15.4:**
- Risk: Recharts v1/v2 maintenance is discontinued; deprecated warnings occur during dependency resolution.
- Impact: Eventual compatibility friction with future React 19 updates.
- Migration plan: Upgrade to Recharts v3 once stable release aligns with project charting requirements.

---

*Concerns audit: 2026-10-18*
