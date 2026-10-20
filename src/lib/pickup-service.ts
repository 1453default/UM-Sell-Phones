import { getSellBrand, getSellModel } from "@/data/sellPhoneCatalog";
import { getVariant } from "@/data/sellPhonePricing";
import { answerSummary, assessmentComplete, calculateValuation, type Answers } from "./valuation";
import { isBookableSlot, pickupSchema } from "./pickup";

export const PICKUP_REQUEST_MAX_BYTES = 16 * 1024;

export type PickupToSave = {
  reference: string;
  submissionKey: string | null;
  customerName: string;
  mobile: string;
  addressLine: string;
  landmark: string | null;
  locality: string;
  pincode: string;
  slotDate: string;
  slotTime: string;
  brand: string;
  model: string;
  variant: string;
  baseValue: number;
  estimate: number;
  answers: Answers;
  answerSummary: string[];
};

export type PickupSaveResult =
  | { requestId: string; reference: string; created: boolean; rateLimited: false }
  | { requestId: null; reference: null; created: false; rateLimited: true };

export type PickupSubmissionDependencies = {
  hashContact(mobile: string): Promise<string>;
  persist(data: PickupToSave, contactKeyHash: string): Promise<PickupSaveResult>;
  notify(requestId: string): Promise<unknown>;
  makeReference(): string;
  onFailure?(stage: "rate_limit_identity" | "persistence" | "notification", error: unknown): void;
};

const SAVE_ERROR = "Could not save your request. Please try again.";

function requestBytes(input: unknown) {
  try {
    return new TextEncoder().encode(JSON.stringify(input) ?? "").byteLength;
  } catch {
    return PICKUP_REQUEST_MAX_BYTES + 1;
  }
}

export async function processPickupSubmission(
  input: unknown,
  dependencies: PickupSubmissionDependencies,
) {
  if (requestBytes(input) > PICKUP_REQUEST_MAX_BYTES) {
    return { ok: false as const, error: "Your request is too large. Please review your details." };
  }

  if (
    input !== null &&
    typeof input === "object" &&
    "website" in input &&
    typeof input.website === "string" &&
    input.website.length > 0
  ) {
    return { ok: false as const, error: SAVE_ERROR };
  }

  const parsed = pickupSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: parsed.error.issues[0]?.message ?? "Please check your details.",
    };
  }

  const data = parsed.data;
  const brand = getSellBrand(data.brandSlug);
  const model = getSellModel(data.brandSlug, data.modelSlug);
  const variant = brand && model ? getVariant(brand.name, model.name, data.variantId) : undefined;
  if (!brand || !model || !variant) {
    return { ok: false as const, error: "Device not found." };
  }

  const answers = data.answers as Answers;
  const result = calculateValuation(variant.uptoPrice, answers);
  if (!result || !assessmentComplete(answers)) {
    return { ok: false as const, error: "Please complete the device assessment." };
  }
  if (!isBookableSlot(data.slotDate, data.slotTime)) {
    return { ok: false as const, error: "That pickup slot is no longer available." };
  }

  let contactKeyHash: string;
  try {
    contactKeyHash = await dependencies.hashContact(data.mobile);
  } catch (error) {
    dependencies.onFailure?.("rate_limit_identity", error);
    return { ok: false as const, error: SAVE_ERROR };
  }

  let saved: PickupSaveResult;
  try {
    saved = await dependencies.persist(
      {
        reference: dependencies.makeReference(),
        submissionKey: data.submissionKey ?? null,
        customerName: data.name,
        mobile: data.mobile,
        addressLine: data.addressLine,
        landmark: data.landmark || null,
        locality: data.locality,
        pincode: data.pincode,
        slotDate: data.slotDate,
        slotTime: data.slotTime,
        brand: brand.name,
        model: model.name,
        variant: variant.label,
        baseValue: result.base,
        estimate: result.displayedEstimate,
        answers,
        answerSummary: answerSummary(answers),
      },
      contactKeyHash,
    );
  } catch (error) {
    dependencies.onFailure?.("persistence", error);
    return { ok: false as const, error: SAVE_ERROR };
  }

  if (saved.rateLimited) {
    return {
      ok: false as const,
      error: "Too many recent requests. Please wait before trying again.",
    };
  }

  if (saved.created) {
    try {
      await dependencies.notify(saved.requestId);
    } catch (error) {
      dependencies.onFailure?.("notification", error);
      // The committed pickup and outbox remain available for an admin retry.
    }
  }

  return { ok: true as const, reference: saved.reference };
}
