import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const baseline = readFileSync(
  resolve(process.cwd(), "drizzle/migrations/0000_migration.sql"),
  "utf8",
);
const hardening = readFileSync(
  resolve(process.cwd(), "drizzle/migrations/0002_secure_admin_and_pickup_outbox.sql"),
  "utf8",
);

describe("admin bootstrap migration", () => {
  it("removes first-account auto-admin and preserves existing role rows", () => {
    expect(baseline).toMatch(/CREATE\s+TRIGGER\s+on_auth_user_created_admin/i);
    expect(hardening).toMatch(/DROP\s+TRIGGER\s+IF\s+EXISTS\s+on_auth_user_created_admin/i);
    expect(hardening).toMatch(/DROP\s+FUNCTION\s+IF\s+EXISTS\s+public\.grant_first_admin\s*\(\)/i);
    expect(hardening).not.toMatch(/(?:DELETE|TRUNCATE)\s+(?:FROM\s+)?public\.user_roles/i);
  });
});
