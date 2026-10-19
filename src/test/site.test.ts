import { describe, expect, it } from "vitest";
import { canonicalUrl, SITE_URL } from "@/lib/site";

describe("canonical site URLs", () => {
  it("uses an absolute origin for the home page and nested routes", () => {
    expect(canonicalUrl("/")).toBe(`${SITE_URL}/`);
    expect(canonicalUrl("terms")).toBe(`${SITE_URL}/terms`);
    expect(new URL(canonicalUrl("/privacy")).origin).toBe(SITE_URL);
  });
});
