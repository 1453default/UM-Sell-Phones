import { describe, expect, it, vi } from "vitest";
import {
  buildPickupTelegramMessage,
  dispatchPickupNotification,
  sendTelegramMessage,
  type NotificationRepository,
  type PickupNotificationData,
  type TelegramResult,
} from "@/lib/pickup-notification.server";

const requestId = "00000000-0000-4000-8000-000000000002";
const request: PickupNotificationData = {
  id: requestId,
  reference: "UM-ABC234",
  created_at: "2026-10-20T10:00:00.000Z",
  customer_name: "Alice\nInjected line",
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

describe("Telegram lead notifications", () => {
  it("builds a readable plain-text alert from the saved pickup and flattens user line breaks", () => {
    const message = buildPickupTelegramMessage(request);
    expect(message).toContain("NEW PICKUP REQUEST");
    expect(message).toContain("Reference: UM-ABC234");
    expect(message).toContain("Customer: Alice Injected line");
    expect(message).toContain("Mobile: 9876543210");
    expect(message).toContain("Apple Apple iPhone 13 · 128 GB");
    expect(message).toContain("Estimated offer: ₹25,760");
    expect(message).toContain("Address: 12 Example Street, Toli Chowki, 500008");
    expect(message).toContain("• Original box with same IMEI: Yes");
    expect(message).not.toContain("\nInjected line");
  });

  it("keeps alerts within Telegram's message-size limit", () => {
    const message = buildPickupTelegramMessage({
      ...request,
      address_line: "A".repeat(300),
      landmark: "L".repeat(120),
      locality: "N".repeat(120),
      answer_summary: Array.from({ length: 40 }, () => "condition ".repeat(120)),
    });
    expect(message.length).toBeLessThanOrEqual(4096);
    expect(message.endsWith("…")).toBe(true);
  });

  it("does not call Telegram when server configuration is missing", async () => {
    const fetcher = vi.fn<typeof fetch>();
    const result = await sendTelegramMessage("test", {}, fetcher);
    expect(result).toEqual({ status: "failed", errorCode: "telegram_not_configured" });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("posts to the configured chat and records Telegram's confirmed message id", async () => {
    let sentUrl = "";
    let sentBody: Record<string, unknown> | undefined;
    const fetcher: typeof fetch = async (input, init) => {
      sentUrl = String(input);
      sentBody = JSON.parse(String(init?.body)) as Record<string, unknown>;
      return new Response(JSON.stringify({ ok: true, result: { message_id: 42 } }), {
        status: 200,
      });
    };

    const result = await sendTelegramMessage(
      "New lead",
      { botToken: "test-token", chatId: "-100123" },
      fetcher,
    );

    expect(result).toEqual({ status: "sent", providerMessageId: "42" });
    expect(sentUrl).toBe("https://api.telegram.org/bottest-token/sendMessage");
    expect(sentBody).toEqual({ chat_id: "-100123", text: "New lead" });
  });

  it("treats Telegram rejections as retryable failures and uncertain outcomes as unknown", async () => {
    const config = { botToken: "test-token", chatId: "-100123" };
    const rejected = await sendTelegramMessage(
      "New lead",
      config,
      async () => new Response(JSON.stringify({ ok: false, error_code: 400 }), { status: 200 }),
    );
    const rateLimited = await sendTelegramMessage(
      "New lead",
      config,
      async () => new Response(JSON.stringify({ ok: false, error_code: 429 }), { status: 429 }),
    );
    const serverError = await sendTelegramMessage(
      "New lead",
      config,
      async () => new Response("{}", { status: 503 }),
    );
    const timeout = await sendTelegramMessage("New lead", config, async () => {
      throw new Error("network timeout");
    });

    expect(rejected).toEqual({ status: "failed", errorCode: "telegram_rejected_400" });
    expect(rateLimited).toEqual({ status: "failed", errorCode: "telegram_rejected_429" });
    expect(serverError).toEqual({ status: "unknown", errorCode: "provider_outcome_unknown" });
    expect(timeout).toEqual({ status: "unknown", errorCode: "provider_outcome_unknown" });
  });

  it("retries confirmed failures with the same saved alert and never retries an unknown outcome", async () => {
    const state = repository();
    const send = vi
      .fn<(message: string) => Promise<TelegramResult>>()
      .mockResolvedValueOnce({ status: "failed", errorCode: "telegram_rejected_429" })
      .mockResolvedValueOnce({ status: "sent", providerMessageId: "42" });
    expect(await dispatchPickupNotification(requestId, state.repo, send)).toBe("failed");
    expect(await dispatchPickupNotification(requestId, state.repo, send)).toBe("sent");
    expect(send).toHaveBeenCalledTimes(2);
    expect(send.mock.calls[0]?.[0]).toBe(send.mock.calls[1]?.[0]);
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

  it("does not send a notification twice when concurrent dispatches claim one outbox row", async () => {
    const state = repository();
    const send = vi.fn(async () => ({ status: "sent" as const, providerMessageId: "42" }));
    const results = await Promise.all([
      dispatchPickupNotification(requestId, state.repo, send),
      dispatchPickupNotification(requestId, state.repo, send),
    ]);
    expect(results.sort()).toEqual(["not_claimed", "sent"]);
    expect(send).toHaveBeenCalledOnce();
  });
});
