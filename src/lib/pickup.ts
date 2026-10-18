import { z } from "zod";

// Doorstep pickup: Hyderabad, Monday–Saturday, 10:00 AM – 4:00 PM.
export const PICKUP_SLOTS = ["10:00 AM – 12:00 PM", "12:00 PM – 2:00 PM", "2:00 PM – 4:00 PM"] as const;
export const BOOKING_DAYS = 7;
export const PHONE_VERIFICATION_STATUS = "unverified" as const;
export const SLOT_CAPACITY: number | null = null;
export const REQUEST_STATUSES = [
  "new",
  "confirmed",
  "assigned",
  "rescheduled",
  "picked_up",
  "cancelled",
] as const;

// Hyderabad / Secunderabad / Cyberabad pincodes fall in 500001–500110.
export function isHyderabadPincode(pin: string) {
  if (!/^\d{6}$/.test(pin)) return false;
  const n = Number(pin);
  return n >= 500001 && n <= 500110;
}

/** ISO date (YYYY-MM-DD) for "today" in India. */
export function istToday(now = new Date()) {
  return new Date(now.getTime() + 5.5 * 3600_000).toISOString().slice(0, 10);
}

/** Next bookable dates, starting tomorrow (IST), skipping Sundays. */
export function pickupDates(now = new Date()): string[] {
  const out: string[] = [];
  const d = new Date(`${istToday(now)}T00:00:00Z`);
  while (out.length < BOOKING_DAYS) {
    d.setUTCDate(d.getUTCDate() + 1);
    if (d.getUTCDay() !== 0) out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

export function isBookableSlot(date: string, slot: string, now = new Date()) {
  return pickupDates(now).includes(date) && (PICKUP_SLOTS as readonly string[]).includes(slot);
}

export const formatPickupDate = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });

export const pickupSchema = z.object({
  submissionKey: z.string().uuid().optional(),
  brandSlug: z.string().min(1).max(80),
  modelSlug: z.string().min(1).max(160),
  variantId: z.string().min(1).max(80),
  answers: z.object({
    basic: z.record(z.string(), z.boolean()),
    categories: z.array(z.string().max(40)).max(10),
    physical: z.record(z.string(), z.string().max(40)),
    faults: z.array(z.string().max(40)).max(30),
    box: z.boolean().nullable(),
  }),
  name: z.string().trim().min(2, "Enter your name").max(80),
  mobile: z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number"),
  addressLine: z.string().trim().min(8, "Enter your full address").max(300),
  landmark: z.string().trim().max(120).optional().default(""),
  locality: z.string().trim().min(2, "Enter your area").max(120),
  pincode: z.string().refine(isHyderabadPincode, "We pick up only within Hyderabad (500001–500110)"),
  slotDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  slotTime: z.string().max(40),
});
export type PickupInput = z.input<typeof pickupSchema>;

export function makeReference(rand: () => number = Math.random) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 6; i++) s += chars[Math.floor(rand() * chars.length)];
  return `UM-${s}`;
}
