import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { PickupSaveResult, PickupToSave } from "./pickup-service";
import {
  dispatchPickupNotification as dispatch,
  type NotificationRepository,
} from "./pickup-notification.server";

export async function hashPickupContact(mobile: string) {
  const secret = process.env.PICKUP_RATE_LIMIT_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) throw new Error("Pickup rate limiting is not configured");
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = new Uint8Array(
    await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(mobile)),
  );
  return Array.from(signature, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function persistPickupRequest(
  request: PickupToSave,
  contactKeyHash: string,
): Promise<PickupSaveResult> {
  const { data, error } = await supabaseAdmin.rpc("create_pickup_request_atomic", {
    p_reference: request.reference,
    p_submission_key: request.submissionKey,
    p_mobile_key_hash: contactKeyHash,
    p_customer_name: request.customerName,
    p_mobile: request.mobile,
    p_address_line: request.addressLine,
    p_landmark: request.landmark,
    p_locality: request.locality,
    p_pincode: request.pincode,
    p_slot_date: request.slotDate,
    p_slot_time: request.slotTime,
    p_brand: request.brand,
    p_model: request.model,
    p_variant: request.variant,
    p_base_value: request.baseValue,
    p_estimate: request.estimate,
    p_answers: request.answers,
    p_answer_summary: request.answerSummary,
  });

  if (error) {
    console.error("pickup insert failed", { code: error.code });
    throw new Error("Pickup request could not be saved");
  }

  const row = data?.[0];
  if (row?.rate_limited) {
    return { requestId: null, reference: null, created: false, rateLimited: true };
  }
  if (row?.request_id && row.reference) {
    return {
      requestId: row.request_id,
      reference: row.reference,
      created: row.created,
      rateLimited: false,
    };
  }
  throw new Error("Pickup request save returned no record");
}

function pickupNotificationRepository(): NotificationRepository {
  return {
    async claim(requestId) {
      const { data, error } = await supabaseAdmin.rpc("claim_pickup_notification", {
        p_request_id: requestId,
      });
      if (error) throw new Error("Notification claim failed");
      return data === true;
    },
    async load(requestId) {
      const { data, error } = await supabaseAdmin
        .from("pickup_requests")
        .select(
          "id,reference,created_at,customer_name,mobile,address_line,landmark,locality,pincode,slot_date,slot_time,brand,model,variant,base_value,estimate,answer_summary",
        )
        .eq("id", requestId)
        .maybeSingle();
      if (error) throw new Error("Notification request lookup failed");
      return data;
    },
    async markSent(requestId, providerMessageId) {
      const { error } = await supabaseAdmin
        .from("pickup_notification_outbox")
        .update({
          status: "sent",
          provider_message_id: providerMessageId,
          delivered_at: new Date().toISOString(),
          last_error_code: null,
          updated_at: new Date().toISOString(),
        })
        .eq("pickup_request_id", requestId);
      if (error) throw new Error("Notification status update failed");
    },
    async markFailure(requestId, status, errorCode) {
      const { error } = await supabaseAdmin
        .from("pickup_notification_outbox")
        .update({
          status,
          last_error_code: errorCode,
          updated_at: new Date().toISOString(),
        })
        .eq("pickup_request_id", requestId);
      if (error) throw new Error("Notification failure status update failed");
    },
  };
}

export async function dispatchPickupNotification(requestId: string) {
  return dispatch(requestId, pickupNotificationRepository());
}
