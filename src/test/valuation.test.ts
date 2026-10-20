import { describe, expect, it } from "vitest";
import {
  BASIC,
  CAPS,
  FAULTS,
  QUESTIONS,
  calculateValuation,
  emptyAnswers,
  assessmentComplete,
  toggleFault,
  type Answers,
} from "../lib/valuation";
import { getVariant } from "@/data/sellPhonePricing";
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
  it("caps cracked screen and display defects at 35%", () => {
    const a = healthy();
    a.categories = ["screen", "display"];
    a.physical = {
      screenPhysical: "cracked",
      spots: "large",
      lines: "visible",
      discoloration: "major",
    };
    expect(calculateValuation(30000, a)?.buckets.screen).toBe(35);
    expect(calculateValuation(30000, a)?.estimate).toBe(19500);
  });
  it("accumulates independent functional faults up to 40%", () => {
    const a = healthy();
    a.faults = ["frontCamera", "backCamera", "charging", "speaker"];
    expect(calculateValuation(30000, a)?.buckets.functional).toBe(40);
    expect(calculateValuation(30000, a)?.estimate).toBe(18000);
  });
  it("does not double deduct touch and finger-touch failures", () => {
    const a = healthy();
    a.basic.touch = false;
    a.faults = ["fingerTouch"];
    expect(calculateValuation(30000, a)?.percent).toBe(25);
  });
  it("caps maximum defects at 70% with a 30% raw floor", () => {
    const a = healthy();
    a.basic = { calls: false, touch: false, original: false };
    a.categories = ["screen", "display", "body", "panel"];
    a.physical = {
      screenPhysical: "cracked",
      spots: "large",
      lines: "visible",
      discoloration: "major",
      bodyScratches: "many",
      dents: "major",
      panel: "missing",
      shape: "bent",
    };
    a.faults = FAULTS.map((f) => f.id);
    a.box = false;
    const result = calculateValuation(30000, a);
    expect(result?.percent).toBe(70);
    expect(result?.estimate).toBe(9000);
    expect(result?.buckets).toEqual({
      basic: 45,
      screen: 35,
      body: 30,
      functional: 40,
      accessories: 2,
    });
  });
  it.each([null, undefined, NaN, 0, -10, Infinity])(
    "rejects missing or invalid base price %s",
    (base) => {
      expect(calculateValuation(base, healthy())).toBeNull();
    },
  );
  it("ignores category selection without detailed defects", () => {
    const a = healthy();
    a.categories = ["screen"];
    expect(calculateValuation(30000, a)?.deduction).toBe(0);
  });
  it("ignores retained answers for deselected categories", () => {
    const a = healthy();
    a.physical = { screenPhysical: "cracked" };
    expect(calculateValuation(30000, a)?.estimate).toBe(30000);
  });
  it("original box never earns a bonus; missing box deducts 2%", () => {
    const a = healthy();
    expect(calculateValuation(30000, a)?.estimate).toBe(30000);
    a.box = false;
    expect(calculateValuation(30000, a)?.estimate).toBe(29400);
  });
  it("rounds only final display to nearest ₹100", () => {
    const a = healthy();
    a.box = false;
    const result = calculateValuation(12345, a);
    expect(result?.base).toBe(12345);
    expect(result?.deduction).toBe(246.9);
    expect(result?.estimate).toBe(12098.1);
    expect(result?.displayedEstimate).toBe(12100);
  });
  it("keeps the rounded display at or below the exact variant ceiling", () => {
    const a = healthy();
    expect(calculateValuation(25760, a)?.displayedEstimate).toBe(25760);
    a.categories = ["body"];
    a.physical = { bodyScratches: "minor" };
    expect(calculateValuation(25760, a)?.displayedEstimate).toBe(25000);
  });
  it("battery selections are exclusive and malformed overlap uses larger deduction", () => {
    expect(toggleFault(["batteryLow"], "batteryMid")).toEqual(["batteryMid"]);
    const a = healthy();
    a.faults = ["batteryLow", "batteryMid"];
    expect(calculateValuation(30000, a)?.percent).toBe(10);
  });
  it("requires only relevant physical answers", () => {
    const a = healthy();
    expect(assessmentComplete(a)).toBe(true);
    a.categories = ["body"];
    expect(assessmentComplete(a)).toBe(false);
    a.physical = { bodyScratches: "none", dents: "none" };
    expect(assessmentComplete(a)).toBe(true);
  });
  for (const q of BASIC)
    it(`applies ${q.percent}% for ${q.id} failure`, () => {
      const a = healthy();
      a.basic[q.id] = false;
      expect(calculateValuation(30000, a)?.percent).toBe(q.percent);
    });
  const physicalExpected: Record<string, number[]> = {
    screenPhysical: [20, 12, 7, 3, 0],
    spots: [18, 12, 6, 0],
    lines: [15, 10, 0],
    discoloration: [15, 7, 0],
    bodyScratches: [6, 3, 0],
    dents: [8, 4, 0],
    panel: [15, 20, 0],
    shape: [20, 15, 0],
  };
  for (const q of QUESTIONS)
    q.options.forEach((o, i) =>
      it(`applies the configured ${q.id}/${o.id} deduction`, () => {
        const a = healthy();
        a.categories = [q.category];
        a.physical[q.id] = o.id;
        expect(calculateValuation(30000, a)?.percent).toBe(physicalExpected[q.id][i]);
      }),
    );
  const functionalExpected = [10, 12, 4, 12, 5, 7, 3, 5, 5, 12, 7, 5, 5, 4, 3, 5, 10, 5];
  FAULTS.forEach((f, i) =>
    it(`applies the ${f.id} fault percentage`, () => {
      const a = healthy();
      a.faults = [f.id];
      expect(calculateValuation(30000, a)?.percent).toBe(functionalExpected[i]);
    }),
  );
  it("keeps the specified category and overall caps", () => {
    expect(CAPS).toEqual({
      basic: 45,
      screen: 35,
      body: 30,
      functional: 40,
      accessories: 2,
      total: 70,
    });
  });
});

describe("Apple iPhone 13 128 GB pricing regression", () => {
  const variant = getVariant("Apple", "Apple iPhone 13", "128-gb");
  const base = variant?.uptoPrice;

  it("uses the exact 128 GB catalog price", () => {
    expect(variant?.id).toBe("128-gb");
    expect(base).toBe(25760);
  });

  it.each([
    ["healthy, capped at the exact catalog maximum", healthy(), 25760],
    [
      "minor body scratches",
      { ...healthy(), categories: ["body"], physical: { bodyScratches: "minor" } },
      25000,
    ],
    [
      "cracked screen",
      { ...healthy(), categories: ["screen"], physical: { screenPhysical: "cracked" } },
      20600,
    ],
    [
      "screen and display defects capped at 35 percent",
      {
        ...healthy(),
        categories: ["screen", "display"],
        physical: { screenPhysical: "cracked", spots: "large" },
      },
      16700,
    ],
    [
      "multiple defects capped at 70 percent",
      {
        ...healthy(),
        basic: { calls: false, touch: false, original: false },
        categories: ["screen", "display", "body", "panel"],
        physical: {
          screenPhysical: "cracked",
          spots: "large",
          lines: "visible",
          discoloration: "major",
          bodyScratches: "many",
          dents: "major",
          panel: "missing",
          shape: "bent",
        },
        faults: FAULTS.map((fault) => fault.id),
        box: false,
      },
      7700,
    ],
  ])("preserves the audited %s displayed estimate", (_name, answers, expected) => {
    expect(calculateValuation(base, answers as Answers)?.displayedEstimate).toBe(expected);
  });

  it.each([
    ["128-gb", 25760],
    ["256-gb", 26400],
    ["512-gb", 26980],
  ])("never exceeds the selected %s variant", (id, expected) => {
    const selected = getVariant("Apple", "Apple iPhone 13", id);
    const result = selected && calculateValuation(selected.uptoPrice, healthy());
    expect(result?.displayedEstimate).toBe(expected);
    expect(result?.displayedEstimate).toBeLessThanOrEqual(selected?.uptoPrice ?? 0);
  });
});
