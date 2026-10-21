import { createStart, createCsrfMiddleware, createMiddleware } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";

import { renderErrorPage } from "./lib/error-page";
import { attachSupabaseAuth } from "@/integrations/supabase/auth-attacher";

const errorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    const requestId = crypto.randomUUID();
    const request = getRequest();
    const rawCode = error && typeof error === "object" && "code" in error ? error.code : undefined;
    const errorCode =
      typeof rawCode === "string" && /^[A-Z0-9_]{1,20}$/.test(rawCode) ? rawCode : null;
    console.error("[Request] unhandled failure", {
      requestId,
      method: request?.method ?? "unknown",
      path: request ? new URL(request.url).pathname : "unknown",
      errorName: error instanceof Error ? error.name : "UnknownError",
      errorCode,
    });
    return new Response(renderErrorPage(), {
      status: 500,
      headers: {
        "content-type": "text/html; charset=utf-8",
        "x-request-id": requestId,
      },
    });
  }
});

// Start installs this automatically when src/start.ts is absent; defining the
// file opts out, so re-add it explicitly to keep server functions protected
// from cross-site requests.
const csrfMiddleware = createCsrfMiddleware({
  filter: (ctx) => ctx.handlerType === "serverFn",
});

export const startInstance = createStart(() => ({
  // Forward a session when the browser can read one. The middleware is
  // best-effort, and public pickup submission stays independent of auth.
  functionMiddleware: [attachSupabaseAuth],
  requestMiddleware: [errorMiddleware, csrfMiddleware],
}));
