import { describe, expect, it } from "vitest";
import { getModelVariants, getVariant } from "../data/sellPhonePricing";
import { SELL_BRANDS } from "../data/sellPhoneCatalog";
describe("Preserved catalog and exact variant lookup", () => {
  it("preserves the existing catalog scope", () => {
    expect(SELL_BRANDS.length).toBe(22);
    expect(SELL_BRANDS.reduce((n, b) => n + b.models.length, 0)).toBe(1329);
  });
  it("removes only the unwanted Apple iPhone Duo", () => {
    expect(SELL_BRANDS.find(b => b.name === "Apple")?.models.some(m => m.slug === "iphone-duo")).toBe(false);
    expect(getModelVariants("Apple", "Apple iPhone Duo")).toEqual([]);
    expect(SELL_BRANDS.find(b => b.name === "Lava")?.models.some(m => m.name.includes("Blaze Duo"))).toBe(true);
  });
  it("reads the existing exact variant prices independently", () => {
    expect(getVariant("Apple", "Apple iPhone 13", "128-gb")?.uptoPrice).toBe(25760);
    expect(getVariant("Apple", "Apple iPhone 13", "256-gb")?.uptoPrice).toBe(26410);
  });
  it("does not substitute similar models or unknown variants", () => {
    expect(getModelVariants("Apple", "Apple iPhone 13 imaginary")).toEqual([]);
    expect(getVariant("Apple", "Apple iPhone 13", "64-gb")).toBeUndefined();
  });
  it("maintains unique exact variant identifiers for every model", () => {
    for (const b of SELL_BRANDS)
      for (const m of b.models) {
        const ids = getModelVariants(b.name, m.name).map((v) => v.id);
        expect(new Set(ids).size).toBe(ids.length);
      }
  });
});
