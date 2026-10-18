---
last_mapped_commit: f2cb2a1d03cde0c6cdc105338394bcc1fed0bcff
last_mapped_at: 2026-10-18
---
# Testing Patterns

**Analysis Date:** 2026-10-18

## Test Framework

**Runner:**
- Vitest 5.0.5
- Config: `vitest.config.ts`
- Environment: JSDOM (`jsdom: 26.1.0`)

**Assertion Library:**
- Built-in Vitest assertions (`expect`)
- `@testing-library/jest-dom` 7.0.1 for DOM matchers

**Run Commands:**

```bash
npm test                # Run all tests once (vitest run)
npm test -- --watch    # Watch mode for active development
npm run typecheck       # Static type safety check (tsc --noEmit)
```

## Test File Organization

**Location:**
- Centralized test suite in `src/test/` directory

**Naming:**
- `*.test.ts` for logic, schemas, and catalog tests
- `*.test.tsx` for React component and route navigation tests

**Files Present:**
- `src/test/valuation.test.ts`: Condition evaluation business rules, deduction combinations, and calculation caps (67 tests)
- `src/test/pickup.test.ts`: Booking request schemas, slot bookability windows, and reference generators (6 tests)
- `src/test/catalog.test.ts`: Catalog lookup functions, pricing variant integrity (5 tests)
- `src/test/lead.test.ts`: Lead contact helpers and formatting (10 tests)
- `src/test/app-routing.test.tsx`: Route integration and outlet rendering (1 test)

## Test Structure

**Suite Pattern (`src/test/valuation.test.ts`):**

```typescript
import { describe, expect, it } from "vitest";
import { calculateValuation, emptyAnswers, type Answers } from "../lib/valuation";

const healthy = (): Answers => ({
  ...emptyAnswers(),
  basic: { calls: true, touch: true, original: true },
  box: true,
});

describe("Condition valuation business rules", () => {
  it("keeps a healthy device at base value", () => {
    expect(calculateValuation(30000, healthy())?.estimate).toBe(30000);
  });

  it("deducts 3% for one or two screen scratches", () => {
    const a = healthy();
    a.categories = ["screen"];
    a.physical.screenPhysical = "minor";
    expect(calculateValuation(30000, a)?.estimate).toBe(29100);
  });
});
```

## Mocking & Isolation

**Deterministic Pure Function Testing:**
- Domain calculations (`src/lib/valuation.ts`) are structured as pure functions without DOM or network side-effects, making testing fast (<15ms for 67 valuation tests).
- Server database mocks use Vitest spies when testing RPC handlers without modifying live database state.

## Test Coverage & Guarantees

- **Pricing Accuracy:** Verifies exact percentage caps (screen cap 35%, body cap 25%, functional cap 40%, overall floor 30%).
- **Anti-Collision Checks:** Verifies `makeReference()` format and slot validation window limits.
- **Catalog Integrity:** Ensures all brand and model slugs resolve to existing records without runtime throwing.

---

*Testing analysis: 2026-10-18*
