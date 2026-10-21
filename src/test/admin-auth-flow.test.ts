import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const loginPage = readFileSync(resolve(process.cwd(), "src/routes/auth.tsx"), "utf8");
const recoveryRoute = readFileSync(resolve(process.cwd(), "src/routes/reset-password.tsx"), "utf8");
const adminRoute = readFileSync(
  resolve(process.cwd(), "src/routes/_authenticated/admin.tsx"),
  "utf8",
);

describe("single administrator authentication flow", () => {
  it("checks the server-side admin role after password login and rejects non-admins", () => {
    expect(loginPage).toMatch(/signInWithPassword/);
    expect(loginPage).toMatch(/checkAdminFn\(\)/);
    expect(loginPage).toMatch(/if\s*\(!isAdmin\)[\s\S]*?signOut\(\{\s*scope:\s*"local"\s*\}\)/);
    expect(loginPage).toMatch(/Unable to sign in with those credentials/);
    expect(loginPage).not.toMatch(/resetPasswordForEmail|signUp\s*\(/);
  });

  it("clears sessions from stale recovery or invitation links", () => {
    expect(recoveryRoute).toMatch(/supabase\.auth\s*\.signOut\(\{\s*scope:\s*"local"\s*\}\)/);
    expect(recoveryRoute).toMatch(/navigate\(\{\s*to:\s*"\/auth"/);
    expect(recoveryRoute).not.toMatch(/updateUser|resetPasswordForEmail/);
  });

  it("invalidates the Supabase session when the administrator signs out", () => {
    expect(adminRoute).toMatch(/await supabase\.auth\.signOut\(\)/);
  });
});
