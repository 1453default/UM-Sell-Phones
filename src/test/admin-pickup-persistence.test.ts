import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const adminRoute = readFileSync(
  resolve(process.cwd(), "src/routes/_authenticated/admin.tsx"),
  "utf8",
);
const pickupFunctions = readFileSync(resolve(process.cwd(), "src/lib/pickup.functions.ts"), "utf8");
const pickupServer = readFileSync(resolve(process.cwd(), "src/lib/pickup.server.ts"), "utf8");
const atomicMigration = readFileSync(
  resolve(process.cwd(), "drizzle/migrations/0002_secure_admin_and_pickup_outbox.sql"),
  "utf8",
);

describe("persistent admin pickup request flow", () => {
  it("commits a pickup row and its outbox entry through the atomic database RPC", () => {
    expect(pickupServer).toMatch(/rpc\("create_pickup_request_atomic"/);
    expect(pickupServer).toMatch(/requestId:\s*row\.request_id/);
    expect(pickupServer).toMatch(/reference:\s*row\.reference/);
    expect(atomicMigration).toMatch(
      /INSERT INTO public\.pickup_requests[\s\S]*?RETURNING id, pickup_requests\.reference/i,
    );
    expect(atomicMigration).toMatch(
      /IF v_created THEN[\s\S]*?INSERT INTO public\.pickup_notification_outbox/i,
    );
  });

  it("fetches saved database rows during every authorized admin route load", () => {
    expect(adminRoute).toMatch(
      /loader:\s*async\s*\(\)\s*=>\s*\{[\s\S]*?checkAdmin\(\)[\s\S]*?listPickupRequests\(\{\s*data:\s*\{\}\s*\}\)/,
    );
    expect(adminRoute).toMatch(/const \{ isAdmin, page: initialPage \} = Route\.useLoaderData\(\)/);
    expect(adminRoute).not.toMatch(/localStorage|sessionStorage|indexedDB/);
    expect(pickupFunctions).toMatch(/\.from\("pickup_requests"\)[\s\S]*?\.select\("\*"\)/);
  });

  it("keeps database errors distinct from a valid empty result", () => {
    expect(pickupFunctions).toMatch(
      /if\s*\(error\)\s*throw new Error\("Could not load pickup requests"\)/,
    );
    expect(adminRoute).toMatch(/Could not load pickup requests/);
  });

  it("keeps the server-side admin role gate before private query functions", () => {
    expect(pickupFunctions).toMatch(
      /async function assertAdmin[\s\S]*?_role:\s*"admin"[\s\S]*?if\s*\(!data\)\s*throw new Error\("Forbidden"\)/,
    );
    expect(pickupFunctions).toMatch(
      /\.handler\(async \(\{ data, context \}\) => \{\s*await assertAdmin\(context\)/,
    );
  });
});
