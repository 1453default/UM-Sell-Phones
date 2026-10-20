export type AdminAccessFailureReason = "configuration" | "backend";

export class AdminAccessUnavailableError extends Error {
  constructor(readonly reason: AdminAccessFailureReason) {
    super("Admin access is temporarily unavailable.");
    this.name = "AdminAccessUnavailableError";
  }
}

type SupabaseAuthError = { name?: string; status?: number; message?: string } | null;

function isExpiredSession(error: SupabaseAuthError) {
  return (
    error?.name === "AuthSessionMissingError" || error?.status === 401 || error?.status === 403
  );
}

function isMissingConfiguration(error: unknown) {
  return error instanceof Error && /missing supabase environment variable/i.test(error.message);
}

export async function readAdminSession(
  getUser: () => Promise<{ data: { user: unknown | null }; error: SupabaseAuthError }>,
) {
  try {
    const { data, error } = await getUser();
    if (error) {
      return isExpiredSession(error)
        ? ({ state: "unauthenticated" } as const)
        : ({ state: "unavailable", reason: "backend" } as const);
    }
    return data.user
      ? ({ state: "authenticated" } as const)
      : ({ state: "unauthenticated" } as const);
  } catch (error) {
    return {
      state: "unavailable" as const,
      reason: isMissingConfiguration(error) ? ("configuration" as const) : ("backend" as const),
    };
  }
}

export function resolveAdminRole(data: boolean | null, error: unknown) {
  if (error) throw new AdminAccessUnavailableError("backend");
  return data === true;
}

export function adminAccessErrorMessage(error: unknown) {
  if (error instanceof AdminAccessUnavailableError && error.reason === "configuration") {
    return "Secure sign-in is not configured here. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY for the browser, and SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY on the server.";
  }
  return "We could not verify your session or load pickup requests. Check the service connection and try again.";
}
