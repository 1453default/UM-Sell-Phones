import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getSellBrand, getSellModel } from "@/data/sellPhoneCatalog";
import { getVariant } from "@/data/sellPhonePricing";
import { answerSummary, assessmentComplete, calculateValuation, type Answers } from "./valuation";
import { REQUEST_STATUSES, isBookableSlot, makeReference, pickupSchema } from "./pickup";

export const createPickupRequest = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => pickupSchema.parse(d))
  .handler(async ({ data }) => {
    const brand = getSellBrand(data.brandSlug);
    const model = getSellModel(data.brandSlug, data.modelSlug);
    const variant = brand && model ? getVariant(brand.name, model.name, data.variantId) : undefined;
    if (!brand || !model || !variant) return { ok: false as const, error: "Device not found." };
    const answers = data.answers as Answers;
    // Recompute on the server so the stored estimate cannot be tampered with.
    const result = calculateValuation(variant.uptoPrice, answers);
    if (!result || !assessmentComplete(answers))
      return { ok: false as const, error: "Please complete the device assessment." };
    if (!isBookableSlot(data.slotDate, data.slotTime))
      return { ok: false as const, error: "That pickup slot is no longer available." };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    for (let attempt = 0; attempt < 3; attempt++) {
      const reference = makeReference();
      const { error } = await supabaseAdmin.from("pickup_requests").insert({
        reference,
        customer_name: data.name,
        mobile: data.mobile,
        address_line: data.addressLine,
        landmark: data.landmark || null,
        locality: data.locality,
        pincode: data.pincode,
        slot_date: data.slotDate,
        slot_time: data.slotTime,
        brand: brand.name,
        model: model.name,
        variant: variant.label,
        base_value: result.base,
        estimate: result.displayedEstimate,
        answers,
        answer_summary: answerSummary(answers),
      });
      if (!error) return { ok: true as const, reference };
      if (error.code !== "23505") {
        console.error("pickup insert failed", error);
        return { ok: false as const, error: "Could not save your request. Please try again." };
      }
    }
    return { ok: false as const, error: "Could not save your request. Please try again." };
  });

async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const { data } = await ctx.supabase.rpc("has_role", { _user_id: ctx.userId, _role: "admin" });
  if (!data) throw new Error("Forbidden");
}

export const checkAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    return { isAdmin: !!data };
  });

export const listPickupRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("pickup_requests")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    return data;
  });

export const updatePickupRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(REQUEST_STATUSES),
        assignedTo: z.string().trim().max(80),
        adminNotes: z.string().trim().max(1000),
        slotDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        slotTime: z.string().max(40),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase
      .from("pickup_requests")
      .update({
        status: data.status,
        assigned_to: data.assignedTo || null,
        admin_notes: data.adminNotes || null,
        slot_date: data.slotDate,
        slot_time: data.slotTime,
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
