import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  resolve(process.cwd(), "drizzle/migrations/0004_telegram_lead_notifications.sql"),
  "utf8",
);
const adminPage = readFileSync(
  resolve(process.cwd(), "src/routes/_authenticated/admin.tsx"),
  "utf8",
);

describe("Telegram notification migration", () => {
  it("preserves old notification history and routes new rows to Telegram", () => {
    expect(migration).toMatch(/ADD COLUMN channel text NOT NULL DEFAULT 'email'/i);
    expect(migration).toMatch(/ALTER COLUMN channel SET DEFAULT 'telegram'/i);
  });

  it("allows retries only for Telegram rows with known non-delivery", () => {
    expect(migration).toMatch(/o\.channel\s*=\s*'telegram'/i);
    expect(migration).toMatch(/o\.status\s+IN\s*\('pending',\s*'failed'\)/i);
    expect(migration).not.toMatch(/o\.status\s*=\s*'sending'/i);
  });

  it("keeps historical rows visible without claiming they were delivered by Telegram", () => {
    expect(adminPage).toMatch(/notification\.channel\s*===\s*"email"/);
    expect(adminPage).toMatch(/Historical alert status retained/);
    expect(adminPage).toMatch(/Telegram lead alert/);
    expect(adminPage).not.toMatch(/Resend|Admin email notification|Retry admin email/);
  });
});
