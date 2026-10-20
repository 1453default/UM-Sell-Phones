import { describe, expect, it } from "vitest";
import {
  ADMIN_REQUEST_PAGE_SIZE,
  nextPickupCursor,
  pickupPageFilter,
  type PickupCursor,
} from "@/lib/pickup.functions";

const cursor: PickupCursor = {
  createdAt: "2026-10-20T10:00:00.000Z",
  id: "00000000-0000-4000-8000-000000000050",
};

describe("admin pickup pagination", () => {
  it("returns no cursor for an empty or final page", () => {
    expect(nextPickupCursor([])).toBeNull();
    expect(nextPickupCursor([{ id: "one", created_at: cursor.createdAt }])).toBeNull();
  });

  it("uses the last visible row as the deterministic page boundary", () => {
    const rows = Array.from({ length: ADMIN_REQUEST_PAGE_SIZE + 1 }, (_, index) => ({
      id: `id-${index}`,
      created_at: cursor.createdAt,
    }));
    expect(nextPickupCursor(rows)).toEqual({
      createdAt: cursor.createdAt,
      id: `id-${ADMIN_REQUEST_PAGE_SIZE - 1}`,
    });
  });

  it("keeps newer rows from shifting a keyset page and includes the id tie-breaker", () => {
    const filter = pickupPageFilter(cursor, "");
    const rows = [
      { id: "new", created_at: "2026-10-20T11:00:00.000Z" },
      { id: "same-newer-id", created_at: cursor.createdAt },
      { id: "older", created_at: "2026-10-20T09:00:00.000Z" },
    ];
    const afterBoundary = rows.filter(
      (row) =>
        row.created_at < cursor.createdAt ||
        (row.created_at === cursor.createdAt && row.id < cursor.id),
    );
    expect(filter).toContain(`created_at.lt.${cursor.createdAt}`);
    expect(filter).toContain(`id.lt.${cursor.id}`);
    expect(afterBoundary.map((row) => row.id)).toEqual(["older"]);
  });

  it("combines search with pagination and strips filter syntax from search input", () => {
    const filter = pickupPageFilter(cursor, "UM-1),or(status.eq.cancelled");
    expect(filter.startsWith("and(or(")).toBe(true);
    expect(filter).toContain("reference.ilike.*UM-1 or status eq cancelled*");
    expect(filter).not.toContain(",or(status.eq.cancelled");
  });
});
