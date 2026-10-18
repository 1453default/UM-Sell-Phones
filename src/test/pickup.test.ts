import { describe, expect, it } from "vitest";
import { isBookableSlot, isHyderabadPincode, pickupDates, PICKUP_SLOTS, PHONE_VERIFICATION_STATUS, SLOT_CAPACITY, pickupSchema } from "@/lib/pickup";

describe("pickup rules", () => {
  it("keeps phone verification disabled and records unverified", () => { expect(PHONE_VERIFICATION_STATUS).toBe("unverified"); });
  it("keeps unlimited slot capacity", () => { expect(SLOT_CAPACITY).toBeNull(); });
  it("rejects malformed retry keys", () => { expect(pickupSchema.shape.submissionKey.safeParse("bad").success).toBe(false); });
  it("accepts Hyderabad pincodes only", () => {
    expect(isHyderabadPincode("500008")).toBe(true);
    expect(isHyderabadPincode("560001")).toBe(false);
    expect(isHyderabadPincode("50000")).toBe(false);
  });
  it("offers slots between 10 AM and 4 PM", () => {
    expect(PICKUP_SLOTS[0].startsWith("10:00 AM")).toBe(true);
    expect(PICKUP_SLOTS.at(-1)?.endsWith("4:00 PM")).toBe(true);
  });
  it("never offers Sundays or today", () => {
    const now = new Date("2026-10-17T10:00:00Z"); // Saturday in IST
    const dates = pickupDates(now);
    expect(dates[0]).toBe("2026-10-19"); // Sunday 18th skipped
    expect(dates.every((d) => new Date(`${d}T00:00:00Z`).getUTCDay() !== 0)).toBe(true);
    expect(isBookableSlot("2026-10-17", PICKUP_SLOTS[0], now)).toBe(false);
    expect(isBookableSlot("2026-10-18", PICKUP_SLOTS[0], now)).toBe(false);
  });
});
