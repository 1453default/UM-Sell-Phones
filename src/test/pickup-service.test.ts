import { describe, expect, it, vi } from "vitest";
import { PICKUP_SLOTS, pickupDates } from "@/lib/pickup";
import {
  processPickupSubmission,
  type PickupSaveResult,
  type PickupSubmissionDependencies,
} from "@/lib/pickup-service";

const answers = {
  basic: { calls: true, touch: true, original: true },
  categories: [],
  physical: {},
  faults: [],
  box: true,
};

const validInput = () => ({
  website: "",
  submissionKey: "00000000-0000-4000-8000-000000000001",
  brandSlug: "apple",
  modelSlug: "iphone-13",
  variantId: "128-gb",
  answers,
  name: "Ada Customer",
  mobile: "9876543210",
  addressLine: "12 Example Street",
  landmark: "Near the park",
  locality: "Toli Chowki",
  pincode: "500008",
  slotDate: pickupDates()[0],
  slotTime: PICKUP_SLOTS[0],
});

const created: PickupSaveResult = {
  requestId: "00000000-0000-4000-8000-000000000002",
  reference: "UM-ABC234",
  created: true,
  rateLimited: false,
};

function dependencies(overrides: Partial<PickupSubmissionDependencies> = {}) {
  return {
    hashContact: vi.fn(async () => "a".repeat(64)),
    persist: vi.fn(async () => created),
    notify: vi.fn(async () => "sent"),
    makeReference: vi.fn(() => "UM-ABC234"),
    ...overrides,
  } satisfies PickupSubmissionDependencies;
}

describe("pickup submission service", () => {
  it("validates and saves the exact server-priced variant before notifying", async () => {
    const deps = dependencies();
    const result = await processPickupSubmission(validInput(), deps);

    expect(result).toEqual({ ok: true, reference: "UM-ABC234" });
    expect(deps.persist).toHaveBeenCalledOnce();
    const [saved] = vi.mocked(deps.persist).mock.calls[0];
    expect(saved).toMatchObject({
      brand: "Apple",
      model: "Apple iPhone 13",
      variant: "128 GB",
      baseValue: 25760,
      estimate: 25760,
    });
    expect(deps.notify).toHaveBeenCalledWith(created.requestId);
    expect(vi.mocked(deps.persist).mock.invocationCallOrder[0]).toBeLessThan(
      vi.mocked(deps.notify).mock.invocationCallOrder[0],
    );
  });

  it("uses the selected variant rather than a similar model's price", async () => {
    const deps = dependencies();
    await processPickupSubmission({ ...validInput(), variantId: "256-gb" }, deps);
    const [saved] = vi.mocked(deps.persist).mock.calls[0];
    expect(saved).toMatchObject({ variant: "256 GB", baseValue: 26410, estimate: 26400 });
  });

  it("does not trust or accept a client-supplied estimate or recipient", async () => {
    const deps = dependencies();
    const result = await processPickupSubmission(
      { ...validInput(), estimate: 1, recipientChatId: "attacker-controlled" },
      deps,
    );
    expect(result.ok).toBe(false);
    expect(deps.persist).not.toHaveBeenCalled();
    expect(deps.notify).not.toHaveBeenCalled();
  });

  it("does not send a notification when persistence fails", async () => {
    const deps = dependencies({
      persist: vi.fn<PickupSubmissionDependencies["persist"]>(async () => {
        throw new Error("database down");
      }),
    });
    const result = await processPickupSubmission(validInput(), deps);
    expect(result).toEqual({ ok: false, error: "Could not save your request. Please try again." });
    expect(deps.notify).not.toHaveBeenCalled();
  });

  it("keeps a saved pickup successful when notification delivery throws", async () => {
    let saved = false;
    const deps = dependencies({
      persist: vi.fn<PickupSubmissionDependencies["persist"]>(async () => {
        saved = true;
        return created;
      }),
      notify: vi.fn<PickupSubmissionDependencies["notify"]>(async () => {
        throw new Error("provider timeout");
      }),
    });
    const result = await processPickupSubmission(validInput(), deps);
    expect(result).toEqual({ ok: true, reference: "UM-ABC234" });
    expect(saved).toBe(true);
  });

  it("does not send duplicate notifications when an idempotent retry returns an existing record", async () => {
    const persist = vi
      .fn<PickupSubmissionDependencies["persist"]>()
      .mockResolvedValueOnce(created)
      .mockResolvedValueOnce({ ...created, created: false });
    const deps = dependencies({ persist });

    const first = await processPickupSubmission(validInput(), deps);
    const retry = await processPickupSubmission(validInput(), deps);

    expect(first).toEqual({ ok: true, reference: created.reference });
    expect(retry).toEqual(first);
    expect(deps.notify).toHaveBeenCalledOnce();
  });

  it("returns a safe throttle message when the database rate limiter rejects a new request", async () => {
    const deps = dependencies({
      persist: vi.fn<PickupSubmissionDependencies["persist"]>(async () => ({
        requestId: null,
        reference: null,
        created: false,
        rateLimited: true as const,
      })),
    });
    const result = await processPickupSubmission(validInput(), deps);
    expect(result).toMatchObject({ ok: false });
    expect(deps.notify).not.toHaveBeenCalled();
  });

  it("rejects honeypot and over-sized requests before persistence", async () => {
    const deps = dependencies();
    expect(
      await processPickupSubmission({ ...validInput(), website: "filled" }, deps),
    ).toMatchObject({
      ok: false,
    });
    expect(
      await processPickupSubmission({ ...validInput(), extra: "x".repeat(17_000) }, deps),
    ).toMatchObject({
      ok: false,
    });
    expect(deps.persist).not.toHaveBeenCalled();
  });

  it("rejects invalid pickup dates and condition answers on the server", async () => {
    const deps = dependencies();
    const invalidDate = await processPickupSubmission(
      { ...validInput(), slotDate: "2026-10-18" },
      deps,
    );
    const invalidAnswer = await processPickupSubmission(
      {
        ...validInput(),
        answers: { ...answers, categories: ["screen"], physical: { screenPhysical: "invented" } },
      },
      deps,
    );
    expect(invalidDate.ok).toBe(false);
    expect(invalidAnswer.ok).toBe(false);
    expect(deps.persist).not.toHaveBeenCalled();
  });
});
