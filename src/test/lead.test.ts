import { describe, expect, it } from "vitest";
import { leadLink, normalizeIndianMobile } from "../lib/lead";
import { emptyAnswers } from "../lib/valuation";
describe("WhatsApp lead handoff", () => {
  it.each(["9000464640", "+91 90004 64640", "0919000464640".slice(3), "09000464640", "919000464640"])("accepts valid Indian mobile formatting %s", phone => { expect(normalizeIndianMobile(phone)).toBe("9000464640"); });
  it.each(["5000464640", "900046464", "abc9000464640", "90004646400", "+1 9000464640"])("rejects invalid mobile %s", phone => { expect(normalizeIndianMobile(phone)).toBeNull(); });
  it("encodes the exact device and real lead details for the existing shop", () => { const link = leadLink({ name:"A & B",mobile:"9000464640",brand:"Apple",model:"iPhone 13",variant:"128 GB",base:30000,estimate:27000,answers:emptyAnswers() }); const url = new URL(link); expect(url.hostname).toBe("wa.me"); expect(url.pathname).toBe("/919000464640"); expect(url.searchParams.get("text")).toContain("Name: A & B"); expect(url.searchParams.get("text")).toContain("Model: iPhone 13"); expect(url.searchParams.get("text")).toContain("Variant: 128 GB"); expect(url.searchParams.get("text")).toContain("27,000"); });
});