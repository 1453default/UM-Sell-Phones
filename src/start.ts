import { createStart, createCsrfMiddleware, createMiddleware } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";

import { renderErrorPage } from "./lib/error-page";
<<<<<<< HEAD
=======
import { supabase } from "@/integrations/supabase/client";
>>>>>>> 82b3de4d68f96599d8612343ab3e124a89323dea

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

// Attach the staff session when available; a missing or unreadable session must
// never block public calls such as pickup booking (protected calls still verify on the server).
const attachSessionIfAvailable = createMiddleware({ type: "function" }).client(async ({ next }) => {
  try {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    return next({ headers: token ? { Authorization: `Bearer ${token}` } : {} });
  } catch (error) {
    console.error("Session unavailable; continuing without sign-in", error);
    return next();
  }
});

export const startInstance = createStart(() => ({
<<<<<<< HEAD
  // Authenticated server functions attach the session on their own. Public pickup
  // submission must not require a browser Supabase session to reach the server.
=======
  functionMiddleware: [attachSessionIfAvailable],
>>>>>>> 82b3de4d68f96599d8612343ab3e124a89323dea
  requestMiddleware: [errorMiddleware, csrfMiddleware],
}));
