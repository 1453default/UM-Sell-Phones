export type PickupNotificationData = {
  id: string;
  reference: string;
  created_at: string;
  customer_name: string | null;
  mobile: string | null;
  address_line: string | null;
  landmark: string | null;
  locality: string | null;
  pincode: string | null;
  slot_date: string | null;
  slot_time: string | null;
  brand: string | null;
  model: string | null;
  variant: string | null;
  base_value: number | string | null;
  estimate: number | string | null;
  answer_summary: string[] | null;
};

export type TelegramResult =
  | { status: "sent"; providerMessageId: string | null }
  | { status: "failed" | "unknown"; errorCode: string };

export type NotificationRepository = {
  claim(requestId: string): Promise<boolean>;
  load(requestId: string): Promise<PickupNotificationData | null>;
  markSent(requestId: string, providerMessageId: string | null): Promise<void>;
  markFailure(requestId: string, status: "failed" | "unknown", errorCode: string): Promise<void>;
};

export function buildPickupTelegramMessage(request: PickupNotificationData) {
  const oneLine = (value: unknown) =>
    String(value ?? "")
      .replace(/\s+/g, " ")
      .trim();
  const shown = (value: unknown) => oneLine(value) || "Not provided";
  const money = (value: number | string | null) => {
    if (value === null || value === "") return "Not provided";
    const amount = Number(value);
    return Number.isFinite(amount) ? `₹${amount.toLocaleString("en-IN")}` : "Not provided";
  };
  const submittedAt = new Date(request.created_at).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
  });
  const address = [request.address_line, request.locality, request.pincode]
    .map(oneLine)
    .filter(Boolean)
    .join(", ");
  const lines = [
    "NEW PICKUP REQUEST",
    `Reference: ${shown(request.reference)}`,
    `Submitted: ${submittedAt}`,
    `Customer: ${shown(request.customer_name)}`,
    `Mobile: ${shown(request.mobile)}`,
    `Device: ${shown(request.brand)} ${shown(request.model)} · ${shown(request.variant)}`,
    `Estimated offer: ${money(request.estimate)}`,
    `Pickup: ${shown(request.slot_date)} · ${shown(request.slot_time)}`,
    `Address: ${address || "Not provided"}`,
    `Landmark: ${shown(request.landmark)}`,
    ...(request.answer_summary?.length
      ? ["Condition answers:", ...request.answer_summary.map((item) => `• ${shown(item)}`)]
      : []),
  ];
  const message = lines.join("\n");
  if (message.length <= 4096) return message;

  let shortened = message.slice(0, 4093);
  const lastCodeUnit = shortened.charCodeAt(shortened.length - 1);
  if (lastCodeUnit >= 0xd800 && lastCodeUnit <= 0xdbff) shortened = shortened.slice(0, -1);
  return `${shortened}…`;
}

export async function sendTelegramMessage(
  message: string,
  config: { botToken?: string; chatId?: string } = {
    botToken: process.env.TELEGRAM_BOT_TOKEN,
    chatId: process.env.TELEGRAM_CHAT_ID,
  },
  fetcher: typeof fetch = fetch,
): Promise<TelegramResult> {
  if (!config.botToken || !config.chatId) {
    return { status: "failed", errorCode: "telegram_not_configured" };
  }

  try {
    const response = await fetcher(`https://api.telegram.org/bot${config.botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: config.chatId, text: message }),
      signal: AbortSignal.timeout(8_000),
    });

    if (!response.ok) {
      return response.status >= 500
        ? { status: "unknown", errorCode: "provider_outcome_unknown" }
        : { status: "failed", errorCode: `telegram_rejected_${response.status}` };
    }

    const body = (await response.json().catch(() => null)) as {
      ok?: unknown;
      error_code?: unknown;
      result?: { message_id?: unknown };
    } | null;
    if (body?.ok === true) {
      return {
        status: "sent",
        providerMessageId:
          typeof body.result?.message_id === "number" || typeof body.result?.message_id === "string"
            ? String(body.result.message_id)
            : null,
      };
    }
    if (body?.ok === false) {
      const code =
        typeof body.error_code === "number" && Number.isInteger(body.error_code)
          ? body.error_code
          : "rejected";
      return { status: "failed", errorCode: `telegram_rejected_${code}` };
    }
    return { status: "unknown", errorCode: "provider_outcome_unknown" };
  } catch {
    // Telegram has no idempotency key, so an interrupted request must not be retried blindly.
    return { status: "unknown", errorCode: "provider_outcome_unknown" };
  }
}

export async function dispatchPickupNotification(
  requestId: string,
  repository: NotificationRepository,
  send: (message: string) => Promise<TelegramResult> = (message) => sendTelegramMessage(message),
) {
  if (!(await repository.claim(requestId))) return "not_claimed" as const;

  const request = await repository.load(requestId);
  if (!request) {
    await repository.markFailure(requestId, "failed", "request_missing");
    return "failed" as const;
  }

  const result = await send(buildPickupTelegramMessage(request));
  if (result.status === "sent") {
    await repository.markSent(requestId, result.providerMessageId);
    return "sent" as const;
  }

  await repository.markFailure(requestId, result.status, result.errorCode);
  return result.status;
}
