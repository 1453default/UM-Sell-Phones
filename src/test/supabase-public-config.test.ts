import { afterEach, describe, expect, it } from "vitest";
import {
  getSupabasePublishableKey,
  getSupabaseUrl,
  PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  PUBLIC_SUPABASE_URL,
} from "@/integrations/supabase/public-config";

const envKeys = [
  "SUPABASE_URL",
  "SUPABASE_PUBLISHABLE_KEY",
  "VITE_SUPABASE_URL",
  "VITE_SUPABASE_PUBLISHABLE_KEY",
] as const;
const originalEnv = new Map(envKeys.map((key) => [key, process.env[key]]));

afterEach(() => {
  for (const key of envKeys) {
    const original = originalEnv.get(key);
    if (original === undefined) delete process.env[key];
    else process.env[key] = original;
  }
});

describe("shared Supabase public settings", () => {
  it("uses the committed public project settings when no environment is configured", () => {
    for (const key of envKeys) delete process.env[key];

    expect(getSupabaseUrl()).toBe(PUBLIC_SUPABASE_URL);
    expect(getSupabasePublishableKey()).toBe(PUBLIC_SUPABASE_PUBLISHABLE_KEY);
  });

  it("uses server overrides before build-time public overrides", () => {
    process.env.SUPABASE_URL = "https://server.example.test";
    process.env.SUPABASE_PUBLISHABLE_KEY = "sb_publishable_server";
    process.env.VITE_SUPABASE_URL = "https://browser.example.test";
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_browser";

    expect(getSupabaseUrl()).toBe("https://server.example.test");
    expect(getSupabasePublishableKey()).toBe("sb_publishable_server");
  });

  it("accepts matching Vite public overrides when server aliases are not set", () => {
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_PUBLISHABLE_KEY;
    process.env.VITE_SUPABASE_URL = "https://browser.example.test";
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_browser";

    expect(getSupabaseUrl()).toBe("https://browser.example.test");
    expect(getSupabasePublishableKey()).toBe("sb_publishable_browser");
  });
});
