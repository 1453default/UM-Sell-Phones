import { describe, expect, it, vi } from "vitest";
import { verifySupabaseAccessToken } from "@/integrations/supabase/auth-verification";
import { resolveAdminRole } from "@/lib/admin-access";

describe("Supabase request token verification", () => {
  it("uses the configured Auth server to validate a valid access token", async () => {
    const getUser = vi.fn().mockResolvedValue({
      data: { user: { id: "owner-user-id" } },
      error: null,
    });

    await expect(verifySupabaseAccessToken(getUser, "valid-access-token")).resolves.toEqual({
      id: "owner-user-id",
    });
    expect(getUser).toHaveBeenCalledWith("valid-access-token");
  });

  it.each([
    ["invalid", { name: "AuthApiError", status: 401 }],
    ["expired", { name: "AuthSessionMissingError", status: 401 }],
  ])("rejects an %s token", async (_label, error) => {
    const getUser = vi.fn().mockResolvedValue({ data: { user: null }, error });

    await expect(verifySupabaseAccessToken(getUser, "rejected-access-token")).rejects.toThrow(
      "Unauthorized: Invalid token",
    );
  });

  it("rejects a valid Supabase user who has no admin role", () => {
    expect(resolveAdminRole(false, null)).toBe(false);
  });
});
