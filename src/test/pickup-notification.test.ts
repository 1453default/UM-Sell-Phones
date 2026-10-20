import { describe, expect, it, vi } from "vitest";
import {
  buildPickupEmail,
  dispatchPickupNotification,
  sendResendEmail,
  type NotificationRepository,
  type PickupEmail,
  type PickupNotificationData,
} from "@/lib/pickup-notification.server";

const requestId = "00000000-0000-4000-8000-000000000002";
const request: PickupNotificationData = {
  id: requestId,
  reference: "UM-ABC234",
  created_at: "2026-10-20T10:00:00.000Z",
  customer_name: '<img src=x onerror="alert(1)">',
  mobile: "9876543210",
  address_line: "12 Example Street",
  landmark: null,
  locality: "Toli Chowki",
  pincode: "500008",
  slot_date: "2026-10-21",
  slot_time: "10:00 AM – 12:00 PM",
  brand: "Apple",
  model: "Apple iPhone 13",
  variant: "128 GB",
  base_value: 25760,
  estimate: 25760,
  answer_summary: ["Original box with same IMEI: Yes"],
};

function repository() {
  let status = "pending";
  const calls = { claimed: 0, sent: 0, failed: [] as string[] };
  const repo: NotificationRepository = {
    async claim() {
      if (status !== "pending" && status !== "failed") return false;
      status = "sending";
      calls.claimed++;
      return true;
    },
    async load() {
      return request;
    },
    async markSent() {
      status = "sent";
      calls.sent++;
    },
    async markFailure(_id, failureStatus, errorCode) {
      status = failureStatus;
      calls.failed.push(errorCode);
    },
  };
  return { repo, calls, getStatus: () => status };
}

describe("pickup admin email", () => {
  it("creates accessible HTML and text content and escapes customer-controlled HTML", () => {
    const email = buildPickupEmail(request);
    expect(email.subject).toBe("[USED MOBILES] New Pickup Request - UM-ABC234");
    expect(email.html).toContain("&lt;img src=x onerror=&quot;alert(1)&quot;&gt;");
    expect(email.html).not.toContain('<img src=x onerror="alert(1)">');
    expect(email.html).toContain("Condition answers");
    expect(email.text).toContain("9876543210");
    expect(email.text).toContain("Landmark: Not provided");
  });

  it("does not call Resend when server configuration is missing", async () => {
    const fetcher = vi.fn<typeof fetch>();
    const result = await sendResendEmail(buildPickupEmail(request), requestId, {}, fetcher);
    expect(result).toEqual({ status: "failed", errorCode: "email_not_configured" });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("sends only to the configured administrator with a stable Resend idempotency key", async () => {
    let sentBody: Record<string, unknown> | undefined;
    let sentHeaders: Headers | undefined;
    const fetcher: typeof fetch = async (_input, init) => {
      sentHeaders = new Headers(init?.headers);
      sentBody = JSON.parse(String(init?.body)) as Record<string, unknown>;
      return new Response(JSON.stringify({ id: "re_123" }), { status: 200 });
    };
    const email = buildPickupEmail(request);
    const first = await sendResendEmail(
      email,
      requestId,
      {
        apiKey: "re_test",
        recipient: "owner@example.com",
        from: "Used Mobiles <shop@example.com>",
      },
      fetcher,
    );
    const second = await sendResendEmail(
      email,
      requestId,
      {
        apiKey: "re_test",
        recipient: "owner@example.com",
        from: "Used Mobiles <shop@example.com>",
      },
      fetcher,
    );

    expect(first).toEqual({ status: "sent", providerMessageId: "re_123" });
    expect(second).toEqual(first);
    expect(sentHeaders?.get("Idempotency-Key")).toBe(`pickup-request/${requestId}`);
    expect(sentBody?.to).toEqual(["owner@example.com"]);
  });

  it("classifies provider rejection as retryable and a timeout as outcome-unknown", async () => {
    const config = {
      apiKey: "re_test",
      recipient: "owner@example.com",
      from: "Shop <shop@example.com>",
    };
    const rejected = await sendResendEmail(
      buildPickupEmail(request),
      requestId,
      config,
      async () => new Response("{}", { status: 429 }),
    );
    const timedOut = await sendResendEmail(
      buildPickupEmail(request),
      requestId,
      config,
      async () => {
        throw new Error("timeout");
      },
    );
    expect(rejected).toEqual({ status: "failed", errorCode: "provider_rejected_429" });
    expect(timedOut).toEqual({ status: "unknown", errorCode: "provider_outcome_unknown" });
  });

  it("retries known failures with the same request id and does not retry unknown outcomes", async () => {
    const state = repository();
    const send = vi
      .fn<
        (email: PickupEmail, id: string) => Promise<Awaited<ReturnType<typeof sendResendEmail>>>
      >()
      .mockResolvedValueOnce({ status: "failed", errorCode: "provider_rejected_429" })
      .mockResolvedValueOnce({ status: "sent", providerMessageId: "re_123" });
    expect(await dispatchPickupNotification(requestId, state.repo, send)).toBe("failed");
    expect(await dispatchPickupNotification(requestId, state.repo, send)).toBe("sent");
    expect(send.mock.calls.map((call) => call[1])).toEqual([requestId, requestId]);
    expect(state.getStatus()).toBe("sent");

    const unknownState = repository();
    const unknownSend = vi.fn(async () => ({
      status: "unknown" as const,
      errorCode: "provider_outcome_unknown",
    }));
    expect(await dispatchPickupNotification(requestId, unknownState.repo, unknownSend)).toBe(
      "unknown",
    );
    expect(await dispatchPickupNotification(requestId, unknownState.repo, unknownSend)).toBe(
      "not_claimed",
    );
    expect(unknownState.calls.claimed).toBe(1);
  });
});
