import { useRef, useState, type FormEvent } from "react";
import { CalendarCheck, Loader2 } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { normalizeIndianMobile } from "@/lib/lead";
import { assessmentComplete, type Answers } from "@/lib/valuation";
import {
  PICKUP_SLOTS,
  formatPickupDate,
  isHyderabadPincode,
  pickupDates,
} from "@/lib/pickup";
import { createPickupRequest } from "@/lib/pickup.functions";
import type { SellVariant } from "@/data/sellPhonePricing";
import type { SellBrand, SellModel } from "@/data/sellPhoneCatalog";
import { SHOP_PHONE } from "@/lib/shop";

export function PickupForm({
  brand,
  model,
  variant,
  answers,
}: {
  brand: SellBrand;
  model: SellModel;
  variant: SellVariant;
  answers: Answers;
}) {
  const submitFn = useServerFn(createPickupRequest);
  const submissionKey = useRef<string | null>(null);
  const sending = useRef(false);
  const [dates] = useState(() => pickupDates());
  const [f, setF] = useState({
    name: "",
    mobile: "",
    addressLine: "",
    landmark: "",
    locality: "",
    pincode: "",
    slotDate: "",
    slotTime: "",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [reference, setReference] = useState<string | null>(null);
  const set = (k: keyof typeof f) => (v: string) => setF((p) => ({ ...p, [k]: v }));

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (sending.current || reference) return;
    const mobile = normalizeIndianMobile(f.mobile);
    if (f.name.trim().length < 2) return setError("Please enter your name.");
    if (!mobile) return setError("Enter a valid 10-digit Indian mobile number starting with 6–9.");
    if (f.addressLine.trim().length < 8) return setError("Please enter your full pickup address.");
    if (f.locality.trim().length < 2) return setError("Please enter your area or locality.");
    if (!isHyderabadPincode(f.pincode))
      return setError("Doorstep pickup is available only within Hyderabad (pincode 500001–500110).");
    if (!f.slotDate || !f.slotTime) return setError("Please choose a pickup date and time slot.");
    if (!assessmentComplete(answers)) return setError("Complete the device assessment first.");
    setError("");
    sending.current = true;
    submissionKey.current ??= crypto.randomUUID();
    setBusy(true);
    try {
      const res = await submitFn({
        data: {
          ...f,
          submissionKey: submissionKey.current,
          mobile,
          brandSlug: brand.slug,
          modelSlug: model.slug,
          variantId: variant.id,
          answers,
        },
      });
      if (res.ok) setReference(res.reference);
      else setError(res.error);
    } catch {
      setError("Could not submit your request. Please check your details and try again.");
    } finally {
      sending.current = false;
      setBusy(false);
    }
  }

  if (reference)
    return (
      <div role="status" className="mt-7 border border-foreground p-6">
        <CalendarCheck className="size-7" />
        <h2 className="mt-3 text-xl font-semibold">Pickup request received</h2>
        <p className="mt-2 text-sm text-muted-foreground">Your booking reference</p>
        <p className="mt-1 font-num text-3xl font-bold tracking-wider">{reference}</p>
        <p className="mt-4 text-sm leading-relaxed">
          {formatPickupDate(f.slotDate)}, {f.slotTime}. Our team will call you on {f.mobile} to
          confirm. The final price is set after inspecting the phone. Questions? Call {SHOP_PHONE}.
        </p>
      </div>
    );

  const field = (k: keyof typeof f, label: string, props: Record<string, unknown> = {}) => (
    <div>
      <label htmlFor={`p-${k}`} className="mb-2 block text-sm font-medium">
        {label}
      </label>
      <input
        id={`p-${k}`}
        value={f[k]}
        onChange={(e) => set(k)(e.target.value)}
        className="field"
        {...props}
      />
    </div>
  );

  return (
    <form onSubmit={submit} noValidate className="mt-7 space-y-5">
      <h2 className="text-xl font-semibold">Book a free doorstep pickup</h2>
      <p className="text-sm text-muted-foreground">Available across Hyderabad, Monday to Saturday.</p>
      <div className="grid gap-5 sm:grid-cols-2">
        {field("name", "Your name", { maxLength: 80, autoComplete: "name" })}
        {field("mobile", "Mobile number", {
          type: "tel",
          inputMode: "tel",
          autoComplete: "tel",
          maxLength: 16,
          placeholder: "10-digit mobile number",
        })}
      </div>
      {field("addressLine", "House / flat, street", { maxLength: 300, autoComplete: "street-address" })}
      <div className="grid gap-5 sm:grid-cols-3">
        {field("locality", "Area / locality", { maxLength: 120 })}
        {field("landmark", "Landmark (optional)", { maxLength: 120 })}
        {field("pincode", "Pincode", {
          inputMode: "numeric",
          maxLength: 6,
          autoComplete: "postal-code",
        })}
      </div>
      <fieldset>
        <legend className="mb-3 text-sm font-medium">Pickup date</legend>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-7">
          {dates.map((d) => (
            <label key={d} className={`selection-option justify-center text-center ${f.slotDate === d ? "is-selected" : ""}`}>
              <input
                type="radio"
                name="slotDate"
                className="sr-only"
                checked={f.slotDate === d}
                onChange={() => set("slotDate")(d)}
              />
              {formatPickupDate(d)}
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="mb-3 text-sm font-medium">Time slot</legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {PICKUP_SLOTS.map((s) => (
            <label key={s} className={`selection-option ${f.slotTime === s ? "is-selected" : ""}`}>
              <input
                type="radio"
                name="slotTime"
                checked={f.slotTime === s}
                onChange={() => set("slotTime")(s)}
              />
              {s}
            </label>
          ))}
        </div>
      </fieldset>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <Button type="submit" size="lg" className="h-12 w-full sm:w-auto" disabled={busy}>
        {busy ? <Loader2 className="animate-spin" /> : <CalendarCheck />} Confirm pickup request
      </Button>
    </form>
  );
}
