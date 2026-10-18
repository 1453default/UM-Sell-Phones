import { describe, expect, it } from "vitest";
import { normalizeIndianMobile } from "../lib/lead";
describe("Indian mobile validation", () => {
  it.each([
    "9000464640",
    "+91 90004 64640",
    "0919000464640".slice(3),
    "09000464640",
    "919000464640",
  ])("accepts valid Indian mobile formatting %s", (phone) => {
    expect(normalizeIndianMobile(phone)).toBe("9000464640");
  });
  it.each(["5000464640", "900046464", "abc9000464640", "90004646400", "+1 9000464640"])(
    "rejects invalid mobile %s",
    (phone) => {
      expect(normalizeIndianMobile(phone)).toBeNull();
    },
  );
});
