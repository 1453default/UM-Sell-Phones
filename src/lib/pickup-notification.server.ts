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

export type PickupEmail = { subject: string; html: string; text: string };
export type EmailConfig = { apiKey?: string; recipient?: string; from?: string };
export type EmailResult =
  | { status: "sent"; providerMessageId: string | null }
  | { status: "failed" | "unknown"; errorCode: string };

export type NotificationRepository = {
  claim(requestId: string): Promise<boolean>;
  load(requestId: string): Promise<PickupNotificationData | null>;
  markSent(requestId: string, providerMessageId: string | null): Promise<void>;
  markFailure(requestId: string, status: "failed" | "unknown", errorCode: string): Promise<void>;
};

export function escapeEmailHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });
}

const shown = (value: unknown) =>
  value === null || value === undefined || String(value).trim() === ""
    ? "Not provided"
    : String(value);
const money = (value: number | string | null) => {
  if (value === null || value === "") return "Not provided";
  const amount = Number(value);
  return Number.isFinite(amount) ? `₹${amount.toLocaleString("en-IN")}` : "Not provided";
};

export function buildPickupEmail(request: PickupNotificationData): PickupEmail {
  const submittedAt = new Date(request.created_at).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
  });
  const address = [request.address_line, request.locality, request.pincode]
    .filter((value) => typeof value === "string" && value.trim())
    .join(", ");
  const details: [string, string][] = [
    ["Reference", request.reference],
    ["Submitted", submittedAt],
    ["Customer", shown(request.customer_name)],
    ["Mobile", shown(request.mobile)],
    ["Device", `${shown(request.brand)} ${shown(request.model)} — ${shown(request.variant)}`],
    ["Base value", money(request.base_value)],
    ["Estimated offer", money(request.estimate)],
    ["Pickup date and time", `${shown(request.slot_date)} — ${shown(request.slot_time)}`],
    ["Address", address || "Not provided"],
    ["Landmark", shown(request.landmark)],
  ];
  const rows = details
    .map(
      ([label, value]) =>
        `<tr><th align="left" valign="top">${escapeEmailHtml(label)}</th><td>${escapeEmailHtml(value)}</td></tr>`,
    )
    .join("");
  const conditions = (request.answer_summary ?? []).map(
    (item) => `<li>${escapeEmailHtml(item)}</li>`,
  );
  const conditionHtml = conditions.length
    ? `<h2>Condition answers</h2><ul>${conditions.join("")}</ul>`
    : "";
  const conditionText = request.answer_summary?.length
    ? `\nCondition answers:\n${request.answer_summary.map((item) => `- ${item}`).join("\n")}`
    : "";

  return {
    subject: `[USED MOBILES] New Pickup Request - ${request.reference}`,
    html: `<!doctype html><html><body><main><h1>New pickup request</h1><table>${rows}</table>${conditionHtml}</main></body></html>`,
    text: `New pickup request\n\n${details.map(([label, value]) => `${label}: ${value}`).join("\n")}${conditionText}`,
  };
}

export async function sendResendEmail(
  email: PickupEmail,
  requestId: string,
  config: EmailConfig = {
    apiKey: process.env.RESEND_API_KEY,
    recipient: process.env.ADMIN_NOTIFICATION_EMAIL,
    from: process.env.EMAIL_FROM,
  },
  fetcher: typeof fetch = fetch,
): Promise<EmailResult> {
  if (!config.apiKey || !config.recipient || !config.from) {
    return { status: "failed", errorCode: "email_not_configured" };
  }

  try {
    const response = await fetcher("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `pickup-request/${requestId}`,
      },
      body: JSON.stringify({
        from: config.from,
        to: [config.recipient],
        subject: email.subject,
        html: email.html,
        text: email.text,
      }),
      signal: AbortSignal.timeout(8_000),
    });

    if (!response.ok) {
      return response.status >= 500
        ? { status: "unknown", errorCode: "provider_outcome_unknown" }
        : { status: "failed", errorCode: `provider_rejected_${response.status}` };
    }

    const body = (await response.json().catch(() => null)) as { id?: unknown } | null;
    return {
      status: "sent",
      providerMessageId: typeof body?.id === "string" ? body.id : null,
    };
  } catch {
    // A timeout can occur after the provider accepted the message. Keep it distinct from rejection.
    return { status: "unknown", errorCode: "provider_outcome_unknown" };
  }
}

export async function dispatchPickupNotification(
  requestId: string,
  repository: NotificationRepository,
  send: (email: PickupEmail, requestId: string) => Promise<EmailResult> = (email, id) =>
    sendResendEmail(email, id),
) {
  if (!(await repository.claim(requestId))) return "not_claimed" as const;

  const request = await repository.load(requestId);
  if (!request) {
    await repository.markFailure(requestId, "failed", "request_missing");
    return "failed" as const;
  }

  const result = await send(buildPickupEmail(request), requestId);
  if (result.status === "sent") {
    await repository.markSent(requestId, result.providerMessageId);
    return "sent" as const;
  }

  await repository.markFailure(requestId, result.status, result.errorCode);
  return result.status;
}
