import { createStart, createCsrfMiddleware, createMiddleware } from "@tanstack/react-start";

import { renderErrorPage } from "./lib/error-page";
import { supabase } from "@/integrations/supabase/client";

const errorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    console.error(error);
    return new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
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
  functionMiddleware: [attachSessionIfAvailable],
  requestMiddleware: [errorMiddleware, csrfMiddleware],
}));
