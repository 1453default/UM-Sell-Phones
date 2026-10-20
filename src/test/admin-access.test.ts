import { describe, expect, it } from "vitest";
import {
  AdminAccessUnavailableError,
  adminAccessErrorMessage,
  readAdminSession,
  resolveAdminRole,
} from "@/lib/admin-access";

describe("admin route access", () => {
  it("recognizes a valid authenticated session", async () => {
    await expect(
      readAdminSession(async () => ({ data: { user: { id: "synthetic-user" } }, error: null })),
    ).resolves.toEqual({ state: "authenticated" });
  });

  it("redirects a visitor without a session", async () => {
    await expect(
      readAdminSession(async () => ({ data: { user: null }, error: null })),
    ).resolves.toEqual({ state: "unauthenticated" });
  });

  it.each([
    { name: "AuthSessionMissingError" },
    { name: "AuthApiError", status: 401 },
    { name: "AuthApiError", status: 403 },
  ])("treats expired or invalid sessions as unauthenticated: %o", async (error) => {
    await expect(readAdminSession(async () => ({ data: { user: null }, error }))).resolves.toEqual({
      state: "unauthenticated",
    });
  });

  it("reports missing Supabase configuration as an unavailable service", async () => {
    const state = await readAdminSession(async () => {
      throw new Error("Missing Supabase environment variable(s): SUPABASE_URL");
    });
    expect(state).toEqual({ state: "unavailable", reason: "configuration" });
    expect(adminAccessErrorMessage(new AdminAccessUnavailableError("configuration"))).toContain(
      "VITE_SUPABASE_URL",
    );
  });

  it("does not mistake auth service errors for an unauthorized account", async () => {
    await expect(
      readAdminSession(async () => {
        throw new TypeError("fetch failed");
      }),
    ).resolves.toEqual({ state: "unavailable", reason: "backend" });
    expect(adminAccessErrorMessage(new Error("SQL details are private"))).not.toContain(
      "SQL details",
    );
  });

  it("allows an authorized admin and keeps a normal user blocked", () => {
    expect(resolveAdminRole(true, null)).toBe(true);
    expect(resolveAdminRole(false, null)).toBe(false);
  });

  it("does not turn a failed role lookup into a false non-admin result", () => {
    expect(() => resolveAdminRole(null, new Error("database unavailable"))).toThrow(
      AdminAccessUnavailableError,
    );
  });
});
