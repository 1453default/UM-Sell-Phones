import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { attachSupabaseAuth } from "@/integrations/supabase/auth-attacher";
import type { Database } from "@/integrations/supabase/types";
import { AdminAccessUnavailableError, resolveAdminRole } from "./admin-access";
import { isBookableSlot, makeReference, REQUEST_STATUSES } from "./pickup";
import type { PickupInput } from "./pickup";

<<<<<<< HEAD
type AdminContext = { supabase: SupabaseClient<Database>; userId: string };
=======
export const createPickupRequest = createServerFn({ method: "POST" })
  .validator((d: unknown) => d as z.input<typeof pickupSchema>)
  .handler(async ({ data: input }) => {
    const parsed = pickupSchema.safeParse(input);
    if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Please check your details." };
    const data = parsed.data;
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
>>>>>>> 82b3de4d68f96599d8612343ab3e124a89323dea

async function assertAdmin(context: AdminContext) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
<<<<<<< HEAD
  if (error) throw new AdminAccessUnavailableError("backend");
=======

async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const { data, error } = await ctx.supabase.rpc("has_role", { _user_id: ctx.userId, _role: "admin" });
  if (error) throw new Error("Could not verify admin access.");
>>>>>>> 82b3de4d68f96599d8612343ab3e124a89323dea
  if (!data) throw new Error("Forbidden");
}

export const checkAdmin = createServerFn({ method: "GET" })
  .middleware([attachSupabaseAuth, requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
<<<<<<< HEAD
    return { isAdmin: resolveAdminRole(data, error) };
=======
    if (error) throw new Error("Could not verify admin access.");
    return { isAdmin: !!data };
>>>>>>> 82b3de4d68f96599d8612343ab3e124a89323dea
  });

// Keep input errors in the structured response returned by processPickupSubmission.
export const createPickupRequest = createServerFn({ method: "POST" })
  .validator((data: unknown) => data as PickupInput)
  .handler(async ({ data }) => {
    const submissionKey = (data as PickupInput).submissionKey;
    const requestId =
      submissionKey && /^[0-9a-f-]{36}$/i.test(submissionKey) ? submissionKey : crypto.randomUUID();
    const logFailure = (
      stage: "handler" | "rate_limit_identity" | "persistence" | "notification",
      error: unknown,
    ) => {
      const record = error && typeof error === "object" ? error : null;
      const rawCode = record && "code" in record ? record.code : undefined;
      const code =
        typeof rawCode === "string" && /^[A-Z0-9_]{1,20}$/.test(rawCode) ? rawCode : null;
      const errorKind =
        error instanceof Error &&
        /missing .*environment variable|not configured/i.test(error.message)
          ? "configuration"
          : (code ?? (error instanceof Error ? error.name : "unknown"));
      console.error("[Pickup] request operation failed", { requestId, stage, errorKind });
    };

    try {
      const [{ processPickupSubmission }, pickupServer] = await Promise.all([
        import("./pickup-service"),
        import("./pickup.server"),
      ]);
      return await processPickupSubmission(data, {
        hashContact: pickupServer.hashPickupContact,
        persist: pickupServer.persistPickupRequest,
        notify: pickupServer.dispatchPickupNotification,
        makeReference,
        onFailure: (stage, error) => logFailure(stage, error),
      });
    } catch (error) {
      logFailure("handler", error);
      return { ok: false as const, error: "Could not submit your request. Please try again." };
    }
  });

const cursorSchema = z.object({
  createdAt: z.string().datetime({ offset: true }),
  id: z.string().uuid(),
});
const pickupListSchema = z.object({
  cursor: cursorSchema.nullish(),
  status: z.enum(["all", ...REQUEST_STATUSES]).default("all"),
  search: z.string().trim().max(80).default(""),
});
export type PickupCursor = z.infer<typeof cursorSchema>;
export const ADMIN_REQUEST_PAGE_SIZE = 50;

export function nextPickupCursor<T extends { id: string; created_at: string }>(
  rows: T[],
  pageSize = ADMIN_REQUEST_PAGE_SIZE,
): PickupCursor | null {
  if (rows.length <= pageSize) return null;
  const last = rows[pageSize - 1];
  return last ? { createdAt: last.created_at, id: last.id } : null;
}

export function pickupPageFilter(cursor: PickupCursor | null | undefined, searchText: string) {
  const search = searchText
    .replace(/[^\p{L}\p{N} +-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
  const searchFilters = search
    ? ["reference", "customer_name", "mobile", "brand", "model", "variant"]
        .map((field) => `${field}.ilike.*${search}*`)
        .join(",")
    : "";
  const cursorFilters = cursor
    ? `created_at.lt.${cursor.createdAt},and(created_at.eq.${cursor.createdAt},id.lt.${cursor.id})`
    : "";

  if (cursorFilters && searchFilters) {
    return `and(or(${cursorFilters}),or(${searchFilters}))`;
  }
  return cursorFilters || searchFilters;
}

export const listPickupRequests = createServerFn({ method: "GET" })
  .middleware([attachSupabaseAuth, requireSupabaseAuth])
  .validator((data: unknown) => pickupListSchema.parse(data ?? {}))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);

    let query = context.supabase
      .from("pickup_requests")
      .select("*")
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(ADMIN_REQUEST_PAGE_SIZE + 1);

    if (data.status !== "all") query = query.eq("status", data.status);

    const filter = pickupPageFilter(data.cursor, data.search);
    if (filter) query = query.or(filter);

    const { data: page, error } = await query;
    if (error) throw new Error("Could not load pickup requests");
    const hasMore = page.length > ADMIN_REQUEST_PAGE_SIZE;
    const items = page.slice(0, ADMIN_REQUEST_PAGE_SIZE);
    const ids = items.map((row) => row.id);
    const notificationsByRequest = new Map<
      string,
      {
        status: string;
        attempts: number;
        last_attempt_at: string | null;
        last_error_code: string | null;
        provider_message_id: string | null;
        delivered_at: string | null;
      }
    >();

    if (ids.length) {
      const { data: notifications, error: notificationError } = await context.supabase
        .from("pickup_notification_outbox")
        .select(
          "pickup_request_id,status,attempts,last_attempt_at,last_error_code,provider_message_id,delivered_at",
        )
        .in("pickup_request_id", ids);
      if (notificationError) throw new Error("Could not load pickup notification status");
      for (const notification of notifications) {
        notificationsByRequest.set(notification.pickup_request_id, {
          status: notification.status,
          attempts: notification.attempts,
          last_attempt_at: notification.last_attempt_at,
          last_error_code: notification.last_error_code,
          provider_message_id: notification.provider_message_id,
          delivered_at: notification.delivered_at,
        });
      }
    }

    return {
      items: items.map((row) => ({
        ...row,
        notification: notificationsByRequest.get(row.id) ?? null,
      })),
      nextCursor: hasMore ? nextPickupCursor(page) : null,
    };
  });

const updatePickupSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(REQUEST_STATUSES),
  assignedTo: z.string().trim().max(80),
  adminNotes: z.string().trim().max(1000),
  slotDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  slotTime: z.string().max(40),
});

export const updatePickupRequest = createServerFn({ method: "POST" })
<<<<<<< HEAD
  .middleware([attachSupabaseAuth, requireSupabaseAuth])
  .validator(updatePickupSchema)
=======
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) =>
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
>>>>>>> 82b3de4d68f96599d8612343ab3e124a89323dea
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    if (!isBookableSlot(data.slotDate, data.slotTime)) {
      const { data: current } = await context.supabase
        .from("pickup_requests")
        .select("slot_date,slot_time")
        .eq("id", data.id)
        .single();
      if (!current || current.slot_date !== data.slotDate || current.slot_time !== data.slotTime) {
        throw new Error("Choose a valid upcoming pickup date and time.");
      }
    }
    const { data: saved, error } = await context.supabase
      .from("pickup_requests")
      .update({
        status: data.status,
        assigned_to: data.assignedTo || null,
        admin_notes: data.adminNotes || null,
        slot_date: data.slotDate,
        slot_time: data.slotTime,
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.id)
      .select("*")
      .single();
    if (error) throw new Error("Could not save pickup request");
    return saved;
  });

const retryNotificationSchema = z.object({ requestId: z.string().uuid() });
export const retryPickupNotification = createServerFn({ method: "POST" })
  .middleware([attachSupabaseAuth, requireSupabaseAuth])
  .validator(retryNotificationSchema)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    try {
      const { dispatchPickupNotification } = await import("./pickup.server");
      await dispatchPickupNotification(data.requestId);
    } catch {
      // Notification status remains visible to the admin for provider/database reconciliation.
    }
    const { data: notification, error } = await context.supabase
      .from("pickup_notification_outbox")
      .select("status,attempts,last_attempt_at,last_error_code,provider_message_id,delivered_at")
      .eq("pickup_request_id", data.requestId)
      .maybeSingle();
    if (error) throw new Error("Could not reload notification status");
    return notification;
  });
